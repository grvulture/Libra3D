import uuid

import bootstrap_admins


class FakeSyncCollection:
    def __init__(self):
        self.docs = []

    def find_one(self, query=None):
        query = query or {}
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                return dict(doc)
        return None

    def insert_one(self, doc):
        new_doc = dict(doc)
        if "_id" not in new_doc:
            new_doc["_id"] = str(uuid.uuid4())
        self.docs.append(new_doc)
        return type("Result", (), {"inserted_id": new_doc["_id"]})()

    def update_one(self, query, update):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                for key, value in update.get("$set", {}).items():
                    doc[key] = value

    def delete_one(self, query):
        for index, doc in enumerate(self.docs):
            if all(doc.get(key) == value for key, value in query.items()):
                del self.docs[index]
                return

    def delete_many(self, query):
        self.docs = [
            doc for doc in self.docs
            if not all(doc.get(key) == value for key, value in query.items())
        ]

    def count_documents(self, query=None):
        query = query or {}
        return sum(1 for doc in self.docs if all(doc.get(key) == value for key, value in query.items()))


class FakeSyncDB:
    def __init__(self):
        self.users = FakeSyncCollection()
        self.bootstrap_locks = FakeSyncCollection()


def make_admins():
    return [("admin1@example.com", "password123456"), ("admin2@example.com", "password123456")]


def test_perform_bootstrap_creates_two_admins():
    db = FakeSyncDB()
    created = bootstrap_admins.perform_bootstrap(db, make_admins())
    assert created == 2
    assert db.users.count_documents({"role": "admin"}) == 2
    assert db.bootstrap_locks.find_one({"_id": bootstrap_admins.BOOTSTRAP_LOCK_ID})["completed"] is True


def test_perform_bootstrap_refuses_existing_admin():
    db = FakeSyncDB()
    db.users.insert_one({"email": "existing@example.com", "role": "admin"})
    try:
        bootstrap_admins.perform_bootstrap(db, make_admins())
    except RuntimeError as exc:
        assert "already exist" in str(exc)
    else:
        raise AssertionError("expected RuntimeError")


def test_perform_bootstrap_refuses_concurrent_lock():
    db = FakeSyncDB()
    db.bootstrap_locks.insert_one({"_id": bootstrap_admins.BOOTSTRAP_LOCK_ID, "completed": False})
    try:
        bootstrap_admins.perform_bootstrap(db, make_admins())
    except RuntimeError as exc:
        assert "already" in str(exc)
    else:
        raise AssertionError("expected RuntimeError")


def test_perform_bootstrap_cleans_up_after_failure(monkeypatch):
    db = FakeSyncDB()

    def fail_insert(doc):
        if doc.get("email") == "admin2@example.com":
            raise RuntimeError("simulated failure")
        return type("Result", (), {"inserted_id": "id-1"})()

    original_insert = db.users.insert_one
    db.users.insert_one = fail_insert
    try:
        bootstrap_admins.perform_bootstrap(db, make_admins())
    except RuntimeError as exc:
        assert "simulated failure" in str(exc)
    else:
        raise AssertionError("expected RuntimeError")
    finally:
        db.users.insert_one = original_insert

    assert db.users.count_documents({"role": "admin"}) == 0
    assert db.bootstrap_locks.find_one({"_id": bootstrap_admins.BOOTSTRAP_LOCK_ID}) is None


def test_perform_bootstrap_requires_exactly_two():
    db = FakeSyncDB()
    try:
        bootstrap_admins.perform_bootstrap(db, [("only@example.com", "password123456")])
    except ValueError as exc:
        assert "exactly two" in str(exc)
    else:
        raise AssertionError("expected ValueError")
