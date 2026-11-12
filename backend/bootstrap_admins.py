"""One-time bootstrap for the initial Libra3D admin accounts.

Credentials are prompted securely at runtime and are never stored in source,
arguments, logs, or shell history.
"""

import argparse
import getpass
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, errors

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

import auth

BOOTSTRAP_LOCK_ID = "admin_bootstrap"


def valid_email(email):
    return auth.valid_email(email)


def prompt_admin(index):
    while True:
        email = input(f"Admin {index} email: ").strip()
        if valid_email(email):
            break
        print("Enter a valid email address.")
    while True:
        password = getpass.getpass(f"Admin {index} password: ")
        confirm = getpass.getpass(f"Admin {index} password (confirm): ")
        if password != confirm:
            print("Passwords do not match.")
            continue
        if not auth.valid_password(password):
            print("Password must be at least 12 characters and no more than 72 UTF-8 bytes.")
            continue
        if password.lower() == email.lower():
            print("Password must not equal the email address.")
            continue
        return email, password


def perform_bootstrap(db, admins):
    if len(admins) != 2:
        raise ValueError("bootstrap requires exactly two admin accounts")

    if db.users.count_documents({"role": "admin"}) > 0:
        raise RuntimeError("bootstrap refused: admin accounts already exist")

    existing_lock = db.bootstrap_locks.find_one({"_id": BOOTSTRAP_LOCK_ID})
    if existing_lock:
        raise RuntimeError("bootstrap refused: bootstrap already in progress or completed")

    db.bootstrap_locks.insert_one(
        {"_id": BOOTSTRAP_LOCK_ID, "completed": False, "created_at": auth.utcnow()}
    )

    created_ids = []
    try:
        for email, password in admins:
            result = db.users.insert_one(
                {
                    "email": auth.normalize_email(email),
                    "password_hash": auth.hash_password(password),
                    "role": "admin",
                    "status": "active",
                    "failed_login_count": 0,
                    "locked_until": None,
                    "created_at": auth.utcnow(),
                    "updated_at": auth.utcnow(),
                    "last_login_at": None,
                }
            )
            created_ids.append(result.inserted_id)
        db.bootstrap_locks.update_one(
            {"_id": BOOTSTRAP_LOCK_ID},
            {"$set": {"completed": True, "completed_at": auth.utcnow()}},
        )
    except Exception:
        for inserted_id in created_ids:
            db.users.delete_one({"_id": inserted_id})
        db.bootstrap_locks.delete_one({"_id": BOOTSTRAP_LOCK_ID})
        raise

    return len(created_ids)


def main():
    parser = argparse.ArgumentParser(description="Bootstrap initial admin accounts")
    parser.add_argument("--count", type=int, default=2, help="number of admin accounts to create")
    args = parser.parse_args()

    if args.count != 2:
        print("Bootstrap requires exactly two admin accounts.", file=sys.stderr)
        raise SystemExit(1)
    if not sys.stdin.isatty():
        print("Bootstrap requires an interactive terminal.", file=sys.stderr)
        raise SystemExit(1)

    client = MongoClient(os.environ["MONGO_URL"])
    try:
        db = client[os.environ["DB_NAME"]]
        admins = [prompt_admin(index) for index in range(1, 3)]
        try:
            created = perform_bootstrap(db, admins)
        except Exception as exc:
            print(f"Bootstrap failed: {exc}", file=sys.stderr)
            raise SystemExit(1)
        print(f"Created {created} admin account(s).")
    finally:
        client.close()


if __name__ == "__main__":
    main()
