import React from "react";
import { DollarSign, Package, ShoppingCart, ClipboardList, Plus, TrendingUp, ArrowUpRight, Eye } from "lucide-react";
import { PRODUCTS, ADMIN_ORDERS, ADMIN_REQUESTS, BRAND } from "../data/products";
import { useLocale } from "../context/LocaleContext";

const Admin = () => {
  const { t, formatPrice } = useLocale();
  const revenue = 24180; // EUR base
  const orders = ADMIN_ORDERS.length + 184;
  const productCount = PRODUCTS.length;
  const requests = ADMIN_REQUESTS.length;

  return (
    <div data-testid="admin-page" className="text-white">
      <section className="border-b border-[#D4A53A]/15 bg-[#0A4143]/40">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-4">
            <img src={BRAND.logoUrl} alt="" className="h-12 w-12 border border-[#D4A53A]/40 object-cover" />
            <div>
              <div className="eyebrow">{t("admin.eyebrow")}</div>
              <h1 className="font-heading font-black text-2xl lg:text-3xl">{t("admin.title")}</h1>
            </div>
          </div>
          <button className="btn-gold" data-testid="admin-add-product">
            <Plus size={14} /> {t("admin.addProduct")}
          </button>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { k: t("admin.stat.revenue"), v: formatPrice(revenue, { fractionDigits: 0 }), d: "+12.4%", icon: DollarSign },
          { k: t("admin.stat.orders"), v: orders.toLocaleString(), d: "+5.1%", icon: ShoppingCart },
          { k: t("admin.stat.products"), v: productCount.toString(), d: "Live", icon: Package },
          { k: t("admin.stat.requests"), v: requests.toString(), d: "Action needed", icon: ClipboardList },
        ].map((s) => (
          <div key={s.k} className="border border-[#D4A53A]/20 bg-[#0F5E60] p-6 relative overflow-hidden" data-testid={`admin-stat-${s.k}`}>
            <div className="flex items-center justify-between">
              <div className="eyebrow">{s.k}</div>
              <s.icon size={16} className="text-[#D4A53A]" />
            </div>
            <div className="font-heading font-black text-3xl text-white mt-4">{s.v}</div>
            <div className="text-[11px] uppercase tracking-[0.18em] mt-3 text-[#D4A53A] flex items-center gap-1">
              <TrendingUp size={11} /> {s.d}
            </div>
          </div>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 border border-[#D4A53A]/20 bg-[#0F5E60] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="eyebrow">{t("admin.revenueChart")}</div>
              <div className="font-heading font-bold text-xl text-white mt-1">{formatPrice(revenue, { fractionDigits: 0 })}</div>
            </div>
            <div className="flex gap-2 text-[10px] uppercase tracking-[0.18em] text-white/65">
              <span className="border border-[#D4A53A] text-[#D4A53A] px-2 py-1">14D</span>
              <span className="border border-[#D4A53A]/20 px-2 py-1">30D</span>
              <span className="border border-[#D4A53A]/20 px-2 py-1">90D</span>
            </div>
          </div>
          <div className="h-44 flex items-end gap-2">
            {[40, 62, 55, 78, 50, 88, 60, 72, 95, 65, 82, 90, 70, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-gradient-to-t from-[#D4A53A]/30 to-[#D4A53A]/80 hover:from-[#D4A53A]/60 hover:to-[#D4A53A] transition-all" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 border border-[#D4A53A]/20 bg-[#0F5E60] p-6">
          <div className="eyebrow mb-5">{t("admin.topSellers")}</div>
          <ul className="space-y-4">
            {PRODUCTS.filter((p) => p.bestSeller).slice(0, 4).map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="text-[#D4A53A] font-heading font-black w-6">0{i + 1}</span>
                <img src={p.images[0]} alt="" className="h-10 w-10 object-cover border border-[#D4A53A]/15" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{p.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/55">{p.material}</div>
                </div>
                <div className="text-[#D4A53A] text-sm font-bold">{formatPrice(p.price)}</div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 border border-[#D4A53A]/20 bg-[#0F5E60] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-bold text-white">{t("admin.recentOrders")}</h3>
            <a href="#" className="text-xs uppercase tracking-[0.22em] text-[#D4A53A] flex items-center gap-1">
              {t("common.viewAll")} <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-orders-table">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.22em] text-[#D4A53A]">
                  {["Order", "Customer", "Date", "Total", "Status"].map((h) => (
                    <th key={h} className="text-left pb-3 border-b border-[#D4A53A]/20">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ADMIN_ORDERS.map((o) => (
                  <tr key={o.id} className="border-b border-[#D4A53A]/10 hover:bg-[#0A4143]/40 transition-colors">
                    <td className="py-4 text-white">{o.id}</td>
                    <td className="py-4 text-white/85">{o.customer}</td>
                    <td className="py-4 text-white/60">{o.date}</td>
                    <td className="py-4 text-[#D4A53A] font-bold">{formatPrice(o.total)}</td>
                    <td className="py-4">
                      <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 border ${
                        o.status === "Delivered" ? "border-[#D4A53A]/30 text-[#D4A53A]" :
                        o.status === "Shipped" ? "border-white/25 text-white/85" :
                        "border-white/15 text-white/65"
                      }`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 border border-[#D4A53A]/20 bg-[#0F5E60] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-bold text-white">{t("admin.pendingRequests")}</h3>
            <a href="#" className="text-xs uppercase tracking-[0.22em] text-[#D4A53A] flex items-center gap-1">
              {t("common.viewAll")} <ArrowUpRight size={12} />
            </a>
          </div>
          <ul className="space-y-4">
            {ADMIN_REQUESTS.map((r) => (
              <li key={r.id} className="border border-[#D4A53A]/10 p-4 hover:border-[#D4A53A]/35 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.22em] text-[#D4A53A]">{r.id}</div>
                    <div className="font-heading font-bold text-white mt-1">{r.name}</div>
                  </div>
                  <span className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 border ${
                    r.status === "Pending" ? "border-[#D4A53A]/30 text-[#D4A53A]" :
                    r.status === "Quoted" ? "border-white/25 text-white/85" :
                    "border-white/15 text-white/65"
                  }`}>{r.status}</span>
                </div>
                <p className="text-white/75 text-sm mt-2">{r.idea}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">{r.material}</span>
                  <button className="text-xs uppercase tracking-[0.18em] text-[#D4A53A] hover:text-white flex items-center gap-1">
                    <Eye size={12} /> Review
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
        <div className="border border-[#D4A53A]/20 bg-[#0F5E60] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading font-bold text-white">{t("admin.products")}</h3>
            <button className="btn-ghost-gold !py-2 !px-4 !text-[11px]" data-testid="admin-add-product-2">
              <Plus size={12} /> {t("admin.addProduct")}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="admin-products-table">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.22em] text-[#D4A53A]">
                  {["Product", t("shop.filter.category"), t("common.material"), "Stock", "Price"].map((h) => (
                    <th key={h} className="text-left pb-3 border-b border-[#D4A53A]/20">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRODUCTS.map((p) => (
                  <tr key={p.id} className="border-b border-[#D4A53A]/10 hover:bg-[#0A4143]/40 transition-colors">
                    <td className="py-3 flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-10 w-10 object-cover border border-[#D4A53A]/15" />
                      <span className="text-white">{p.name}</span>
                    </td>
                    <td className="py-3 text-white/75">{t(`cat.${p.category}`)}</td>
                    <td className="py-3 text-white/75">{p.material}</td>
                    <td className="py-3">
                      <span className={`text-[10px] uppercase tracking-[0.18em] ${p.inStock ? "text-[#D4A53A]" : "text-white/50"}`}>
                        {p.inStock ? t("common.inStock") : t("common.soldOut")}
                      </span>
                    </td>
                    <td className="py-3 text-[#D4A53A] font-bold">{formatPrice(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admin;
