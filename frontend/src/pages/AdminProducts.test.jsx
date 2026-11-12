import { TextEncoder, TextDecoder } from "util";
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { act } from "react-dom/test-utils";

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "admin" }, loading: false }),
}));

jest.mock("../hooks/useProducts", () => ({
  useProducts: () => ({ data: [], isLoading: false, isError: false }),
}));

jest.mock("../context/LocaleContext", () => ({
  useLocale: () => ({ t: (key) => key, formatPrice: (value) => value }),
}));

jest.mock("../api/adminProducts", () => ({
  fetchAdminProducts: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, page_size: 20 }),
  createAdminProduct: jest.fn(),
  updateAdminProduct: jest.fn(),
}));

import AdminProducts from "./AdminProducts";

const renderRoute = (path) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProducts />} />
        </Routes>
      </MemoryRouter>
    );
  });
  return container;
};

describe("AdminProducts route states", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows the create form without list on /admin/products/new", () => {
    const container = renderRoute("/admin/products/new");
    expect(container.textContent).toContain("products.createProduct");
    expect(container.textContent).not.toContain("products.search");
    expect(container.querySelector("table")).toBeNull();
  });

  it("shows the product list on /admin/products", () => {
    const container = renderRoute("/admin/products");
    expect(container.querySelector('input[placeholder="products.search"]')).not.toBeNull();
    expect(container.querySelector("table")).not.toBeNull();
  });
});
