import axios from "axios";
import { fetchCsrfToken } from "./auth";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const ensureCsrfToken = async () => {
  if (readCookie("libra3d_csrf")) return readCookie("libra3d_csrf");
  return fetchCsrfToken();
};

export async function fetchAdminProducts(params = {}) {
  const response = await api.get("/api/admin/products", { params });
  return response.data;
}

export async function createAdminProduct(payload) {
  const csrfToken = await ensureCsrfToken();
  const response = await api.post("/api/admin/products", payload, {
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
  });
  return response.data;
}

export async function updateAdminProduct(productId, payload) {
  const csrfToken = await ensureCsrfToken();
  const response = await api.patch(`/api/admin/products/${encodeURIComponent(productId)}`, payload, {
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {},
  });
  return response.data;
}
