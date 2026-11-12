import asyncio

import server


class FakeCursor:
    def __init__(self, docs, error=None):
        self.docs = docs
        self.error = error

    async def to_list(self, limit):
        if self.error:
            raise self.error
        return list(self.docs)


class FakeCollection:
    def __init__(self, docs=None, find_error=None, find_one_result=None, find_one_error=None):
        self.docs = docs or []
        self.find_error = find_error
        self.find_one_result = find_one_result
        self.find_one_error = find_one_error

    def find(self, query=None, projection=None):
        if self.find_error:
            raise self.find_error
        return FakeCursor(self.docs)

    async def find_one(self, query=None, projection=None):
        if self.find_one_error:
            raise self.find_one_error
        for doc in self.docs:
            if query and all(doc.get(k) == v for k, v in query.items()):
                return doc
        return self.find_one_result


class FakeDB:
    def __init__(self, collection):
        self.products = collection


def test_get_products_empty(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDB(FakeCollection([])))
    result = asyncio.run(server.get_products())
    assert result == []


def test_get_products_returns_documents(monkeypatch):
    docs = [{"id": "p1", "name": "Product", "category": "home-decor", "price": 10, "material": "PLA"}]
    monkeypatch.setattr(server, "db", FakeDB(FakeCollection(docs)))
    result = asyncio.run(server.get_products())
    assert result == docs


def test_get_products_database_error(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDB(FakeCollection(find_error=RuntimeError("boom"))))
    try:
        asyncio.run(server.get_products())
    except server.HTTPException as exc:
        assert exc.status_code == 503
    else:
        raise AssertionError("expected HTTPException")


def test_get_product_found(monkeypatch):
    docs = [{"id": "p1", "name": "Product", "category": "home-decor", "price": 10, "material": "PLA"}]
    monkeypatch.setattr(server, "db", FakeDB(FakeCollection(docs)))
    result = asyncio.run(server.get_product("p1"))
    assert result["id"] == "p1"


def test_get_product_not_found(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDB(FakeCollection([])))
    try:
        asyncio.run(server.get_product("missing"))
    except server.HTTPException as exc:
        assert exc.status_code == 404
    else:
        raise AssertionError("expected HTTPException")


def test_get_product_database_error(monkeypatch):
    monkeypatch.setattr(server, "db", FakeDB(FakeCollection(find_one_error=RuntimeError("boom"))))
    try:
        asyncio.run(server.get_product("p1"))
    except server.HTTPException as exc:
        assert exc.status_code == 503
    else:
        raise AssertionError("expected HTTPException")
