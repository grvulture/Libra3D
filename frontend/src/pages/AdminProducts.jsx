import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { CATEGORIES } from "../data/products";
import { useLocale } from "../context/LocaleContext";
import { fetchAdminProducts, createAdminProduct, updateAdminProduct } from "../api/adminProducts";

const emptyForm = {
  id: "",
  name: "",
  category: CATEGORIES[0]?.id || "",
  price: "",
  rating: "",
  reviews: "",
  bestSeller: false,
  inStock: true,
  material: "",
  materials: "",
  colors: "",
  dimensions: "",
  description: "",
  images: "",
  new: false,
};

const AdminProducts = () => {
  const { t } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const isCreateRoute = location.pathname === "/admin/products/new";
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 20 });
  const [success, setSuccess] = useState(location.state?.created ? t("products.created") : "");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const filtersRef = useRef({ query, category });
  useEffect(() => {
    filtersRef.current = { query, category };
  });

  useEffect(() => {
    const openCreate = new URLSearchParams(location.search).get("create") === "1" || location.pathname.endsWith("/new");
    if (openCreate) {
      setEditingId(null);
      setForm(emptyForm);
      setSuccess("");
    }
    if (location.state?.created) {
      setSuccess(t("products.created"));
    }
  }, [location.pathname, location.search, location.state, t]);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const { query: currentQuery, category: currentCategory } = filtersRef.current;
      const result = await fetchAdminProducts({
        page,
        page_size: 20,
        q: currentQuery || undefined,
        category: currentCategory || undefined,
      });
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("products.errors.load"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const splitList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        id: form.id.trim(),
        name: form.name.trim(),
        category: form.category,
        price: Number(form.price),
        rating: form.rating === "" ? 0 : Number(form.rating),
        reviews: form.reviews === "" ? 0 : Number(form.reviews),
        bestSeller: form.bestSeller,
        inStock: form.inStock,
        material: form.material.trim(),
        materials: splitList(form.materials),
        colors: splitList(form.colors),
        dimensions: form.dimensions.trim(),
        description: form.description.trim(),
        images: splitList(form.images),
        new: form.new,
      };
      if (editingId) {
        const { id, ...updates } = payload;
        await updateAdminProduct(editingId, updates);
      } else {
        await createAdminProduct(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setSuccess(t("products.created"));
      await load(data.page || 1);
      navigate("/admin/products", { replace: true, state: { created: true } });
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("products.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const editProduct = (product) => {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name || "",
      category: product.category || CATEGORIES[0]?.id || "",
      price: String(product.price ?? ""),
      rating: String(product.rating ?? ""),
      reviews: String(product.reviews ?? ""),
      bestSeller: Boolean(product.bestSeller),
      inStock: Boolean(product.inStock),
      material: product.material || "",
      materials: (product.materials || []).join(", "),
      colors: (product.colors || []).join(", "),
      dimensions: product.dimensions || "",
      description: product.description || "",
      images: (product.images || []).join(", "),
      new: Boolean(product.new),
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-black text-3xl">Products</h1>
        <Link to="/admin" className="text-[#D4A53A] text-sm">{t("common.backToDashboard")}</Link>
      </div>

      {!isCreateRoute && (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("products.search")} className="brand-input w-64" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="brand-input w-48">
              <option value="">{t("products.allCategories")}</option>
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <button onClick={() => load(1)} className="btn-gold">{t("common.apply")}</button>
          </div>

          <div className="border border-[#D4A53A]/20 mb-10">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#D4A53A]">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">{t("products.stock")}</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-3" colSpan="5">{t("products.loading")}</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td className="p-3" colSpan="5">{t("products.empty")}</td></tr>
            ) : (
              data.items.map((product) => (
                <tr key={product.id} className="border-t border-[#D4A53A]/10">
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">{product.category}</td>
                  <td className="p-3">{product.price}</td>
                  <td className="p-3">{product.inStock ? t("common.inStock") : t("common.soldOut")}</td>
                  <td className="p-3">
                    <button onClick={() => editProduct(product)} className="text-[#D4A53A] hover:underline">{t("common.edit")}</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mb-10">
        {Array.from({ length: Math.ceil((data.total || 0) / (data.page_size || 20)) }).map((_, index) => (
          <button
            key={index}
            onClick={() => load(index + 1)}
            className={`border px-3 py-1 text-sm ${data.page === index + 1 ? "border-[#D4A53A] text-[#D4A53A]" : "border-[#D4A53A]/25 text-white/70"}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
      </>
      )}

      {success && <div className="text-green-300 text-sm mb-4">{success}</div>}
      {error && <div className="text-red-300 text-sm mb-4">{error}</div>}

      <form onSubmit={submit} className="border border-[#D4A53A]/20 bg-[#0F5E60] p-7 space-y-5">
        <h2 className="font-heading font-bold text-xl text-white">{editingId ? t("products.editProduct") : t("products.createProduct")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.id")}</div>
            <input value={form.id} onChange={(e) => setField("id", e.target.value)} disabled={Boolean(editingId)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.name")}</div>
            <input value={form.name} onChange={(e) => setField("name", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.category")}</div>
            <select value={form.category} onChange={(e) => setField("category", e.target.value)} className="brand-input">
              {CATEGORIES.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#0F5E60]">{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.price")}</div>
            <input value={form.price} onChange={(e) => setField("price", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.material")}</div>
            <input value={form.material} onChange={(e) => setField("material", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.materials")}</div>
            <input value={form.materials} onChange={(e) => setField("materials", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.colors")}</div>
            <input value={form.colors} onChange={(e) => setField("colors", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.images")}</div>
            <input value={form.images} onChange={(e) => setField("images", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.dimensions")}</div>
            <input value={form.dimensions} onChange={(e) => setField("dimensions", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.rating")}</div>
            <input value={form.rating} onChange={(e) => setField("rating", e.target.value)} className="brand-input" />
          </label>
          <label className="block">
            <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.reviews")}</div>
            <input value={form.reviews} onChange={(e) => setField("reviews", e.target.value)} className="brand-input" />
          </label>
        </div>
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("products.description")}</div>
          <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={5} className="brand-input resize-none" />
        </label>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.inStock} onChange={(e) => setField("inStock", e.target.checked)} />
            <span>{t("common.inStock")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.bestSeller} onChange={(e) => setField("bestSeller", e.target.checked)} />
            <span>{t("products.bestSeller")}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.new} onChange={(e) => setField("new", e.target.checked)} />
            <span>{t("common.new")}</span>
          </label>
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-gold">{saving ? t("common.saving") : editingId ? t("products.updateProduct") : t("products.createProduct")}</button>
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm(emptyForm);
              setSuccess("");
              navigate("/admin/products", { replace: true });
            }}
            className="btn-ghost-gold"
          >
            {t("common.cancel")}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
              className="btn-ghost-gold"
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>

      <style>{`
        .brand-input { width: 100%; background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 12px 14px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default AdminProducts;
