import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

let api = null;
const getApi = () => {
  if (!api) api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
  return api;
};

export async function fetchCsrfToken() {
  const response = await getApi().get("/api/auth/csrf");
  return response.data.csrf_token;
}

export function resetCurrentUserRequest() {
  currentUserRequest = null;
}

let currentUserRequest = null;

export async function login(email, password) {
  resetCurrentUserRequest();
  const csrfToken = readCookie("libra3d_csrf");
  const response = await getApi().post(
    "/api/auth/login",
    { email, password },
    { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
  );
  return response.data;
}

export async function logout(csrfToken) {
  resetCurrentUserRequest();
  const response = await getApi().post("/api/auth/logout", null, {
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
  });
  return response.data;
}

export function fetchCurrentUser() {
  if (!currentUserRequest) {
    currentUserRequest = getApi()
      .get("/api/auth/me")
      .then((response) => response.data)
      .finally(() => {
        currentUserRequest = null;
      });
  }
  return currentUserRequest;
}

export async function changePassword(currentPassword, newPassword) {
  let csrfToken = readCookie("libra3d_csrf");
  if (!csrfToken) {
    csrfToken = await fetchCsrfToken();
  }
  const response = await getApi().post(
    "/api/auth/password",
    { current_password: currentPassword, new_password: newPassword },
    { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
  );
  return response.data;
}

export { API_BASE_URL };
