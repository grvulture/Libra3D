import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

export async function fetchProducts() {
  const response = await api.get("/api/products");
  return response.data;
}

export async function fetchProduct(productId) {
  const response = await api.get(`/api/products/${encodeURIComponent(productId)}`);
  return response.data;
}

export { API_BASE_URL };
