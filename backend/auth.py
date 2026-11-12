import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt


SESSION_COOKIE_NAME = "libra3d_session"
CSRF_COOKIE_NAME = "libra3d_csrf"
SESSION_TTL_SECONDS = int(os.environ.get("SESSION_TTL_SECONDS", "28800"))
LOGIN_MAX_ATTEMPTS = int(os.environ.get("LOGIN_MAX_ATTEMPTS", "5"))
LOGIN_LOCKOUT_SECONDS = int(os.environ.get("LOGIN_LOCKOUT_SECONDS", "900"))
IP_RATE_LIMIT = int(os.environ.get("IP_RATE_LIMIT", "20"))
IP_RATE_WINDOW_SECONDS = int(os.environ.get("IP_RATE_WINDOW_SECONDS", "900"))
SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def utcnow():
    return datetime.now(timezone.utc)


def as_utc(value):
    if value is None:
        return None
    if not isinstance(value, datetime):
        return value
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def normalize_email(email):
    return email.strip().lower()


def valid_email(email):
    return bool(EMAIL_RE.fullmatch(email))


def valid_password(password):
    if not isinstance(password, str):
        return False
    try:
        encoded = password.encode("utf-8")
    except UnicodeEncodeError:
        return False
    return 12 <= len(password) and len(encoded) <= 72


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password, password_hash):
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def validate_cors_config(origins):
    normalized = [str(origin).strip() for origin in origins if str(origin).strip()]
    if "*" in normalized:
        raise RuntimeError("CORS_ORIGINS cannot contain '*' when credentials are enabled")


def validate_security_config():
    environment = os.environ.get("ENVIRONMENT", os.environ.get("APP_ENV", "development")).lower()
    secure_cookie = os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"
    if environment in {"production", "prod"} and not secure_cookie:
        raise RuntimeError("SESSION_COOKIE_SECURE must be true when ENVIRONMENT is production")
    cors_origins = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ]
    validate_cors_config(cors_origins)

DUMMY_PASSWORD_HASH = hash_password("not-a-real-password")


def hash_token(token):
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def serialize_user(user):
    return {
        "id": str(user["_id"]) if "_id" in user else str(user.get("id")),
        "email": user["email"],
        "role": user["role"],
        "status": user.get("status", "active"),
    }


async def create_user(db, email, password, role, status="active"):
    email = normalize_email(email)
    if not valid_email(email):
        raise ValueError("invalid email")
    if not valid_password(password):
        raise ValueError("password must be at least 12 characters")
    if role not in {"admin", "support"}:
        raise ValueError("invalid role")
    now = utcnow()
    doc = {
        "email": email,
        "password_hash": hash_password(password),
        "role": role,
        "status": status,
        "failed_login_count": 0,
        "locked_until": None,
        "created_at": now,
        "updated_at": now,
        "last_login_at": None,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_user_by_email(db, email):
    return await db.users.find_one({"email": normalize_email(email)})


async def check_ip_rate_limit(db, ip):
    key = f"ip:{ip}"
    now = utcnow()
    doc = await db.auth_rate_limits.find_one({"key": key})
    blocked_until = as_utc(doc.get("blocked_until")) if doc else None
    if doc and blocked_until is not None and blocked_until > now:
        raise PermissionError("rate_limited")
    window_start = as_utc(doc.get("window_start")) if doc else None
    if not doc or window_start is None or (now - window_start).total_seconds() > IP_RATE_WINDOW_SECONDS:
        await db.auth_rate_limits.update_one(
            {"key": key},
            {"$set": {"count": 1, "window_start": now, "blocked_until": None}},
            upsert=True,
        )
        return
    count = doc.get("count", 0) + 1
    blocked_until = now + timedelta(seconds=IP_RATE_WINDOW_SECONDS) if count >= IP_RATE_LIMIT else None
    await db.auth_rate_limits.update_one(
        {"key": key},
        {"$set": {"count": count, "blocked_until": blocked_until}},
    )
    if count >= IP_RATE_LIMIT:
        raise PermissionError("rate_limited")


async def create_session(db, user_id):
    token = secrets.token_urlsafe(32)
    csrf_token = secrets.token_urlsafe(32)
    now = utcnow()
    await db.sessions.insert_one(
        {
            "user_id": user_id,
            "token_hash": hash_token(token),
            "csrf_token_hash": hash_token(csrf_token),
            "created_at": now,
            "expires_at": now + timedelta(seconds=SESSION_TTL_SECONDS),
            "revoked_at": None,
        }
    )
    return token, csrf_token


async def get_session(db, token):
    if not token:
        return None
    session = await db.sessions.find_one({"token_hash": hash_token(token), "revoked_at": None})
    if not session:
        return None
    if as_utc(session["expires_at"]) <= utcnow():
        return None
    return session


async def revoke_session(db, token):
    if not token:
        return
    await db.sessions.update_one(
        {"token_hash": hash_token(token), "revoked_at": None},
        {"$set": {"revoked_at": utcnow()}},
    )


async def get_current_user(db, request):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    session = await get_session(db, token)
    if not session:
        return None
    user = await db.users.find_one({"_id": session["user_id"], "status": "active"})
    if not user:
        return None
    return serialize_user(user)


async def require_current_user(db, request):
    user = await get_current_user(db, request)
    if not user:
        from fastapi import HTTPException

        raise HTTPException(status_code=401, detail="Authentication required")
    return user


async def require_roles(db, request, *roles):
    user = await require_current_user(db, request)
    if user["role"] not in roles:
        from fastapi import HTTPException

        raise HTTPException(status_code=403, detail="Forbidden")
    return user


def require_csrf(request):
    from fastapi import HTTPException

    cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
    header_token = request.headers.get("X-CSRF-Token")
    if not cookie_token or not header_token or not hmac.compare_digest(cookie_token, header_token):
        raise HTTPException(status_code=403, detail="CSRF validation failed")


async def change_password(db, user_id, current_password, new_password, current_session_token):
    if not valid_password(new_password):
        raise ValueError("new password does not meet requirements")
    user = await db.users.find_one({"_id": user_id, "status": "active"})
    if not user or not verify_password(current_password, user["password_hash"]):
        raise ValueError("current password is incorrect")
    now = utcnow()
    await db.users.update_one(
        {"_id": user_id},
        {"$set": {"password_hash": hash_password(new_password), "failed_login_count": 0, "locked_until": None, "updated_at": now}},
    )
    if current_session_token:
        await db.sessions.update_many(
            {"user_id": user_id, "token_hash": {"$ne": hash_token(current_session_token)}, "revoked_at": None},
            {"$set": {"revoked_at": now}},
        )
