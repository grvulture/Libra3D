import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { act } from "react-dom/test-utils";

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "admin" }, loading: false }),
}));

jest.mock("../context/LocaleContext", () => ({
  useLocale: () => ({ t: (key) => key }),
}));

jest.mock("../api/auth", () => ({
  changePassword: jest.fn(),
}));

import ChangePassword from "./ChangePassword";

test("renders change password form and cancel action", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <ChangePassword />
      </MemoryRouter>
    );
  });
  expect(container.textContent).toContain("changePassword.title");
  expect(container.textContent).toContain("changePassword.currentPassword");
  expect(container.textContent).toContain("changePassword.newPassword");
  expect(container.textContent).toContain("changePassword.confirmPassword");
  expect(container.textContent).toContain("common.cancel");
  document.body.innerHTML = "";
});
