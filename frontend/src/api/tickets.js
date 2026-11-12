import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

let api = null;
const getApi = () => {
  if (!api) api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
  return api;
};

const readCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

const ensureCsrfToken = async () => {
  if (readCookie("libra3d_csrf")) return readCookie("libra3d_csrf");
  const response = await getApi().get("/api/auth/csrf");
  return response.data.csrf_token;
};

export function resetTicketRequests() {
  ticketRequests.clear();
}

const ticketRequests = new Map();

export async function createTicket(payload) {
  const response = await getApi().post("/api/tickets", payload);
  return response.data;
}

export async function requestTicketAccess(email) {
  const response = await getApi().post("/api/tickets/access", { email });
  return response.data;
}

export async function validateTicketAccess(token) {
  const response = await getApi().post("/api/tickets/access/validate", { token });
  return response.data;
}

export async function exchangeTicketAccess(token) {
  const csrfToken = await ensureCsrfToken();
  const response = await getApi().post(
    "/api/tickets/access/exchange",
    { token },
    { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
  );
  return response.data;
}

export function fetchTicket(ticketId) {
  const existing = ticketRequests.get(ticketId);
  if (existing) return existing;
  const request = getApi()
    .get(`/api/tickets/${encodeURIComponent(ticketId)}`)
    .then((response) => response.data)
    .finally(() => {
      ticketRequests.delete(ticketId);
    });
  ticketRequests.set(ticketId, request);
  return request;
}

export async function replyToTicket(ticketId, body) {
  const csrfToken = await ensureCsrfToken();
  const response = await getApi().post(
    `/api/tickets/${encodeURIComponent(ticketId)}/messages`,
    { body },
    { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
  );
  return response.data;
}

export async function fetchAdminTickets(params = {}) {
  const response = await getApi().get("/api/admin/tickets", { params });
  return response.data;
}

export async function fetchAdminTicket(ticketId) {
  const response = await getApi().get(`/api/admin/tickets/${encodeURIComponent(ticketId)}`);
  return response.data;
}

export async function replyToAdminTicket(ticketId, body) {
  const csrfToken = await ensureCsrfToken();
  const response = await getApi().post(
    `/api/admin/tickets/${encodeURIComponent(ticketId)}/messages`,
    { body },
    { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
  );
  return response.data;
}

export async function updateAdminTicket(ticketId, payload) {
  const csrfToken = await ensureCsrfToken();
  const response = await getApi().patch(
    `/api/admin/tickets/${encodeURIComponent(ticketId)}`,
    payload,
    { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
  );
  return response.data;
}

export async function retryEmailNotification(notificationId) {
  const csrfToken = await ensureCsrfToken();
  const response = await getApi().post(
    `/api/admin/email-notifications/${encodeURIComponent(notificationId)}/retry`,
    null,
    { headers: csrfToken ? { "X-CSRF-Token": csrfToken } : {} }
  );
  return response.data;
}
