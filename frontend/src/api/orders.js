import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

export async function placeOrder(payload) {
  const response = await api.post("/api/orders", payload);
  return response.data;
}

export async function fetchAdminOrders(params = {}) {
  const response = await api.get("/api/admin/orders", { params });
  return response.data;
}

export async function fetchAdminOrder(orderId) {
  const response = await api.get(`/api/admin/orders/${encodeURIComponent(orderId)}`);
  return response.data;
}

export async function createAdminOrder(payload) {
  const response = await api.post("/api/admin/orders", payload);
  return response.data;
}

export async function updateAdminOrder(orderId, payload) {
  const response = await api.patch(`/api/admin/orders/${encodeURIComponent(orderId)}`, payload);
  return response.data;
}
