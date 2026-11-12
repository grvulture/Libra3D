import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";
import { createAdminOrder } from "../api/orders";

const AdminOrderCreate = () => {
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const cancelTarget = location.state?.from && String(location.state.from).startsWith("/") ? location.state.from : "/admin/orders";
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    shipping_address: "",
    city: "",
    postal_code: "",
    country: "Ελλάδα",
    notes: "",
    items: [{ product_id: "", quantity: "1", color: "" }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const fieldLabel = (field) => t(`orders.fields.${field}`);

  const setItem = (index, key, value) => {
    setForm((current) => {
      const items = [...current.items];
      items[index] = { ...items[index], [key]: value };
      return { ...current, items };
    });
  };

  const addItem = () => setForm((current) => ({ ...current, items: [...current.items, { product_id: "", quantity: "1", color: "" }] }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const order = await createAdminOrder({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        shipping_address: form.shipping_address,
        city: form.city,
        postal_code: form.postal_code,
        country: form.country,
        notes: form.notes || undefined,
        items: form.items.map((item) => ({
          product_id: item.product_id.trim(),
          quantity: Number(item.quantity),
          color: item.color.trim() || undefined,
        })),
      });
      navigate(`/admin/orders/${order.id}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || t("orders.errors.create"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <h1 className="font-heading font-black text-3xl mb-6">{t("orders.createTitle")}</h1>
      {error && <div className="text-red-300 text-sm mb-4">{error}</div>}
      <form onSubmit={submit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {["email", "first_name", "last_name", "shipping_address", "city", "postal_code", "country"].map((field) => (
            <label key={field} className="block">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{fieldLabel(field)}</div>
              <input value={form[field]} onChange={(e) => setField(field, e.target.value)} className="brand-input" />
            </label>
          ))}
        </div>
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("orders.notes")}</div>
          <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} className="brand-input resize-none" />
        </label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-xl">{t("orders.items")}</h2>
            <button type="button" onClick={addItem} className="btn-ghost-gold">{t("orders.addItem")}</button>
          </div>
          {form.items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={item.product_id} onChange={(e) => setItem(index, "product_id", e.target.value)} placeholder={t("orders.productId")} className="brand-input" />
              <input value={item.quantity} onChange={(e) => setItem(index, "quantity", e.target.value)} placeholder={t("orders.quantity")} className="brand-input" />
              <input value={item.color} onChange={(e) => setItem(index, "color", e.target.value)} placeholder={t("orders.colorOptional")} className="brand-input" />
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-gold">{saving ? t("common.saving") : t("orders.createOrder")}</button>
          <button type="button" onClick={() => navigate(cancelTarget, { replace: true })} className="btn-ghost-gold">
            {t("common.cancel")}
          </button>
        </div>
      </form>
      <style>{`
        .brand-input { width: 100%; background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 12px 14px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default AdminOrderCreate;
