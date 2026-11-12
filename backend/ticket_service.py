import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import auth
import emailing
from ticket_schemas import TicketCreate

VALID_STATUSES = {"open", "pending", "solved"}
VALID_PRIORITIES = {"normal", "important", "urgent"}
GUEST_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60
ACCESS_TOKEN_TTL_MINUTES = 15
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def utcnow():
    return datetime.now(timezone.utc)


def new_id():
    return str(uuid.uuid4())


def normalize_email(email):
    return auth.normalize_email(email)


async def check_rate_limit(db, key, limit, window_seconds):
    now = utcnow()
    doc = await db.auth_rate_limits.find_one({"key": key})
    blocked_until = auth.as_utc(doc.get("blocked_until")) if doc else None
    if doc and blocked_until is not None and blocked_until > now:
        raise PermissionError("rate_limited")
    window_start = auth.as_utc(doc.get("window_start")) if doc else None
    if not doc or window_start is None or (now - window_start).total_seconds() > window_seconds:
        await db.auth_rate_limits.update_one(
            {"key": key},
            {"$set": {"count": 1, "window_start": now, "blocked_until": None}},
            upsert=True,
        )
        return
    count = doc.get("count", 0) + 1
    blocked_until = now + timedelta(seconds=window_seconds) if count >= limit else None
    await db.auth_rate_limits.update_one(
        {"key": key},
        {"$set": {"count": count, "blocked_until": blocked_until}},
    )
    if count >= limit:
        raise PermissionError("rate_limited")


async def create_access_token(db, ticket_id):
    raw_token = secrets.token_urlsafe(32)
    now = utcnow()
    await db.ticket_access_tokens.insert_one(
        {
            "id": new_id(),
            "ticket_id": ticket_id,
            "token_hash": auth.hash_token(raw_token),
            "created_at": now,
            "expires_at": now + timedelta(minutes=ACCESS_TOKEN_TTL_MINUTES),
            "used_at": None,
            "revoked_at": None,
        }
    )
    return raw_token


async def revoke_unused_access_tokens(db, ticket_id):
    await db.ticket_access_tokens.update_many(
        {"ticket_id": ticket_id, "used_at": None, "revoked_at": None},
        {"$set": {"revoked_at": utcnow()}},
    )


async def validate_access_token(db, token):
    if not token or len(token) < 20:
        return None
    doc = await db.ticket_access_tokens.find_one({"token_hash": auth.hash_token(token), "revoked_at": None})
    if not doc or doc.get("used_at") is not None:
        return None
    if auth.as_utc(doc["expires_at"]) <= utcnow():
        return None
    return doc


async def exchange_access_token(db, token):
    doc = await validate_access_token(db, token)
    if not doc:
        return None
    now = utcnow()
    await db.ticket_access_tokens.update_one(
        {"_id": doc.get("_id"), "token_hash": doc["token_hash"]},
        {"$set": {"used_at": now, "revoked_at": now}},
    )
    raw_session = secrets.token_urlsafe(32)
    csrf_token = secrets.token_urlsafe(32)
    await db.ticket_guest_sessions.insert_one(
        {
            "id": new_id(),
            "ticket_id": doc["ticket_id"],
            "token_hash": auth.hash_token(raw_session),
            "csrf_token_hash": auth.hash_token(csrf_token),
            "created_at": now,
            "expires_at": now + timedelta(seconds=GUEST_SESSION_TTL_SECONDS),
            "revoked_at": None,
        }
    )
    return doc["ticket_id"], raw_session, csrf_token


async def get_guest_session(db, token):
    if not token:
        return None
    doc = await db.ticket_guest_sessions.find_one({"token_hash": auth.hash_token(token), "revoked_at": None})
    if not doc or auth.as_utc(doc["expires_at"]) <= utcnow():
        return None
    return doc


async def revoke_guest_session(db, token):
    if not token:
        return
    await db.ticket_guest_sessions.update_one(
        {"token_hash": auth.hash_token(token), "revoked_at": None},
        {"$set": {"revoked_at": utcnow()}},
    )


async def create_notification(db, recipient, subject, body, related_type=None, related_id=None):
    now = utcnow()
    doc = {
        "id": new_id(),
        "recipient": recipient,
        "related_type": related_type,
        "related_id": related_id,
        "subject": _sanitize_subject(subject),
        "body": body,
        "status": "pending",
        "attempts": 0,
        "last_error": None,
        "provider_message_id": None,
        "created_at": now,
        "sent_at": None,
        "updated_at": now,
    }
    await db.email_notifications.insert_one(doc)
    return doc


async def send_notification(db, notification_id):
    doc = await db.email_notifications.find_one({"id": notification_id})
    if not doc:
        return None
    now = utcnow()
    attempts = doc.get("attempts", 0) + 1
    try:
        message_id = emailing.send_email(doc["recipient"], doc["subject"], doc["body"])
        await db.email_notifications.update_one(
            {"id": notification_id},
            {
                "$set": {
                    "status": "sent",
                    "attempts": attempts,
                    "provider_message_id": message_id,
                    "last_error": None,
                    "sent_at": now,
                    "updated_at": now,
                }
            },
        )
    except Exception as exc:
        await db.email_notifications.update_one(
            {"id": notification_id},
            {
                "$set": {
                    "status": "failed",
                    "attempts": attempts,
                    "last_error": str(exc)[:500],
                    "updated_at": now,
                }
            },
        )
    return await db.email_notifications.find_one({"id": notification_id})


def _sanitize_subject(value):
    return str(value).replace("\r", " ").replace("\n", " ").strip()[:200]


def _access_link(token):
    return f"{FRONTEND_BASE_URL}/ticket/access#token={token}"


def _ticket_url(ticket_id):
    return f"{FRONTEND_BASE_URL}/ticket/{ticket_id}"


async def create_ticket(db, payload: TicketCreate, ip: str):
    await check_rate_limit(db, f"ip:{ip}", 5, 3600)
    await check_rate_limit(db, f"email:{payload.email}", 5, 3600)

    now = utcnow()
    ticket_id = new_id()
    message_id = new_id()
    ticket = {
        "id": ticket_id,
        "subject": payload.subject.strip(),
        "customer_name": payload.name.strip(),
        "customer_email": normalize_email(payload.email),
        "status": "open",
        "priority": "normal",
        "created_at": now,
        "updated_at": now,
        "solved_at": None,
        "reopened_at": None,
        "last_customer_message_at": now,
        "last_agent_message_at": None,
        "message_count": 1,
        "history": [],
    }
    message = {
        "id": message_id,
        "ticket_id": ticket_id,
        "author_type": "customer",
        "author_user_id": None,
        "author_name": payload.name.strip(),
        "author_email": normalize_email(payload.email),
        "body": payload.message,
        "visibility": "public",
        "created_at": now,
    }
    await db.tickets.insert_one(ticket)
    await db.ticket_messages.insert_one(message)

    access_token = await create_access_token(db, ticket_id)
    business_recipient = os.environ.get("SUPPORT_EMAIL", "info@3dlibra.gr").strip()
    if not business_recipient or "@" not in business_recipient:
        business_recipient = "info@3dlibra.gr"

    business_body = (
        f"New support ticket\n\n"
        f"Ticket: {ticket_id}\n"
        f"From: {ticket['customer_name']} <{ticket['customer_email']}>\n"
        f"Subject: {ticket['subject']}\n"
        f"Priority: {ticket['priority']}\n\n"
        f"{payload.message}\n"
    )
    customer_body = (
        f"Your support ticket has been created.\n\n"
        f"Ticket: {ticket_id}\n"
        f"Subject: {ticket['subject']}\n\n"
        f"View and reply here:\n{_access_link(access_token)}\n\n"
        f"This link expires in {ACCESS_TOKEN_TTL_MINUTES} minutes.\n"
    )

    business_notification = await create_notification(
        db, business_recipient, f"New support ticket: {ticket['subject']}", business_body,
        related_type="ticket", related_id=ticket_id,
    )
    customer_notification = await create_notification(
        db, ticket["customer_email"], f"Your support ticket: {ticket['subject']}", customer_body,
        related_type="ticket", related_id=ticket_id,
    )
    await send_notification(db, business_notification["id"])
    await send_notification(db, customer_notification["id"])

    return ticket


async def list_tickets(db, page=1, page_size=20, status=None, priority=None, query=None):
    page = max(1, int(page))
    page_size = min(max(1, int(page_size)), 50)
    filters = {}
    if status in VALID_STATUSES:
        filters["status"] = status
    if priority in VALID_PRIORITIES:
        filters["priority"] = priority
    if query:
        safe = re.escape(str(query))[:100]
        filters["$or"] = [
            {"subject": {"$regex": safe, "$options": "i"}},
            {"customer_name": {"$regex": safe, "$options": "i"}},
            {"customer_email": {"$regex": safe, "$options": "i"}},
            {"id": {"$regex": safe, "$options": "i"}},
        ]
    total = await db.tickets.count_documents(filters)
    cursor = db.tickets.find(filters, {"_id": 0}).sort("updated_at", -1).skip((page - 1) * page_size).limit(page_size)
    items = await cursor.to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def get_ticket(db, ticket_id):
    return await db.tickets.find_one({"id": ticket_id}, {"_id": 0})


async def get_ticket_messages(db, ticket_id, include_internal=False):
    query = {"ticket_id": ticket_id}
    if not include_internal:
        query["visibility"] = "public"
    cursor = db.ticket_messages.find(query, {"_id": 0}).sort("created_at", 1)
    return await cursor.to_list(1000)


async def get_ticket_notifications(db, ticket_id):
    cursor = db.email_notifications.find({"related_type": "ticket", "related_id": ticket_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(100)


async def customer_reply(db, ticket_id, body, ip):
    await check_rate_limit(db, f"ticket-reply:{ticket_id}", 10, 3600)
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    now = utcnow()
    message = {
        "id": new_id(),
        "ticket_id": ticket_id,
        "author_type": "customer",
        "author_user_id": None,
        "author_name": ticket["customer_name"],
        "author_email": ticket["customer_email"],
        "body": body,
        "visibility": "public",
        "created_at": now,
    }
    await db.ticket_messages.insert_one(message)
    update = {
        "updated_at": now,
        "last_customer_message_at": now,
        "message_count": ticket.get("message_count", 0) + 1,
    }
    if ticket.get("status") == "solved":
        update["status"] = "open"
        update["reopened_at"] = now
        update["solved_at"] = None
        await db.ticket_events.insert_one(
            {
                "id": new_id(),
                "ticket_id": ticket_id,
                "event_type": "status_changed",
                "actor_type": "customer",
                "actor_id": None,
                "from_value": "solved",
                "to_value": "open",
                "created_at": now,
            }
        )
    await db.tickets.update_one({"id": ticket_id}, {"$set": update})
    return message


async def agent_reply(db, ticket_id, body, user, ip):
    await check_rate_limit(db, f"agent-reply:{user['id']}", 30, 3600)
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    now = utcnow()
    message = {
        "id": new_id(),
        "ticket_id": ticket_id,
        "author_type": "agent",
        "author_user_id": user["id"],
        "author_name": user["email"],
        "author_email": user["email"],
        "body": body,
        "visibility": "public",
        "created_at": now,
    }
    await db.ticket_messages.insert_one(message)
    await db.tickets.update_one(
        {"id": ticket_id},
        {
            "$set": {
                "updated_at": now,
                "last_agent_message_at": now,
                "message_count": ticket.get("message_count", 0) + 1,
            }
        },
    )

    access_token = await create_access_token(db, ticket_id)
    notification_body = (
        f"An agent replied to your support ticket.\n\n"
        f"Ticket: {ticket_id}\n"
        f"Subject: {ticket['subject']}\n\n"
        f"{body}\n\n"
        f"View and reply here:\n{_access_link(access_token)}\n"
    )
    notification = await create_notification(
        db,
        ticket["customer_email"],
        f"Reply to your support ticket: {ticket['subject']}",
        notification_body,
        related_type="ticket",
        related_id=ticket_id,
    )
    await send_notification(db, notification["id"])
    return message


async def update_ticket(db, ticket_id, status=None, priority=None, user=None):
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    now = utcnow()
    update = {"updated_at": now}
    events = []
    if status is not None and status != ticket.get("status"):
        if status not in VALID_STATUSES:
            raise ValueError("invalid status")
        update["status"] = status
        if status == "solved":
            update["solved_at"] = now
        else:
            update["solved_at"] = None
        events.append(("status_changed", ticket.get("status"), status))
    if priority is not None and priority != ticket.get("priority"):
        if priority not in VALID_PRIORITIES:
            raise ValueError("invalid priority")
        update["priority"] = priority
        events.append(("priority_changed", ticket.get("priority"), priority))

    if len(update) == 1:
        return ticket

    await db.tickets.update_one({"id": ticket_id}, {"$set": update})
    for event_type, old_value, new_value in events:
        await db.ticket_events.insert_one(
            {
                "id": new_id(),
                "ticket_id": ticket_id,
                "event_type": event_type,
                "actor_type": "agent",
                "actor_id": user["id"] if user else None,
                "from_value": old_value,
                "to_value": new_value,
                "created_at": now,
            }
        )
    return await get_ticket(db, ticket_id)


async def request_ticket_access(db, email, ip):
    await check_rate_limit(db, f"access-request-ip:{ip}", 10, 3600)
    await check_rate_limit(db, f"access-request-email:{email}", 5, 3600)

    tickets = await db.tickets.find({"customer_email": normalize_email(email)}, {"_id": 0}).to_list(20)
    if not tickets:
        return

    links = []
    for ticket in tickets[:10]:
        await revoke_unused_access_tokens(db, ticket["id"])
        token = await create_access_token(db, ticket["id"])
        links.append((ticket["id"], ticket["subject"], _access_link(token)))

    body_lines = ["Here are your secure ticket access links:", ""]
    for ticket_id, subject, link in links:
        body_lines.append(f"{subject} ({ticket_id})")
        body_lines.append(link)
        body_lines.append("")
    body_lines.append(f"Each link expires in {ACCESS_TOKEN_TTL_MINUTES} minutes.")
    notification = await create_notification(
        db,
        normalize_email(email),
        "Your support ticket access links",
        "\n".join(body_lines),
        related_type="ticket_access_request",
        related_id=None,
    )
    await send_notification(db, notification["id"])


async def get_ticket_access_status(db, token):
    doc = await validate_access_token(db, token)
    if not doc:
        return None
    return doc["ticket_id"]


async def get_guest_ticket(db, session_token, ticket_id):
    session = await get_guest_session(db, session_token)
    if not session or session["ticket_id"] != ticket_id:
        return None
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    messages = await get_ticket_messages(db, ticket_id, include_internal=False)
    return ticket, messages


async def guest_reply(db, session_token, ticket_id, body, ip):
    session = await get_guest_session(db, session_token)
    if not session or session["ticket_id"] != ticket_id:
        return None
    await check_rate_limit(db, f"guest-reply:{session['id']}", 10, 3600)
    ticket = await get_ticket(db, ticket_id)
    if not ticket:
        return None
    message = await customer_reply(db, ticket_id, body, ip)
    return message
