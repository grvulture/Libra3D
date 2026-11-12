"""Provision a support account for Libra3D ticket management.

Credentials are prompted securely at runtime and are never stored in source,
arguments, logs, or shell history.
"""

import getpass
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

ROOT_DIR = Path(__file__).resolve().parent
load_dotenv(ROOT_DIR / ".env")

import auth


def prompt_support():
    while True:
        email = input("Support account email: ").strip()
        if auth.valid_email(email):
            break
        print("Enter a valid email address.")
    while True:
        password = getpass.getpass("Support account password: ")
        confirm = getpass.getpass("Support account password (confirm): ")
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


def create_support_account(db, email, password):
    if not auth.valid_email(email):
        raise ValueError("invalid email")
    if not auth.valid_password(password):
        raise ValueError("invalid password")
    normalized = auth.normalize_email(email)
    if db.users.find_one({"email": normalized}) is not None:
        raise RuntimeError("account already exists")
    db.users.insert_one(
        {
            "email": normalized,
            "password_hash": auth.hash_password(password),
            "role": "support",
            "status": "active",
            "failed_login_count": 0,
            "locked_until": None,
            "created_at": auth.utcnow(),
            "updated_at": auth.utcnow(),
            "last_login_at": None,
        }
    )
    return normalized


def main():
    if not sys.stdin.isatty():
        print("Support provisioning requires an interactive terminal.", file=sys.stderr)
        raise SystemExit(1)

    client = MongoClient(os.environ["MONGO_URL"])
    try:
        db = client[os.environ["DB_NAME"]]
        email, password = prompt_support()
        normalized = auth.normalize_email(email)
        if db.users.find_one({"email": normalized}) is not None:
            print("Provisioning refused: an account with that email already exists.", file=sys.stderr)
            raise SystemExit(1)
        create_support_account(db, email, password)
        print("Created one support account.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
