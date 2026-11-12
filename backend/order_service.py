import uuid
from datetime import datetime, timezone
from pymongo.errors import DuplicateKeyError
from typing import Any, Dict, List, Optional

import auth
import ticket_service
from order_schemas import OrderCreate, OrderItemInput

VALID_ORDER_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled"}
ALLOWED_STATUS_TRANSITIONS = {
    "pending": {"processing", "cancelled"},
    "processing": {"shipped", "cancelled"},
    "shipped": {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}
SHIPPING_THRESHOLD = 75.0
SHIPPING_COST = 8.5
CURRENCY = "EUR"


def utcnow():
    return datetime.now(timezone.utc)


def new_id():
    return str(uuid.uuid4())


def money(value):
    return round(float(value), 2)


def shipping_for_subtotal(subtotal):
    return 0.0 if subtotal >= SHIPPING_THRESHOLD else SHIPPING_COST


async def _canonical_items(db, items: List[OrderItemInput]):
    if not items:
        raise ValueError("cart is empty")
    result = []
    subtotal = 0.0
    for item in items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if not product:
            raise ValueError(f"product not found: {item.product_id}")
        if not product.get("inStock", True):
            raise ValueError(f"product unavailable: {item.product_id}")
        color = item.color
        if color is None and product.get("colors"):
            color = product["colors"][0]
        if color is not None and product.get("colors") and color not in product["colors"]:
            raise ValueError(f"invalid color for product: {item.product_id}")
        unit_price = float(product["price"])
        line_total = money(unit_price * item.quantity)
        subtotal = money(subtotal + line_total)
        result.append(
            {
                "product_id": product["id"],
                "product_name": product["name"],
                "material": product.get("material"),
                "color": color,
                "quantity": item.quantity,
                "unit_price": unit_price,
                "line_total": line_total,
            }
        )
    shipping = shipping_for_subtotal(subtotal)
    total = money(subtotal + shipping)
    return result, subtotal, shipping, total


async def create_order(db, payload: OrderCreate, source="storefront", created_by=None, ip=None):
    if ip is not None:
        await ticket_service.check_rate_limit(db, f"order-ip:{ip}", 10, 3600)
        await ticket_service.check_rate_limit(db, f"order-email:{payload.email}", 5, 3600)

    if payload.client_order_id:
        existing = await db.orders.find_one({"client_order_id": payload.client_order_id}, {"_id": 0})
        if existing:
            return existing

    items, subtotal, shipping, total = await _canonical_items(db, payload.items)
    now = utcnow()
    order = {
        "id": new_id(),
        "client_order_id": payload.client_order_id if payload.client_order_id else None,
        "created_at": now,
        "updated_at": now,
        "status": "pending",
        "payment_status": "not_integrated",
        "payment_provider": None,
        "source": source,
        "created_by": created_by,
        "currency": CURRENCY,
        "email": auth.normalize_email(payload.email),
        "first_name": payload.first_name.strip(),
        "last_name": payload.last_name.strip(),
        "shipping_address": payload.shipping_address.strip(),
        "city": payload.city.strip(),
        "postal_code": payload.postal_code.strip(),
        "country": payload.country.strip(),
        "notes": payload.notes,
        "items": items,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "status_history": [
            {"status": "pending", "changed_at": now, "changed_by": created_by, "note": "Order created"}
        ],
        "history": [
            {"event": "created", "changed_at": now, "changed_by": created_by, "details": {"source": source}}
        ],
    }
    if not payload.client_order_id:
        order.pop("client_order_id", None)
    try:
        await db.orders.insert_one(order)
    except DuplicateKeyError:
        if payload.client_order_id:
            existing = await db.orders.find_one({"client_order_id": payload.client_order_id}, {"_id": 0})
            if existing:
                return existing
        raise
    return await db.orders.find_one({"id": order["id"]}, {"_id": 0})


async def list_orders(db, page=1, page_size=20, status=None, query=None):
    page = max(1, int(page))
    page_size = min(max(1, int(page_size)), 50)
    filters = {}
    if status in VALID_ORDER_STATUSES:
        filters["status"] = status
    if query:
        import re

        safe = re.escape(str(query))[:100]
        filters["$or"] = [
            {"id": {"$regex": safe, "$options": "i"}},
            {"email": {"$regex": safe, "$options": "i"}},
            {"first_name": {"$regex": safe, "$options": "i"}},
            {"last_name": {"$regex": safe, "$options": "i"}},
        ]
    total = await db.orders.count_documents(filters)
    cursor = db.orders.find(filters, {"_id": 0}).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    items = await cursor.to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def get_order(db, order_id):
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


async def update_order(db, order_id, updates, user=None):
    order = await get_order(db, order_id)
    if not order:
        return None
    now = utcnow()
    update_doc = {"updated_at": now}
    history = []

    if "status" in updates and updates["status"] is not None:
        status = updates["status"]
        if status not in VALID_ORDER_STATUSES:
            raise ValueError("invalid status")
        if status != order["status"] and status not in ALLOWED_STATUS_TRANSITIONS.get(order["status"], set()):
            raise ValueError("invalid status transition")
        if status != order["status"]:
            update_doc["status"] = status
            update_doc["status_history"] = order.get("status_history", []) + [
                {"status": status, "changed_at": now, "changed_by": user["id"] if user else None, "note": updates.get("status_note")}
            ]
            history.append({"event": "status_changed", "changed_at": now, "changed_by": user["id"] if user else None, "details": {"from": order["status"], "to": status}})

    for field in ("notes", "first_name", "last_name", "shipping_address", "city", "postal_code", "country"):
        if field in updates and updates[field] is not None:
            update_doc[field] = updates[field]

    if updates.get("items") is not None:
        items, subtotal, shipping, total = await _canonical_items(db, updates["items"])
        update_doc["items"] = items
        update_doc["subtotal"] = subtotal
        update_doc["shipping"] = shipping
        update_doc["total"] = total
        history.append({"event": "items_updated", "changed_at": now, "changed_by": user["id"] if user else None, "details": {"item_count": len(items)}})

    if history:
        update_doc["history"] = order.get("history", []) + history

    if len(update_doc) == 1:
        return order

    await db.orders.update_one({"id": order_id}, {"$set": update_doc})
    return await get_order(db, order_id)
