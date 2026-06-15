import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useLocale } from "../context/LocaleContext";

const SHIPPING_THRESHOLD = 75; // EUR
const SHIPPING_FEE = 8.5; // EUR

export const CartDrawer = () => {
  const { drawerOpen, setDrawerOpen, items, updateQty, removeItem, subtotal } = useCart();
  const { t, formatPrice } = useLocale();
  const navigate = useNavigate();

  const shipping = subtotal === 0 ? 0 : subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  const goCheckout = () => {
    setDrawerOpen(false);
    navigate("/checkout");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="cart-backdrop"
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-50 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Drawer */}
      <aside
        data-testid="cart-drawer"
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0A4143] border-l border-[#D4A53A]/20 shadow-2xl flex flex-col transform transition-transform duration-400 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-[#D4A53A]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-[#D4A53A]" />
            <h3 className="font-heading font-bold text-white text-lg tracking-wide">{t("cart.title")}</h3>
            <span className="text-white/60 text-sm">({items.length})</span>
          </div>
          <button
            data-testid="cart-close-btn"
            onClick={() => setDrawerOpen(false)}
            className="h-9 w-9 flex items-center justify-center text-white/70 hover:text-[#D4A53A]"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5" data-testid="cart-items">
          {items.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto h-16 w-16 border border-[#D4A53A]/30 flex items-center justify-center mb-5">
                <ShoppingBag size={22} className="text-[#D4A53A]" />
              </div>
              <p className="text-white/70 mb-6">{t("cart.empty")}</p>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  navigate("/shop");
                }}
                data-testid="cart-empty-shop-btn"
                className="btn-ghost-gold"
              >
                {t("common.browseShop")}
              </button>
            </div>
          )}

          {items.map((item) => (
            <div
              key={item.key}
              data-testid={`cart-item-${item.id}`}
              className="flex gap-4 border border-[#D4A53A]/10 p-3 bg-[#0F5E60]"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-24 object-cover border border-[#D4A53A]/15"
              />
              <div className="flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-heading font-bold text-white text-sm leading-tight">{item.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/55 mt-1">
                      {item.material} · {item.color}
                    </div>
                  </div>
                  <button
                    data-testid={`cart-remove-${item.id}`}
                    onClick={() => removeItem(item.key)}
                    className="text-white/50 hover:text-[#D4A53A]"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center border border-[#D4A53A]/30">
                    <button
                      data-testid={`cart-qty-dec-${item.id}`}
                      onClick={() => updateQty(item.key, item.qty - 1)}
                      className="h-7 w-7 flex items-center justify-center text-white/80 hover:text-[#D4A53A]"
                    >
                      <Minus size={12} />
                    </button>
                    <div className="w-8 text-center text-white text-sm">{item.qty}</div>
                    <button
                      data-testid={`cart-qty-inc-${item.id}`}
                      onClick={() => updateQty(item.key, item.qty + 1)}
                      className="h-7 w-7 flex items-center justify-center text-white/80 hover:text-[#D4A53A]"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="text-[#D4A53A] font-bold">
                    {formatPrice(item.price * item.qty)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[#D4A53A]/20 bg-[#0E5A5C] p-6 space-y-4">
            <div className="flex items-center justify-between text-sm text-white/75">
              <span>{t("common.subtotal")}</span>
              <span data-testid="cart-subtotal" className="text-white">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/75">
              <span>{t("common.shippingEst")}</span>
              <span className="text-white">
                {shipping === 0 ? t("common.free") : formatPrice(shipping)}
              </span>
            </div>
            <div className="text-[11px] text-white/55">
              {subtotal < SHIPPING_THRESHOLD
                ? t("cart.unlockFreeShipping", { amount: formatPrice(SHIPPING_THRESHOLD - subtotal) })
                : t("cart.freeShippingUnlocked")}
            </div>
            <div className="border-t border-[#D4A53A]/15 pt-4 flex items-center justify-between">
              <span className="font-heading text-white text-base">{t("common.total")}</span>
              <span data-testid="cart-total" className="font-heading font-bold text-[#D4A53A] text-xl">
                {formatPrice(total)}
              </span>
            </div>
            <button
              data-testid="cart-checkout-btn"
              onClick={goCheckout}
              className="btn-gold w-full justify-center"
            >
              {t("common.checkout")}
            </button>
            <Link
              to="/shop"
              onClick={() => setDrawerOpen(false)}
              className="block text-center text-[11px] uppercase tracking-[0.22em] text-white/65 hover:text-[#D4A53A]"
            >
              {t("common.continueShopping")}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
};
