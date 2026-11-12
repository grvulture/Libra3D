import re
from typing import Any, Dict, List, Optional

ALLOWED_CATEGORIES = {
    "home-decor",
    "desk-accessories",
    "miniatures",
    "replacement-parts",
    "tools-gadgets",
    "gifts",
    "custom-prints",
}


def validate_category(category: str) -> str:
    if category not in ALLOWED_CATEGORIES:
        raise ValueError("invalid category")
    return category


def _safe_regex(value: str) -> str:
    return re.escape(value[:100])


async def list_products(
    db,
    page: int = 1,
    page_size: int = 20,
    query: Optional[str] = None,
    category: Optional[str] = None,
    in_stock: Optional[bool] = None,
    material: Optional[str] = None,
):
    page = max(1, int(page))
    page_size = min(max(1, int(page_size)), 100)
    filters: Dict[str, Any] = {}
    if category:
        validate_category(category)
        filters["category"] = category
    if in_stock is not None:
        filters["inStock"] = bool(in_stock)
    if material:
        filters["material"] = material
    if query:
        safe = _safe_regex(query)
        filters["$or"] = [
            {"id": {"$regex": safe, "$options": "i"}},
            {"name": {"$regex": safe, "$options": "i"}},
            {"description": {"$regex": safe, "$options": "i"}},
            {"material": {"$regex": safe, "$options": "i"}},
        ]
    total = await db.products.count_documents(filters)
    cursor = (
        db.products.find(filters, {"_id": 0})
        .sort("name", 1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    items = await cursor.to_list(page_size)
    return {"items": items, "total": total, "page": page, "page_size": page_size}


async def create_product(db, payload: Dict[str, Any]):
    data = dict(payload)
    validate_category(data["category"])
    existing = await db.products.find_one({"id": data["id"]}, {"_id": 1})
    if existing is not None:
        raise ValueError("product id already exists")
    await db.products.insert_one(data)
    return await db.products.find_one({"id": data["id"]}, {"_id": 0})


async def update_product(db, product_id: str, updates: Dict[str, Any]):
    if not updates:
        product = await db.products.find_one({"id": product_id}, {"_id": 0})
        if product is None:
            raise ValueError("product not found")
        return product
    data = dict(updates)
    if "category" in data:
        validate_category(data["category"])
    result = await db.products.find_one({"id": product_id}, {"_id": 1})
    if result is None:
        raise ValueError("product not found")
    await db.products.update_one({"id": product_id}, {"$set": data})
    return await db.products.find_one({"id": product_id}, {"_id": 0})


async def get_product(db, product_id: str):
    return await db.products.find_one({"id": product_id}, {"_id": 0})
