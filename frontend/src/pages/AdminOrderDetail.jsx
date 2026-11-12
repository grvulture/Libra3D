import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchAdminOrder, updateAdminOrder } from "../api/orders";
import { useLocale } from "../context/LocaleContext";

const AdminOrderDetail = () => {
  const { t } = useLocale();
  const { id } = useParams();
  const tRef = useRef(t);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminOrder(id);
      setOrder(result);
      setStatus(result.status);
      setNotes(result.notes || "");
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("orders.errors.load"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await updateAdminOrder(id, { status, notes });
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("orders.errors.update"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-32 text-white">{t("orders.loading")}</div>;
  if (error || !order) return <div className="max-w-3xl mx-auto px-6 py-32 text-white">{error || t("orders.notFound")}</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <Link to="/admin/orders" className="text-[#D4A53A] text-sm">{t("orders.backToOrders")}</Link>
      <h1 className="font-heading font-black text-3xl mt-4 mb-2">Order {order.id}</h1>
      <div className="text-white/60 text-sm mb-6">
        {t("orders.paymentStatus")}: {order.payment_status} ({t("orders.paymentNotIntegrated")})
      </div>

      <div className="border border-[#D4A53A]/20 bg-[#0F5E60] p-6 mb-6 space-y-2">
        <div>{order.first_name} {order.last_name}</div>
        <div>{order.email}</div>
        <div>{order.shipping_address}, {order.city}, {order.postal_code}, {order.country}</div>
        <div>{t("common.subtotal")}: {order.subtotal} {order.currency}</div>
        <div>{t("common.shipping")}: {order.shipping} {order.currency}</div>
        <div>{t("common.total")}: {order.total} {order.currency}</div>
      </div>

      <div className="mb-6">
        <h2 className="font-heading font-bold text-xl mb-3">{t("orders.items")}</h2>
        <div className="border border-[#D4A53A]/20">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#D4A53A]">
                <th className="text-left p-3">{t("orders.product")}</th>
                <th className="text-left p-3">{t("orders.qty")}</th>
                <th className="text-left p-3">{t("orders.unitPrice")}</th>
                <th className="text-left p-3">{t("orders.lineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="border-t border-[#D4A53A]/10">
                  <td className="p-3">{item.product_name} ({item.product_id}) {item.color ? `· ${item.color}` : ""}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.unit_price}</td>
                  <td className="p-3">{item.line_total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 max-w-md">
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("orders.statusLabel")}</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="brand-input">
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("orders.notes")}</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="brand-input resize-none" />
        </label>
        <button onClick={save} disabled={saving} className="btn-gold">{saving ? t("common.saving") : t("common.save")}</button>
        {error && <div className="text-red-300 text-sm">{error}</div>}
      </div>

      <style>{`
        .brand-input { width: 100%; background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 12px 14px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default AdminOrderDetail;
