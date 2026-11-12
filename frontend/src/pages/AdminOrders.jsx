import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchAdminOrders } from "../api/orders";
import { useLocale } from "../context/LocaleContext";

const AdminOrders = () => {
  const location = useLocation();
  const { t } = useLocale();
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 20 });
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });
  const filtersRef = useRef({ status, query });
  useEffect(() => {
    filtersRef.current = { status, query };
  });

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { status: currentStatus, query: currentQuery } = filtersRef.current;
      const result = await fetchAdminOrders({ page, page_size: 20, status: currentStatus || undefined, q: currentQuery || undefined });
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("orders.errors.load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-black text-3xl">{t("orders.title")}</h1>
        <Link to="/admin" className="text-[#D4A53A] text-sm">{t("common.backToDashboard")}</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("orders.search")} className="brand-input w-64" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="brand-input w-40">
          <option value="">{t("orders.allStatuses")}</option>
          <option value="pending">{t("orders.status.pending")}</option>
          <option value="processing">{t("orders.status.processing")}</option>
          <option value="shipped">{t("orders.status.shipped")}</option>
          <option value="delivered">{t("orders.status.delivered")}</option>
          <option value="cancelled">{t("orders.status.cancelled")}</option>
        </select>
        <button onClick={() => load(1)} className="btn-gold">{t("common.apply")}</button>
        <Link to="/admin/orders/new" state={{ from: location.pathname }} className="btn-gold ml-auto">{t("orders.newOrder")}</Link>
      </div>
      {error && <div className="text-red-300 text-sm mb-4">{error}</div>}
      {loading ? (
        <div>{t("orders.loading")}</div>
      ) : (
        <div className="border border-[#D4A53A]/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#D4A53A]">
                <th className="text-left p-3">{t("orders.order")}</th>
                <th className="text-left p-3">{t("orders.customer")}</th>
                <th className="text-left p-3">{t("orders.statusLabel")}</th>
                <th className="text-left p-3">{t("orders.total")}</th>
                <th className="text-left p-3">{t("orders.created")}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.id} className="border-t border-[#D4A53A]/10">
                  <td className="p-3">
                    <Link to={`/admin/orders/${order.id}`} className="text-[#D4A53A] hover:underline">{order.id}</Link>
                  </td>
                  <td className="p-3">{order.first_name} {order.last_name} ({order.email})</td>
                  <td className="p-3">{order.status}</td>
                  <td className="p-3">{order.total} {order.currency}</td>
                  <td className="p-3">{new Date(order.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr><td className="p-3" colSpan="5">{t("orders.empty")}</td></tr>
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

export default AdminOrders;
