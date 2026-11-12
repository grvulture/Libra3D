import asyncio
import uuid

from fastapi import Response
from starlette.requests import Request

import auth
import server
import product_service



def _matches(doc, query):
    if not query:
        return True
    if "$or" in query:
        base = {k: v for k, v in query.items() if k != "$or"}
        if not all(_match_condition(doc, k, v) for k, v in base.items()):
            return False
        return any(_matches(doc, {k: v}) for cond in query["$or"] for k, v in [list(cond.items())[0]] if False) or any(
            all(_match_condition(doc, k, v) for k, v in cond.items()) for cond in query["$or"]
        )
    return all(_match_condition(doc, k, v) for k, v in query.items())


def _match_condition(doc, key, value):
    if isinstance(value, dict) and "$regex" in value:
        import re
        flags = 0
        if "i" in value.get("$options", ""):
            flags = re.IGNORECASE
        return re.search(value["$regex"], str(doc.get(key, "")), flags) is not None
    return doc.get(key) == value

class FakeCollection:
    def __init__(self):
        self.docs = []

    async def find_one(self, query=None, projection=None):
        query = query or {}
        for doc in self.docs:
            if _matches(doc, query):
                return dict(doc)
        return None

    def find(self, query=None, projection=None):
        query = query or {}
        result = []
        for doc in self.docs:
            if _matches(doc, query):
                result.append(dict(doc))
        cursor = FakeCursor(result)
        return cursor

    async def insert_one(self, doc):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = str(uuid.uuid4())
        self.docs.append(new_doc)
        return type("Result", (), {"inserted_id": new_doc["_id"]})()

    async def update_one(self, query, update):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                for key, value in update.get("$set", {}).items():
                    doc[key] = value

    async def count_documents(self, query=None):
        query = query or {}
        return sum(1 for doc in self.docs if _matches(doc, query))


class FakeCursor:
    def __init__(self, docs):
        self.docs = [dict(d) for d in docs]
        self._sort = None
        self._skip = 0
        self._limit = None

    def sort(self, key, direction=1):
        self._sort = (key, direction == -1)
        return self

    def skip(self, value):
        self._skip = value
        return self

    def limit(self, value):
        self._limit = value
        return self

    async def to_list(self, limit=None):
        docs = list(self.docs)
        if self._sort:
            key, reverse = self._sort
            docs.sort(key=lambda d: d.get(key), reverse=reverse)
        start = self._skip
        end = None if self._limit is None else start + self._limit
        if limit is not None and (end is None or limit < end - start):
            end = start + limit
        return [dict(d) for d in docs[start:end]]


class FakeDB:
    def __init__(self):
        self.products = FakeCollection()
        self.users = FakeCollection()
        self.sessions = FakeCollection()


def make_request(cookies=None):
    cookie_header = ""
    if cookies:
        cookie_header = "; ".join(f"{key}={value}" for key, value in cookies.items())
    headers = [(b"cookie", cookie_header.encode())] if cookie_header else []
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers, "client": ("127.0.0.1", 1234)})


async def create_user(db, email, password, role):
    return await auth.create_user(db, email, password, role)


def test_admin_product_authorization(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    support = asyncio.run(create_user(db, "support@example.com", "password123456", "support"))
    admin_token, _ = asyncio.run(auth.create_session(db, admin["_id"]))
    support_token, _ = asyncio.run(auth.create_session(db, support["_id"]))

    unauth = make_request()
    try:
        asyncio.run(server.admin_list_products(unauth))
    except Exception as exc:
        assert getattr(exc, "status_code", None) in (401, 403)
    else:
        raise AssertionError("expected auth error")

    support_request = make_request(cookies={auth.SESSION_COOKIE_NAME: support_token})
    try:
        asyncio.run(server.admin_list_products(support_request))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    else:
        raise AssertionError("expected 403")

    admin_request = make_request(cookies={auth.SESSION_COOKIE_NAME: admin_token})
    result = asyncio.run(server.admin_list_products(admin_request))
    assert result["total"] == 0


def test_admin_product_create_edit_and_storefront_compatibility(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    admin_token, csrf_token = asyncio.run(auth.create_session(db, admin["_id"]))
    request = make_request(cookies={auth.SESSION_COOKIE_NAME: admin_token, auth.CSRF_COOKIE_NAME: csrf_token})
    # admin_list_products is GET; mutations need CSRF header. Use direct service for create/update and endpoint for list.
    product = {
        "id": "test-product",
        "name": "Test Product",
        "category": "home-decor",
        "price": 10,
        "material": "PLA",
    }
    created = asyncio.run(product_service.create_product(db, product))
    assert created["id"] == "test-product"

    # duplicate
    try:
        asyncio.run(product_service.create_product(db, product))
    except ValueError as exc:
        assert "already exists" in str(exc)
    else:
        raise AssertionError("expected duplicate error")

    # invalid category
    try:
        asyncio.run(product_service.create_product(db, {**product, "id": "other", "category": "not-a-category"}))
    except ValueError as exc:
        assert "invalid category" in str(exc)
    else:
        raise AssertionError("expected invalid category")

    updated = asyncio.run(product_service.update_product(db, "test-product", {"name": "Updated Product", "price": 12}))
    assert updated["name"] == "Updated Product"
    assert updated["price"] == 12

    # Storefront public API returns the same product.
    storefront = asyncio.run(server.get_products())
    assert any(p["id"] == "test-product" and p["name"] == "Updated Product" for p in storefront)


def test_admin_product_search_filter_pagination(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    for index in range(3):
        asyncio.run(db.products.insert_one({
            "id": f"product-{index}",
            "name": f"Product {index}",
            "category": "home-decor" if index < 2 else "gifts",
            "price": 10 + index,
            "material": "PLA",
            "inStock": index != 1,
        }))

    result = asyncio.run(product_service.list_products(db, page=1, page_size=2, query="Product", category="home-decor"))
    assert result["total"] == 2
    assert len(result["items"]) == 2

    result = asyncio.run(product_service.list_products(db, page=1, page_size=10, in_stock=False))
    assert result["total"] == 1

    result = asyncio.run(product_service.list_products(db, page=2, page_size=2, query="Product"))
    assert result["page"] == 2
    assert len(result["items"]) == 1
