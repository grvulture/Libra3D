import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Lock, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useLocale } from "../context/LocaleContext";

const Checkout = () => {
  const { items, subtotal, clearCart } = useCart();
  const { t, formatPrice } = useLocale();
  const navigate = useNavigate();
  const shipping = subtotal === 0 ? 0 : subtotal >= 75 ? 0 : 8.5;
  const tax = +(subtotal * 0.24).toFixed(2);
  const total = subtotal + shipping + tax;

  const [form, setForm] = useState({
    email: "", first: "", last: "", address: "", city: "", zip: "", country: "Ελλάδα",
    card: "", exp: "", cvc: "",
  });
  const [placed, setPlaced] = useState(false);

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const place = (e) => {
    e.preventDefault();
    if (!form.email || !form.first || !form.address) {
      toast.error(t("checkout.errorRequired"));
      return;
    }
    setPlaced(true);
    clearCart();
  };

  if (items.length === 0 && !placed) {
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-10 py-32 text-center text-white">
        <h1 className="font-heading font-black text-3xl">{t("checkout.emptyTitle")}</h1>
        <p className="text-white/65 mt-3">{t("checkout.emptyBody")}</p>
        <Link to="/shop" className="btn-gold mt-8 inline-flex">{t("common.browseShop")}</Link>
      </div>
    );
  }

  if (placed) {
    return (
      <div data-testid="checkout-success" className="max-w-3xl mx-auto px-6 lg:px-10 py-32 text-center text-white">
        <div className="h-16 w-16 mx-auto border border-[#D4A53A] flex items-center justify-center mb-8">
          <CheckCircle2 size={26} className="text-[#D4A53A]" />
        </div>
        <div className="eyebrow mb-3">{t("checkout.eyebrow")}</div>
        <h1 className="font-heading font-black text-3xl lg:text-5xl">
          {t("checkout.successTitle", { name: form.first || "—" })}
        </h1>
        <p className="text-white/75 mt-5">
          {t("checkout.successBody", { email: form.email })}{" "}
          <span className="text-white font-bold">#LB-{Math.floor(10000 + Math.random()*8999)}</span>.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link to="/shop" className="btn-gold">{t("common.continueShopping")}</Link>
          <button onClick={() => navigate("/")} className="btn-ghost-gold">{t("checkout.backHome")}</button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="checkout-page" className="text-white">
      <section className="border-b border-[#D4A53A]/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
          <div className="eyebrow mb-3">{t("checkout.eyebrow")}</div>
          <h1 className="font-heading font-black text-4xl lg:text-5xl">{t("checkout.title")}</h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <form onSubmit={place} className="lg:col-span-7 space-y-10" data-testid="checkout-form">
          <FormBlock title={t("checkout.contact")}>
            <Field label={t("checkout.email")}>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} data-testid="checkout-email" className="brand-input" placeholder="you@studio.com" />
            </Field>
          </FormBlock>

          <FormBlock title={t("checkout.shipping")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={t("checkout.first")}>
                <input value={form.first} onChange={(e) => set("first", e.target.value)} data-testid="checkout-first" className="brand-input" />
              </Field>
              <Field label={t("checkout.last")}>
                <input value={form.last} onChange={(e) => set("last", e.target.value)} data-testid="checkout-last" className="brand-input" />
              </Field>
            </div>
            <Field label={t("checkout.address")}>
              <input value={form.address} onChange={(e) => set("address", e.target.value)} data-testid="checkout-address" className="brand-input" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Field label={t("checkout.city")}><input value={form.city} onChange={(e) => set("city", e.target.value)} data-testid="checkout-city" className="brand-input" /></Field>
              <Field label={t("checkout.zip")}><input value={form.zip} onChange={(e) => set("zip", e.target.value)} data-testid="checkout-zip" className="brand-input" /></Field>
              <Field label={t("checkout.country")}>
                <select value={form.country} onChange={(e) => set("country", e.target.value)} data-testid="checkout-country" className="brand-input">
                  {["Ελλάδα", "Κύπρος", "Γερμανία", "Γαλλία", "Ιταλία", "Ισπανία", "Ηνωμένο Βασίλειο", "ΗΠΑ"].map((c) => (
                    <option key={c} value={c} className="bg-[#0F5E60]">{c}</option>
                  ))}
                </select>
              </Field>
            </div>
          </FormBlock>

          <FormBlock title={t("checkout.payment")} badge={t("checkout.paymentBadge")}>
            <div className="border border-[#D4A53A]/20 p-5 bg-[#0A4143]/50 flex items-center gap-3 mb-5">
              <CreditCard size={16} className="text-[#D4A53A]" />
              <div className="text-sm text-white/75">{t("checkout.paymentNote")}</div>
            </div>
            <Field label={t("checkout.card")}>
              <input value={form.card} onChange={(e) => set("card", e.target.value)} data-testid="checkout-card" className="brand-input" placeholder="4242 4242 4242 4242" />
            </Field>
            <div className="grid grid-cols-2 gap-5">
              <Field label={t("checkout.exp")}>
                <input value={form.exp} onChange={(e) => set("exp", e.target.value)} data-testid="checkout-exp" className="brand-input" placeholder="MM / YY" />
              </Field>
              <Field label={t("checkout.cvc")}>
                <input value={form.cvc} onChange={(e) => set("cvc", e.target.value)} data-testid="checkout-cvc" className="brand-input" placeholder="123" />
              </Field>
            </div>
          </FormBlock>

          <button type="submit" data-testid="checkout-place-order" className="btn-gold w-full justify-center">
            <Lock size={14} /> {t("checkout.placeOrder")} · {formatPrice(total)}
          </button>
        </form>

        <aside className="lg:col-span-5">
          <div className="border border-[#D4A53A]/20 bg-[#0F5E60] p-6 lg:p-7 sticky top-28">
            <div className="eyebrow mb-5">{t("checkout.summary")}</div>
            <div className="space-y-5 max-h-80 overflow-y-auto pr-2" data-testid="checkout-items">
              {items.map((it) => (
                <div key={it.key} className="flex gap-4">
                  <img src={it.image} alt="" className="h-16 w-16 object-cover border border-[#D4A53A]/20" />
                  <div className="flex-1">
                    <div className="font-heading font-bold text-white text-sm">{it.name}</div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/55 mt-0.5">{it.material} · {it.color}</div>
                    <div className="text-xs text-white/60 mt-1">{t("common.qty")} {it.qty}</div>
                  </div>
                  <div className="text-[#D4A53A] font-bold text-sm">{formatPrice(it.price * it.qty)}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#D4A53A]/15 mt-6 pt-5 space-y-3 text-sm">
              <Row k={t("common.subtotal")} v={formatPrice(subtotal)} />
              <Row k={t("common.shipping")} v={shipping === 0 ? t("common.free") : formatPrice(shipping)} />
              <Row k={t("common.tax")} v={formatPrice(tax)} />
              <div className="border-t border-[#D4A53A]/15 pt-3 flex items-center justify-between">
                <span className="font-heading text-white">{t("common.total")}</span>
                <span data-testid="checkout-total" className="font-heading font-bold text-[#D4A53A] text-xl">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <style>{`
        .brand-input {
          width: 100%;
          background: #0A4143;
          border: 1px solid rgba(212,165,58,0.25);
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }
        .brand-input:focus {
          outline: none;
          border-color: #D4A53A;
          box-shadow: 0 0 0 1px rgba(212,165,58,0.4);
        }
      `}</style>
    </div>
  );
};

const FormBlock = ({ title, badge, children }) => (
  <div>
    <div className="flex items-center gap-3 mb-5">
      <h2 className="font-heading font-bold text-xl text-white">{title}</h2>
      {badge && (
        <span className="text-[10px] uppercase tracking-[0.22em] border border-[#D4A53A]/40 text-[#D4A53A] px-2 py-0.5">
          {badge}
        </span>
      )}
    </div>
    <div className="space-y-5">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{label}</div>
    {children}
  </label>
);

const Row = ({ k, v }) => (
  <div className="flex items-center justify-between text-white/80">
    <span>{k}</span>
    <span className="text-white">{v}</span>
  </div>
);

export default Checkout;
