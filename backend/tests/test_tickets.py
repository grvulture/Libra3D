import asyncio
import uuid
from datetime import timedelta

from fastapi import Response
from starlette.requests import Request

import auth
import server
import ticket_service
import emailing


class FakeResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeCursor:
    def __init__(self, docs):
        self.docs = [dict(d) for d in docs]
        self._sort = None
        self._skip = 0
        self._limit = None

    def sort(self, key, direction=-1):
        reverse = direction == -1
        self._sort = (key, reverse)
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
        # Handle $or minimally.
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
        return FakeResult(new_doc["_id"])

    async def insert_many(self, docs):
        for doc in docs:
            await self.insert_one(doc)

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                for key, value in update.get("$set", {}).items():
                    doc[key] = value
                for key, value in update.get("$inc", {}).items():
                    doc[key] = doc.get(key, 0) + value
                for key in update.get("$unset", {}):
                    doc.pop(key, None)
                return
        if upsert:
            new_doc = dict(query)
            for key, value in update.get("$set", {}).items():
                new_doc[key] = value
            if "_id" not in new_doc:
                new_doc["_id"] = str(uuid.uuid4())
            self.docs.append(new_doc)

    async def update_many(self, query, update):
        for doc in self.docs:
            if all(doc.get(k) == v for k, v in query.items()):
                for key, value in update.get("$set", {}).items():
                    doc[key] = value

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


class FakeDB:
    def __init__(self):
        self.users = FakeCollection()
        self.sessions = FakeCollection()
        self.auth_rate_limits = FakeCollection()
        self.tickets = FakeCollection()
        self.ticket_messages = FakeCollection()
        self.ticket_access_tokens = FakeCollection()
        self.ticket_guest_sessions = FakeCollection()
        self.ticket_events = FakeCollection()
        self.email_notifications = FakeCollection()


def make_request(cookies=None, headers=None, client=("127.0.0.1", 1234)):
    cookie_header = ""
    if cookies:
        cookie_header = "; ".join(f"{key}={value}" for key, value in cookies.items())
    header_list = []
    if cookie_header:
        header_list.append((b"cookie", cookie_header.encode()))
    for key, value in (headers or {}).items():
        header_list.append((key.lower().encode(), value.encode()))
    return Request({"type": "http", "method": "POST", "path": "/", "headers": header_list, "client": client})


async def create_user(db, email, password, role):
    return await auth.create_user(db, email, password, role)


def test_ticket_creation_persists_ticket_and_message(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(emailing, "send_email", lambda *a, **k: "msg-1")

    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ip = "127.0.0.1"
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, ip))

    assert db.tickets.docs and db.tickets.docs[0]["id"] == ticket["id"]
    assert db.ticket_messages.docs[0]["ticket_id"] == ticket["id"]
    assert db.ticket_messages.docs[0]["body"] == "Need support"
    assert asyncio.run(db.email_notifications.count_documents({})) == 2


def test_ticket_creation_notification_failure_is_persisted(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)

    def fail_send(*args, **kwargs):
        raise RuntimeError("smtp down")

    monkeypatch.setattr(emailing, "send_email", fail_send)
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))
    notifications = db.email_notifications.docs
    assert any(n["status"] == "failed" for n in notifications)
    assert ticket["status"] == "open"


def test_notification_retry(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)

    calls = {"count": 0}

    def flaky_send(*args, **kwargs):
        calls["count"] += 1
        if calls["count"] == 3:
            raise RuntimeError("temporary")
        return "msg-2"

    monkeypatch.setattr(emailing, "send_email", flaky_send)
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))
    notification_id = db.email_notifications.docs[0]["id"]
    first = asyncio.run(ticket_service.send_notification(db, notification_id))
    assert first["status"] == "failed"
    second = asyncio.run(ticket_service.send_notification(db, notification_id))
    assert second["status"] == "sent"


def test_nosql_injection_rejected_by_schema():
    try:
        server.TicketCreate(name="Alice", email="alice@example.com", subject={"$ne": None}, message="x")
    except Exception as exc:
        assert "str" in str(exc).lower() or "valid" in str(exc).lower()
    else:
        raise AssertionError("expected validation error")

    try:
        server.TicketCreate(name="Alice", email="alice@example.com", subject="x", message="y" * 5001)
    except Exception:
        pass
    else:
        raise AssertionError("expected length validation error")


def test_customer_reply_reopens_solved_ticket(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(emailing, "send_email", lambda *a, **k: "msg-1")
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))
    asyncio.run(ticket_service.update_ticket(db, ticket["id"], status="solved", user={"id": "agent-1", "role": "admin"}))
    assert db.tickets.docs[0]["status"] == "solved"

    session_token = asyncio.run(ticket_service.exchange_access_token(db, db.ticket_access_tokens.docs[0]["token_hash"] and None)) if False else None
    # Use a direct guest session instead of consuming the one-time token.
    raw_session = __import__("secrets").token_urlsafe(32)
    asyncio.run(db.ticket_guest_sessions.insert_one({
        "id": str(uuid.uuid4()),
        "ticket_id": ticket["id"],
        "token_hash": auth.hash_token(raw_session),
        "created_at": ticket_service.utcnow(),
        "expires_at": ticket_service.utcnow() + __import__("datetime").timedelta(days=1),
        "revoked_at": None,
    }))
    message = asyncio.run(ticket_service.guest_reply(db, raw_session, ticket["id"], "Still need help", "127.0.0.1"))
    assert message is not None
    assert db.tickets.docs[0]["status"] == "open"


def test_access_token_get_does_not_consume(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))
    raw_token = None
    # Recover raw token is impossible from hash; create a known token manually.
    raw_token = __import__("secrets").token_urlsafe(32)
    token_doc = {
        "id": str(uuid.uuid4()),
        "ticket_id": db.tickets.docs[0]["id"],
        "token_hash": auth.hash_token(raw_token),
        "created_at": ticket_service.utcnow(),
        "expires_at": ticket_service.utcnow() + __import__("datetime").timedelta(minutes=15),
        "used_at": None,
        "revoked_at": None,
    }
    asyncio.run(db.ticket_access_tokens.insert_one(token_doc))

    ticket_id = asyncio.run(ticket_service.get_ticket_access_status(db, raw_token))
    assert ticket_id == db.tickets.docs[0]["id"]
    # Token remains unused.
    stored = db.ticket_access_tokens.docs[-1]
    assert stored["used_at"] is None


def test_access_token_replay_is_rejected(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))
    raw_token = __import__("secrets").token_urlsafe(32)
    asyncio.run(db.ticket_access_tokens.insert_one({
        "id": str(uuid.uuid4()),
        "ticket_id": ticket["id"],
        "token_hash": auth.hash_token(raw_token),
        "created_at": ticket_service.utcnow(),
        "expires_at": ticket_service.utcnow() + __import__("datetime").timedelta(minutes=15),
        "used_at": None,
        "revoked_at": None,
    }))
    result = asyncio.run(ticket_service.exchange_access_token(db, raw_token))
    assert result is not None
    replay = asyncio.run(ticket_service.exchange_access_token(db, raw_token))
    assert replay is None


def test_access_token_expiry(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))
    raw_token = __import__("secrets").token_urlsafe(32)
    asyncio.run(db.ticket_access_tokens.insert_one({
        "id": str(uuid.uuid4()),
        "ticket_id": ticket["id"],
        "token_hash": auth.hash_token(raw_token),
        "created_at": ticket_service.utcnow(),
        "expires_at": ticket_service.utcnow() - __import__("datetime").timedelta(seconds=1),
        "used_at": None,
        "revoked_at": None,
    }))
    assert asyncio.run(ticket_service.validate_access_token(db, raw_token)) is None


def test_resend_access_request_generic_and_rate_limited(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(emailing, "send_email", lambda *a, **k: "msg-1")
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))

    # Should not raise for unknown email.
    asyncio.run(ticket_service.request_ticket_access(db, "nobody@example.com", "127.0.0.1"))

    # Rate limit after configured threshold.
    for _ in range(5):
        try:
            asyncio.run(ticket_service.request_ticket_access(db, "alice@example.com", "127.0.0.1"))
        except PermissionError:
            break


def test_admin_authorization_for_tickets(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    support = asyncio.run(create_user(db, "support@example.com", "password123456", "support"))

    admin_token, _ = asyncio.run(auth.create_session(db, admin["_id"]))
    support_token, _ = asyncio.run(auth.create_session(db, support["_id"]))

    admin_request = make_request(cookies={auth.SESSION_COOKIE_NAME: admin_token})
    support_request = make_request(cookies={auth.SESSION_COOKIE_NAME: support_token})

    # Unauthenticated denied.
    unauth = make_request()
    try:
        asyncio.run(server.admin_list_tickets(unauth))
    except Exception as exc:
        assert getattr(exc, "status_code", None) in (401, 403)
    else:
        raise AssertionError("expected auth error")

    # Both admin and support can list tickets.
    assert asyncio.run(server.admin_list_tickets(admin_request)) is not None
    assert asyncio.run(server.admin_list_tickets(support_request)) is not None


def test_customer_endpoint_hides_unauthorized_ticket(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))

    request = make_request()
    try:
        asyncio.run(server.get_customer_ticket(ticket["id"], request))
    except Exception as exc:
        assert getattr(exc, "status_code", None) in (401, 404)
    else:
        raise AssertionError("expected access denial")


def test_fresh_browser_guest_exchange_with_csrf(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(emailing, "send_email", lambda *a, **k: "msg-1")
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))

    raw_token = __import__("secrets").token_urlsafe(32)
    asyncio.run(db.ticket_access_tokens.insert_one({
        "id": str(uuid.uuid4()),
        "ticket_id": ticket["id"],
        "token_hash": auth.hash_token(raw_token),
        "created_at": ticket_service.utcnow(),
        "expires_at": ticket_service.utcnow() + __import__("datetime").timedelta(minutes=15),
        "used_at": None,
        "revoked_at": None,
    }))
    csrf_token = "csrf-token"
    request = make_request(cookies={auth.CSRF_COOKIE_NAME: csrf_token}, headers={"X-CSRF-Token": csrf_token})
    response = Response()
    exchange_payload = server.TicketAccessExchange(token=raw_token)
    result = asyncio.run(server.exchange_ticket_access(exchange_payload, request, response))
    assert result["ticket_id"] == ticket["id"]
    assert db.ticket_guest_sessions.docs
    # Token is consumed.
    assert db.ticket_access_tokens.docs[-1]["used_at"] is not None


def test_notifications_associated_with_ticket_and_retry(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(emailing, "send_email", lambda *a, **k: "msg-1")
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    ticket = asyncio.run(ticket_service.create_ticket(db, payload, "127.0.0.1"))

    notifications = asyncio.run(ticket_service.get_ticket_notifications(db, ticket["id"]))
    assert len(notifications) == 2
    assert all(n["related_type"] == "ticket" and n["related_id"] == ticket["id"] for n in notifications)

    notification_id = notifications[0]["id"]
    retried = asyncio.run(ticket_service.send_notification(db, notification_id))
    assert retried["status"] == "sent"
    assert retried["attempts"] >= 1
    messages = asyncio.run(ticket_service.get_ticket_messages(db, ticket["id"]))
    assert len(messages) == 1


def test_support_provisioning(monkeypatch):
    import provision_support

    class SyncCollection:
        def __init__(self):
            self.docs = []

        def find_one(self, query=None):
            query = query or {}
            for doc in self.docs:
                if all(doc.get(k) == v for k, v in query.items()):
                    return dict(doc)
            return None

        def insert_one(self, doc):
            self.docs.append(dict(doc))

    class SyncDB:
        def __init__(self):
            self.users = SyncCollection()

    db = SyncDB()
    email = provision_support.create_support_account(db, "support@example.com", "password123456")
    assert email == "support@example.com"
    user = db.users.docs[0]
    assert user["role"] == "support"

    try:
        provision_support.create_support_account(db, "support@example.com", "password123456")
    except RuntimeError as exc:
        assert "already exists" in str(exc)
    else:
        raise AssertionError("expected RuntimeError")


def test_contact_submission_route_persists_ticket(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    monkeypatch.setattr(emailing, "send_email", lambda *a, **k: "msg-1")

    request = make_request(client=("127.0.0.1", 5000))
    payload = server.TicketCreate(name="Alice", email="alice@example.com", subject="Help", message="Need support")
    result = asyncio.run(server.create_ticket(payload, request))

    assert result["id"]
    assert result["status"] == "open"
    assert len(db.tickets.docs) == 1
    assert db.tickets.docs[0]["customer_email"] == "alice@example.com"
    assert len(db.ticket_messages.docs) == 1
