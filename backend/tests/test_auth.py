import asyncio
import pytest
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Response
from starlette.requests import Request

import auth
import server


class FakeResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class FakeCollection:
    def __init__(self):
        self.docs = []

    async def find_one(self, query=None, projection=None, sort=None):
        query = query or {}
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                return dict(doc)
        return None

    async def insert_one(self, doc):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = str(uuid.uuid4())
        self.docs.append(new_doc)
        return FakeResult(new_doc["_id"])

    async def update_one(self, query, update, upsert=False):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
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
            matched = True
            for key, value in query.items():
                if isinstance(value, dict) and "$ne" in value:
                    if doc.get(key) == value["$ne"]:
                        matched = False
                        break
                elif doc.get(key) != value:
                    matched = False
                    break
            if matched:
                for key, value in update.get("$set", {}).items():
                    doc[key] = value

    async def count_documents(self, query=None):
        query = query or {}
        return sum(1 for doc in self.docs if all(doc.get(key) == value for key, value in query.items()))


class FakeDB:
    def __init__(self):
        self.users = FakeCollection()
        self.sessions = FakeCollection()
        self.auth_rate_limits = FakeCollection()


def make_request(cookies=None, headers=None, client=("127.0.0.1", 1234)):
    cookie_header = ""
    if cookies:
        cookie_header = "; ".join(f"{key}={value}" for key, value in cookies.items())
    header_list = []
    if cookie_header:
        header_list.append((b"cookie", cookie_header.encode()))
    for key, value in (headers or {}).items():
        header_list.append((key.lower().encode(), value.encode()))
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/",
            "headers": header_list,
            "client": client,
        }
    )


async def create_user(db, email, password, role):
    return await auth.create_user(db, email, password, role)


def test_login_success_and_me(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))

    csrf_token = "test-csrf-token"
    request = make_request(cookies={auth.CSRF_COOKIE_NAME: csrf_token}, headers={"X-CSRF-Token": csrf_token})
    response = Response()
    payload = server.LoginRequest(email="admin@example.com", password="password123456")
    data = asyncio.run(server.login(payload, request, response))

    assert data["email"] == "admin@example.com"
    assert data["role"] == "admin"
    assert "password_hash" not in data
    assert db.sessions.docs

    user = db.users.docs[0]
    token = None
    for session in db.sessions.docs:
        if session["user_id"] == user["_id"]:
            # The raw token is not stored; create a fresh session for /me testing.
            pass
    raw_token, csrf_token = asyncio.run(auth.create_session(db, user["_id"]))
    auth_request = make_request(cookies={auth.SESSION_COOKIE_NAME: raw_token})
    current = asyncio.run(auth.get_current_user(db, auth_request))
    assert current["email"] == "admin@example.com"


def test_login_failure_does_not_disclose_hash(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))

    csrf_token = "test-csrf-token"
    request = make_request(cookies={auth.CSRF_COOKIE_NAME: csrf_token}, headers={"X-CSRF-Token": csrf_token})
    response = Response()
    payload = server.LoginRequest(email="admin@example.com", password="wrong-password")
    try:
        asyncio.run(server.login(payload, request, response))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 401
    else:
        raise AssertionError("expected 401")

    assert db.users.docs[0]["failed_login_count"] == 1


def test_account_lockout(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))

    for _ in range(auth.LOGIN_MAX_ATTEMPTS):
        csrf_token = "test-csrf-token"
        request = make_request(cookies={auth.CSRF_COOKIE_NAME: csrf_token}, headers={"X-CSRF-Token": csrf_token})
        response = Response()
        payload = server.LoginRequest(email="admin@example.com", password="wrong-password")
        try:
            asyncio.run(server.login(payload, request, response))
        except Exception:
            pass

    csrf_token = "test-csrf-token"
    request = make_request(cookies={auth.CSRF_COOKIE_NAME: csrf_token}, headers={"X-CSRF-Token": csrf_token})
    response = Response()
    payload = server.LoginRequest(email="admin@example.com", password="password123456")
    try:
        asyncio.run(server.login(payload, request, response))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 401
    else:
        raise AssertionError("expected 429")


def test_session_expiry_and_logout(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    user = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    raw_token, csrf_token = asyncio.run(auth.create_session(db, user["_id"]))
    db.sessions.docs[0]["expires_at"] = auth.utcnow() - timedelta(seconds=1)

    request = make_request(cookies={auth.SESSION_COOKIE_NAME: raw_token})
    assert asyncio.run(auth.get_current_user(db, request)) is None

    raw_token, csrf_token = asyncio.run(auth.create_session(db, user["_id"]))
    request = make_request(
        cookies={auth.SESSION_COOKIE_NAME: raw_token, auth.CSRF_COOKIE_NAME: csrf_token},
        headers={"X-CSRF-Token": csrf_token},
    )
    response = Response()
    data = asyncio.run(server.logout(request, response))
    assert data["detail"] == "Logged out"
    request = make_request(cookies={auth.SESSION_COOKIE_NAME: raw_token})
    assert asyncio.run(auth.get_current_user(db, request)) is None


def test_logout_requires_csrf(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    user = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    raw_token, csrf_token = asyncio.run(auth.create_session(db, user["_id"]))
    request = make_request(cookies={auth.SESSION_COOKIE_NAME: raw_token})
    response = Response()
    try:
        asyncio.run(server.logout(request, response))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    else:
        raise AssertionError("expected 403")


def test_admin_access_and_support_denial(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    admin = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    support = asyncio.run(create_user(db, "support@example.com", "password123456", "support"))

    admin_token, _ = asyncio.run(auth.create_session(db, admin["_id"]))
    support_token, _ = asyncio.run(auth.create_session(db, support["_id"]))

    admin_request = make_request(cookies={auth.SESSION_COOKIE_NAME: admin_token})
    support_request = make_request(cookies={auth.SESSION_COOKIE_NAME: support_token})

    result = asyncio.run(server.admin_access_check(admin_request))
    assert result["role"] == "admin"

    try:
        asyncio.run(server.admin_access_check(support_request))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    else:
        raise AssertionError("expected 403")


def test_bcrypt_password_byte_boundary():
    assert auth.valid_password("a" * 12)
    assert auth.valid_password("é" * 24)  # 24 chars, 48 UTF-8 bytes
    assert auth.valid_password("a" * 72)
    assert not auth.valid_password("a" * 73)
    assert not auth.valid_password("é" * 37)  # 74 UTF-8 bytes


def test_security_config_rejects_insecure_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    monkeypatch.setenv("CORS_ORIGINS", "https://admin.example.com")
    with pytest.raises(RuntimeError):
        auth.validate_security_config()


def test_security_config_accepts_local_development(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.setenv("SESSION_COOKIE_SECURE", "false")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000")
    auth.validate_security_config()


def test_cors_validation_rejects_wildcard():
    with pytest.raises(RuntimeError):
        auth.validate_cors_config(["*"])
    auth.validate_cors_config(["http://localhost:3000"])


def test_login_requires_csrf(monkeypatch):
    db = FakeDB()
    monkeypatch.setattr(server, "db", db)
    asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))

    request = make_request()
    response = Response()
    payload = server.LoginRequest(email="admin@example.com", password="password123456")
    try:
        asyncio.run(server.login(payload, request, response))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    else:
        raise AssertionError("expected 403")


def test_password_change_unauthenticated_denied():
    db = FakeDB()
    request = make_request()
    response = Response()
    payload = server.PasswordChangeRequest(current_password="password123456", new_password="newpassword123456")
    try:
        asyncio.run(server.change_password(payload, request))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 401
    else:
        raise AssertionError("expected 401")


def test_password_change_requires_csrf():
    db = FakeDB()
    monkeypatch_db = db
    import server as _server
    _server.db = db
    user = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    token, csrf = asyncio.run(auth.create_session(db, user["_id"]))
    request = make_request(cookies={auth.SESSION_COOKIE_NAME: token})
    payload = server.PasswordChangeRequest(current_password="password123456", new_password="newpassword123456")
    try:
        asyncio.run(server.change_password(payload, request))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 403
    else:
        raise AssertionError("expected 403")


def test_password_change_incorrect_current_password():
    db = FakeDB()
    server.db = db
    user = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    token, csrf = asyncio.run(auth.create_session(db, user["_id"]))
    request = make_request(cookies={auth.SESSION_COOKIE_NAME: token, auth.CSRF_COOKIE_NAME: csrf}, headers={"X-CSRF-Token": csrf})
    payload = server.PasswordChangeRequest(current_password="wrongpassword123", new_password="newpassword123456")
    try:
        asyncio.run(server.change_password(payload, request))
    except Exception as exc:
        assert getattr(exc, "status_code", None) == 401
    else:
        raise AssertionError("expected 401")
    assert auth.verify_password("password123456", db.users.docs[0]["password_hash"])


def test_password_change_validation():
    db = FakeDB()
    server.db = db
    user = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    token, csrf = asyncio.run(auth.create_session(db, user["_id"]))
    request = make_request(cookies={auth.SESSION_COOKIE_NAME: token, auth.CSRF_COOKIE_NAME: csrf}, headers={"X-CSRF-Token": csrf})

    for new_password in ["short", "a" * 73]:
        payload = server.PasswordChangeRequest(current_password="password123456", new_password=new_password)
        try:
            asyncio.run(server.change_password(payload, request))
        except Exception as exc:
            assert getattr(exc, "status_code", None) == 422
        else:
            raise AssertionError("expected 422")


def test_password_change_success_admin_and_support():
    for role in ("admin", "support"):
        db = FakeDB()
        server.db = db
        user = asyncio.run(create_user(db, f"{role}@example.com", "password123456", role))
        other_user = asyncio.run(create_user(db, f"other-{role}@example.com", "password123456", role))
        current_token, csrf = asyncio.run(auth.create_session(db, user["_id"]))
        other_token, _ = asyncio.run(auth.create_session(db, user["_id"]))
        other_user_token, _ = asyncio.run(auth.create_session(db, other_user["_id"]))
        request = make_request(cookies={auth.SESSION_COOKIE_NAME: current_token, auth.CSRF_COOKIE_NAME: csrf}, headers={"X-CSRF-Token": csrf})
        payload = server.PasswordChangeRequest(current_password="password123456", new_password="newpassword123456")
        result = asyncio.run(server.change_password(payload, request))
        assert result["detail"] == "Password changed"

        # New password works; old no longer works.
        updated_user = db.users.docs[0]
        assert auth.verify_password("newpassword123456", updated_user["password_hash"])
        assert not auth.verify_password("password123456", updated_user["password_hash"])

        # Current session remains valid; other session for same user is revoked.
        assert asyncio.run(auth.get_current_user(db, make_request(cookies={auth.SESSION_COOKIE_NAME: current_token}))) is not None
        assert asyncio.run(auth.get_current_user(db, make_request(cookies={auth.SESSION_COOKIE_NAME: other_token}))) is None

        # Another user is unaffected.
        other = db.users.docs[1]
        assert auth.verify_password("password123456", other["password_hash"])
        assert asyncio.run(auth.get_current_user(db, make_request(cookies={auth.SESSION_COOKIE_NAME: other_user_token}))) is not None


def test_password_change_cannot_target_another_user():
    db = FakeDB()
    server.db = db
    user = asyncio.run(create_user(db, "admin@example.com", "password123456", "admin"))
    other = asyncio.run(create_user(db, "other@example.com", "password123456", "admin"))
    token, csrf = asyncio.run(auth.create_session(db, user["_id"]))
    request = make_request(cookies={auth.SESSION_COOKIE_NAME: token, auth.CSRF_COOKIE_NAME: csrf}, headers={"X-CSRF-Token": csrf})
    payload = server.PasswordChangeRequest(current_password="password123456", new_password="newpassword123456")
    asyncio.run(server.change_password(payload, request))
    assert auth.verify_password("password123456", other["password_hash"])


def _make_rate_limit_doc(window_start, count=2, blocked_until=None, naive=False):
    if naive and isinstance(window_start, datetime):
        window_start = window_start.replace(tzinfo=None)
    if naive and isinstance(blocked_until, datetime):
        blocked_until = blocked_until.replace(tzinfo=None)
    return {
        "key": "ip:127.0.0.1",
        "count": count,
        "window_start": window_start,
        "blocked_until": blocked_until,
    }


def test_rate_limit_active_window_counts(monkeypatch):
    for naive in (False, True):
        db = FakeDB()
        monkeypatch.setattr(server, "db", db)
        now = auth.utcnow()
        db.auth_rate_limits.docs.append(_make_rate_limit_doc(now - timedelta(seconds=10), count=2, naive=naive))
        asyncio.run(auth.check_ip_rate_limit(db, "127.0.0.1"))
        assert db.auth_rate_limits.docs[0]["count"] == 3


def test_rate_limit_expired_window_resets(monkeypatch):
    for naive in (False, True):
        db = FakeDB()
        monkeypatch.setattr(server, "db", db)
        now = auth.utcnow()
        db.auth_rate_limits.docs.append(_make_rate_limit_doc(now - timedelta(seconds=auth.IP_RATE_WINDOW_SECONDS + 5), count=5, naive=naive))
        asyncio.run(auth.check_ip_rate_limit(db, "127.0.0.1"))
        assert db.auth_rate_limits.docs[0]["count"] == 1


def test_rate_limit_blocked_until_enforced(monkeypatch):
    for naive in (False, True):
        db = FakeDB()
        monkeypatch.setattr(server, "db", db)
        now = auth.utcnow()
        db.auth_rate_limits.docs.append(_make_rate_limit_doc(now - timedelta(seconds=10), count=auth.IP_RATE_LIMIT, blocked_until=now + timedelta(seconds=60), naive=naive))
        try:
            asyncio.run(auth.check_ip_rate_limit(db, "127.0.0.1"))
        except PermissionError:
            pass
        else:
            raise AssertionError("expected PermissionError")
