import asyncio
import uuid

from fastapi import Response
from starlette.requests import Request

import auth
import server
import order_service
import product_service


class FakeCollection:
    def __init__(self):
        self.docs = []

    async def find_one(self, query=None, projection=None):
        query = query or {}
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                return dict(doc)
        return None

    def find(self, query=None, projection=None):
        query = query or {}
        result = []
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                result.append(dict(doc))
        if "$or" in query:
            result = []
            for doc in self.docs:
                for cond in query["$or"]:
                    if all(doc.get(k) == v for k, v in cond.items()):
                        result.append(dict(doc))
                        break
        return FakeCursor(result)

    async def insert_one(self, doc):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = str(uuid.uuid4())
        self.docs.append(new_doc)
        return type("Result", (), {"inserted_id": new_doc["_id"]})()

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                for key, value in update.get("$set", {}).items():
                    doc[key] = value
        if upsert:
            new_doc = dict(query)
            for key, value in update.get("$set", {}).items():
                new_doc[key] = value
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            self.docs.append(new_doc)

    async def count_documents(self, query=None):
        query = query or {}
        if "$or" in query:
            count = 0
            for doc in self.docs:
                for cond in query["$or"]:
                    if all(doc.get(k) == v for k, v in cond.items()):
                        count += 1
                        break
            return count
        return sum(1 for doc in self.docs if all(doc.get(k) == v for k, v in query.items()))


class FakeCursor:
    def __init__(self, docs):
        self.docs = [dict(d) for d in docs]
        self._skip = 0
        self._limit = None

    def sort(self, key, direction=1):
        reverse = direction == -1
        self.docs.sort(key=lambda d: d.get(key), reverse=reverse)
        return self

    def skip(self, value):
        self._skip = value
        return self

    def limit(self, value):
        self._limit = value
        return self

    async def to_list(self, limit=None):
        start = self._skip
        end = None if self._limit is None else start + self._limit
        if limit is not None and (end is None or limit < end - start):
            end = start + limit
        return [dict(d) for d in self.docs[start:end]]


class FakeDB:
    def __init__(self):
        self.products = FakeCollection()
        self.orders = FakeCollection()
        self.users = FakeCollection()
        self.sessions = FakeCollection()
        self.auth_rate_limits = FakeCollection()


def make_request(cookies=None):
    cookie_header = ""
    if cookies:
        cookie_header = "; ".join(f"{key}={value}" for key, value in cookies.items())
    headers = [(b"cookie", cookie_header.encode())] if cookie_header else []
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers, "client": ("127.0.0.1", 1234)})


async def create_user(db, email, password, role):
    return await auth.create_user(db, email, password, role)


def seed_product(db, product_id="p1", price=38, in_stock=True, colors=None):
    asyncio.run(db.products.insert_one({
        "id": product_id,
        "name": "Test Product",
        "category": "home-decor",
        "price": price,
        "material": "PLA",
        "materials": ["PLA"],
        "colors": colors or ["Petrol", "Ivory"],
        "inStock": in_stock,
        "images": ["https://example.com/image.jpg"],
    }))


def test_storefront_order_calculates_totals_and_shipping(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    seed_product(db, price=38)
    from order_schemas import OrderCreate
    payload = OrderCreate(
        email="buyer@example.com",
        first_name="Buyer",
        last_name="Example",
        shipping_address="Street 1",
        city="Athens",
        postal_code="12345",
        country="Greece",
        items=[{"product_id": "p1", "quantity": 2, "color": "Petrol"}],
    )
    order = asyncio.run(order_service.create_order(db, payload, source="storefront", created_by=None, ip="127.0.0.1"))
    assert order["subtotal"] == 76
    assert order["shipping"] == 0
    assert order["total"] == 76
    assert order["items"][0]["unit_price"] == 38
    assert order["items"][0]["line_total"] == 76
    assert order["payment_status"] == "not_integrated"


def test_shipping_threshold_boundary(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    seed_product(db, price=74.99)
    from order_schemas import OrderCreate
    payload = OrderCreate(
        email="buyer@example.com",
        first_name="Buyer",
        last_name="Example",
        shipping_address="Street 1",
        city="Athens",
        postal_code="12345",
        country="Greece",
        items=[{"product_id": "p1", "quantity": 1}],
    )
    order = asyncio.run(order_service.create_order(db, payload, source="storefront", created_by=None, ip="127.0.0.1"))
    assert order["subtotal"] == 74.99
    assert order["shipping"] == 8.5
    assert order["total"] == 83.49


def test_invalid_and_unavailable_products_rejected(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    seed_product(db, in_stock=False)
    from order_schemas import OrderCreate
    payload = OrderCreate(
        email="buyer@example.com",
        first_name="Buyer",
        last_name="Example",
        shipping_address="Street 1",
        city="Athens",
        postal_code="12345",
        country="Greece",
        items=[{"product_id": "p1", "quantity": 1}],
    )
    try:
        asyncio.run(order_service.create_order(db, payload, source="storefront", created_by=None, ip="127.0.0.1"))
    except ValueError as exc:
        assert "unavailable" in str(exc)
    else:
        raise AssertionError("expected unavailable error")

    payload.items[0].product_id = "missing"
    try:
        asyncio.run(order_service.create_order(db, payload, source="storefront", created_by=None, ip="127.0.0.1"))
    except ValueError as exc:
        assert "not found" in str(exc)
    else:
        raise AssertionError("expected not found error")

    try:
        OrderCreate(
            email="buyer@example.com",
            first_name="Buyer",
            last_name="Example",
            shipping_address="Street 1",
            city="Athens",
            postal_code="12345",
            country="Greece",
            items=[],
        )
    except Exception:
        pass
    else:
        raise AssertionError("expected empty cart validation error")


def test_admin_order_authorization(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    support = asyncio.run(create_user(db, "support@example.com", "password123456", "support"))
    admin_token, _ = asyncio.run(auth.create_session(db, admin["_id"]))
    support_token, _ = asyncio.run(auth.create_session(db, support["_id"]))
    admin_request = make_request(cookies={auth.SESSION_COOKIE_NAME: admin_token})
    support_request = make_request(cookies={auth.SESSION_COOKIE_NAME: support_token})
    unauth = make_request()

    for request in (unauth, support_request):
        try:
            asyncio.run(server.admin_list_orders(request))
        except Exception as exc:
            assert getattr(exc, "status_code", None) in (401, 403)
        else:
            raise AssertionError("expected auth error")

    assert asyncio.run(server.admin_list_orders(admin_request)) is not None

    try:
        asyncio.run(server.admin_create_order(
            AdminOrderCreate if False else order_service.create_order and __import__("order_schemas").AdminOrderCreate(
                email="buyer@example.com",
                first_name="Buyer",
                last_name="Example",
                shipping_address="Street 1",
                city="Athens",
                postal_code="12345",
                country="Greece",
                items=[],
            ),
            admin_request,
        ))
    except Exception:
        pass


def test_admin_manual_order_and_status_update(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    admin_token, csrf_token = asyncio.run(auth.create_session(db, admin["_id"]))
    seed_product(db, price=10)
    from order_schemas import AdminOrderCreate
    payload = AdminOrderCreate(
        email="buyer@example.com",
        first_name="Buyer",
        last_name="Example",
        shipping_address="Street 1",
        city="Athens",
        postal_code="12345",
        country="Greece",
        items=[{"product_id": "p1", "quantity": 2}],
    )
    order = asyncio.run(order_service.create_order(db, payload, source="admin", created_by=admin["_id"], ip=None))
    asyncio.run(order_service.update_order(db, order["id"], {"status": "processing"}, user={"id": admin["_id"], "role": "admin"}))
    updated = asyncio.run(order_service.update_order(db, order["id"], {"status": "shipped", "notes": "Packed"}, user={"id": admin["_id"], "role": "admin"}))
    assert updated["status"] == "shipped"
    assert updated["notes"] == "Packed"
    assert updated["subtotal"] == 20
    assert updated["shipping"] == 8.5
    assert updated["total"] == 28.5
    # Metadata edit does not recalculate totals.
    updated = asyncio.run(order_service.update_order(db, order["id"], {"notes": "Relabeled"}, user={"id": admin["_id"], "role": "admin"}))
    assert updated["subtotal"] == 20
    assert updated["total"] == 28.5

    # Endpoint-level support denial.
    support = asyncio.run(create_user(db, "support@example.com", "password123456", "support"))
    support_token, _ = asyncio.run(auth.create_session(db, support["_id"]))
    support_request = make_request(cookies={auth.SESSION_COOKIE_NAME: support_token})
    try:
        asyncio.run(server.admin_get_order(order["id"], support_request))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    else:
        raise AssertionError("expected 403")


def test_storefront_order_endpoint(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    seed_product(db, price=10)
    from order_schemas import OrderCreate
    from fastapi import Response
    request = make_request()
    payload = OrderCreate(
        email="buyer@example.com",
        first_name="Buyer",
        last_name="Example",
        shipping_address="Street 1",
        city="Athens",
        postal_code="12345",
        country="Greece",
        items=[{"product_id": "p1", "quantity": 1}],
    )
    result = asyncio.run(server.create_storefront_order(payload, request))
    assert result["id"]
    assert result["total"] == 18.5
    assert result["payment_status"] == "not_integrated"


def test_order_idempotency_and_zero_priced_cart(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    seed_product(db, price=0)

    from order_schemas import OrderCreate
    payload = OrderCreate(
        email="buyer@example.com",
        first_name="Buyer",
        last_name="Example",
        shipping_address="Street 1",
        city="Athens",
        postal_code="12345",
        country="Greece",
        items=[{"product_id": "p1", "quantity": 2}],
        client_order_id="same-key",
    )
    first = asyncio.run(order_service.create_order(db, payload, source="storefront", created_by=None, ip="127.0.0.1"))
    second = asyncio.run(order_service.create_order(db, payload, source="storefront", created_by=None, ip="127.0.0.1"))
    assert first["id"] == second["id"]
    assert len(db.orders.docs) == 1
    assert first["subtotal"] == 0
    assert first["shipping"] == 8.5
    assert first["total"] == 8.5

    try:
        asyncio.run(order_service.create_order(
            db,
            OrderCreate(
                email="buyer@example.com",
                first_name="Buyer",
                last_name="Example",
                shipping_address="Street 1",
                city="Athens",
                postal_code="12345",
                country="Greece",
                items=[],
            ),
            source="storefront",
            created_by=None,
            ip="127.0.0.1",
        ))
    except Exception as exc:
        assert "empty" in str(exc).lower() or "items" in str(exc).lower()
    else:
        raise AssertionError("expected empty cart rejection")


def test_order_status_transitions(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    seed_product(db, price=10)
    from order_schemas import AdminOrderCreate
    order = asyncio.run(order_service.create_order(
        db,
        AdminOrderCreate(
            email="buyer@example.com",
            first_name="Buyer",
            last_name="Example",
            shipping_address="Street 1",
            city="Athens",
            postal_code="12345",
            country="Greece",
            items=[{"product_id": "p1", "quantity": 1}],
        ),
        source="admin",
        created_by=admin["_id"],
        ip=None,
    ))
    asyncio.run(order_service.update_order(db, order["id"], {"status": "processing"}, user={"id": admin["_id"], "role": "admin"}))
    asyncio.run(order_service.update_order(db, order["id"], {"status": "shipped"}, user={"id": admin["_id"], "role": "admin"}))
    asyncio.run(order_service.update_order(db, order["id"], {"status": "delivered"}, user={"id": admin["_id"], "role": "admin"}))

    try:
        asyncio.run(order_service.update_order(db, order["id"], {"status": "cancelled"}, user={"id": admin["_id"], "role": "admin"}))
    except ValueError as exc:
        assert "transition" in str(exc)
    else:
        raise AssertionError("expected invalid transition")


def test_admin_order_route_authorization(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    support = asyncio.run(create_user(db, "support@example.com", "password123456", "support"))
    admin_token, admin_csrf = asyncio.run(auth.create_session(db, admin["_id"]))
    support_token, support_csrf = asyncio.run(auth.create_session(db, support["_id"]))
    admin_request = make_request(cookies={auth.SESSION_COOKIE_NAME: admin_token, auth.CSRF_COOKIE_NAME: admin_csrf})
    support_request = make_request(cookies={auth.SESSION_COOKIE_NAME: support_token, auth.CSRF_COOKIE_NAME: support_csrf})
    unauth_request = make_request()

    seed_product(db, price=10)
    from order_schemas import AdminOrderCreate
    payload = AdminOrderCreate(
        email="buyer@example.com",
        first_name="Buyer",
        last_name="Example",
        shipping_address="Street 1",
        city="Athens",
        postal_code="12345",
        country="Greece",
        items=[{"product_id": "p1", "quantity": 1}],
    )

    # Unauthenticated and support are denied for create.
    for request in (unauth_request, support_request):
        try:
            asyncio.run(server.admin_create_order(payload, request))
        except Exception as exc:
            assert getattr(exc, "status_code", None) in (401, 403)
        else:
            raise AssertionError("expected auth error")

    # Admin can create.
    admin_create_request = make_request(cookies={auth.SESSION_COOKIE_NAME: admin_token, auth.CSRF_COOKIE_NAME: admin_csrf})
    # server.admin_create_order requires CSRF header.
    admin_create_request = Request({
        "type": "http",
        "method": "POST",
        "path": "/",
        "headers": [
            (b"cookie", f"{auth.SESSION_COOKIE_NAME}={admin_token}; {auth.CSRF_COOKIE_NAME}={admin_csrf}".encode()),
            (b"x-csrf-token", admin_csrf.encode()),
        ],
        "client": ("127.0.0.1", 1234),
    })
    order = asyncio.run(server.admin_create_order(payload, admin_create_request))
    assert order["id"]

    # Unauthenticated and support are denied for update.
    update_payload = server.OrderUpdate(status="processing")
    for request in (unauth_request, support_request):
        try:
            asyncio.run(server.admin_update_order(order["id"], update_payload, request))
        except Exception as exc:
            assert getattr(exc, "status_code", None) in (401, 403)
        else:
            raise AssertionError("expected auth error")
