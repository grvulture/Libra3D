import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminTickets } from "../api/tickets";
import { useLocale } from "../context/LocaleContext";

const AdminTickets = () => {
  const { t } = useLocale();
  const [data, setData] = useState({ items: [], total: 0 });
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });
  const filtersRef = useRef({ status, priority, query });
  useEffect(() => {
    filtersRef.current = { status, priority, query };
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { status: currentStatus, priority: currentPriority, query: currentQuery } = filtersRef.current;
      const result = await fetchAdminTickets({ status: currentStatus || undefined, priority: currentPriority || undefined, q: currentQuery || undefined });
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("tickets.errors.load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-white">
      <h1 className="font-heading font-black text-3xl mb-6">{t("tickets.title")}</h1>
      <Link to="/admin" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A]">{t("common.backToDashboard")}</Link>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("tickets.search")} className="brand-input w-64" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="brand-input w-40">
          <option value="">{t("tickets.allStatuses")}</option>
          <option value="open">{t("tickets.status.open")}</option>
          <option value="pending">{t("tickets.status.pending")}</option>
          <option value="solved">{t("tickets.status.solved")}</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="brand-input w-40">
          <option value="">{t("tickets.allPriorities")}</option>
          <option value="normal">{t("tickets.priority.normal")}</option>
          <option value="important">{t("tickets.priority.important")}</option>
          <option value="urgent">{t("tickets.priority.urgent")}</option>
        </select>
        <button onClick={load} className="btn-gold">{t("common.apply")}</button>
      </div>
      {error && <div className="text-red-300 text-sm mb-4">{error}</div>}
      {loading ? (
        <div>{t("tickets.loading")}</div>
      ) : (
        <div className="border border-[#D4A53A]/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#D4A53A]">
                <th className="text-left p-3">{t("tickets.subject")}</th>
                <th className="text-left p-3">{t("tickets.customer")}</th>
                <th className="text-left p-3">{t("tickets.statusLabel")}</th>
                <th className="text-left p-3">{t("tickets.priorityLabel")}</th>
                <th className="text-left p-3">{t("tickets.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((ticket) => (
                <tr key={ticket.id} className="border-t border-[#D4A53A]/10">
                  <td className="p-3">
                    <Link to={`/admin/tickets/${ticket.id}`} className="text-[#D4A53A] hover:underline">{ticket.subject}</Link>
                  </td>
                  <td className="p-3">{ticket.customer_name} ({ticket.customer_email})</td>
                  <td className="p-3">{t(`tickets.status.${ticket.status}`)}</td>
                  <td className="p-3">{t(`tickets.priority.${ticket.priority}`)}</td>
                  <td className="p-3">{new Date(ticket.updated_at).toLocaleString()}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td className="p-3" colSpan="5">{t("tickets.empty")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        .brand-input { background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 8px 10px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default AdminTickets;
