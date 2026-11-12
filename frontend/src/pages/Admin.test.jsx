import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";

jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../hooks/useProducts", () => ({
  useProducts: () => ({ data: [], isLoading: false, isError: false }),
}));

jest.mock("../context/LocaleContext", () => ({
  useLocale: () => ({ t: (key) => key, formatPrice: (value) => value }),
}));

jest.mock("react-router-dom", () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
  MemoryRouter: ({ children }) => <div>{children}</div>,
  useLocation: () => ({ pathname: "/admin", state: null }),
}), { virtual: true });

import { useAuth } from "../context/AuthContext";
import Admin from "./Admin";

const renderAdmin = (role) => {
  useAuth.mockReturnValue({ user: { role }, loading: false });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Admin />);
  });
  return { container, root };
};

describe("Admin dashboard navigation", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows Inbox and all management links for admins", () => {
    const { container } = renderAdmin("admin");
    expect(container.querySelector('[data-testid="admin-inbox"]')).not.toBeNull();
    expect(container.textContent).toContain("admin.manageProducts");
    expect(container.textContent).toContain("admin.manageOrders");
    expect(container.textContent).toContain("admin.changePassword");
    expect(container.querySelector('[data-testid="admin-add-product"]')).not.toBeNull();

    const productsIndex = container.textContent.indexOf("admin.manageProducts");
    const ordersIndex = container.textContent.indexOf("admin.manageOrders");
    const passwordIndex = container.textContent.indexOf("admin.changePassword");
    expect(productsIndex).toBeLessThan(ordersIndex);
    expect(ordersIndex).toBeLessThan(passwordIndex);
  });

  it("shows Inbox and password change for support without product or order management", () => {
    const { container } = renderAdmin("support");
    expect(container.querySelector('[data-testid="admin-inbox"]')).not.toBeNull();
    expect(container.textContent).toContain("admin.changePassword");
    expect(container.textContent).not.toContain("admin.manageProducts");
    expect(container.textContent).not.toContain("admin.manageOrders");
    expect(container.querySelector('[data-testid="admin-add-product"]')).toBeNull();
  });

  it("uses responsive button and link layout classes", () => {
    const { container } = renderAdmin("admin");
    expect(container.innerHTML).toContain("flex flex-col sm:flex-row");
    expect(container.innerHTML).toContain("flex-wrap");
  });
  it("opens the existing product form from both dashboard buttons", () => {
    const { container } = renderAdmin("admin");
    const buttons = Array.from(container.querySelectorAll('[data-testid^="admin-add-product"]'));
    expect(buttons).toHaveLength(2);
    buttons.forEach((button) => {
      expect(button.getAttribute("href")).toBe("/admin/products/new");
    });
  });

});
