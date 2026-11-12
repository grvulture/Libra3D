"""Seed the MongoDB products collection from a JSON file.

Dry-run by default. Pass --apply to write to MongoDB.

The script is non-destructive: it inserts products whose stable ``id`` is not
already present and reports conflicts instead of overwriting existing documents.
"""

import argparse
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")


def load_products(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        products = json.load(handle)
    if not isinstance(products, list):
        raise ValueError("seed file must contain a JSON array")
    for product in products:
        if not isinstance(product, dict) or not isinstance(product.get("id"), str) or not product["id"]:
            raise ValueError("every product must be an object with a stable string id")
    return products


def main():
    parser = argparse.ArgumentParser(description="Seed MongoDB products collection")
    parser.add_argument("--input", type=Path, default=ROOT_DIR / "products_seed.json")
    parser.add_argument("--apply", action="store_true", help="write changes to MongoDB")
    args = parser.parse_args()

    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    collection_name = "products"

    products = load_products(args.input)

    client = MongoClient(mongo_url)
    try:
        collection = client[db_name][collection_name]
        if not args.apply:
            existing_ids = {doc.get("id") for doc in collection.find({}, {"_id": 0, "id": 1})}
            would_insert = sum(1 for product in products if product["id"] not in existing_ids)
            would_skip = len(products) - would_insert
            print(f"Dry run: {len(products)} products read; {would_insert} would be inserted, {would_skip} already present")
            print("Re-run with --apply to write to MongoDB.")
            return

        inserted = 0
        skipped = 0
        errors = []
        for product in products:
            try:
                if collection.find_one({"id": product["id"]}, {"_id": 1}) is not None:
                    skipped += 1
                    print(f"SKIP (already present): {product['id']}")
                    continue
                collection.insert_one(product)
                inserted += 1
                print(f"INSERT: {product['id']}")
            except DuplicateKeyError:
                skipped += 1
                print(f"SKIP (already present): {product['id']}")
            except Exception as exc:  # keep going and report per-product failures
                errors.append((product.get("id"), str(exc)))
                print(f"ERROR: {product.get('id')}: {exc}")

        print(f"Read: {len(products)}; inserted: {inserted}; skipped: {skipped}; errors: {len(errors)}")
        if errors:
            raise SystemExit(1)
    finally:
        client.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
