import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Star, Minus, Plus, ShoppingBag, ShieldCheck, Truck, Repeat, ChevronRight } from "lucide-react";
import { PRODUCTS, COLORS, REVIEWS, CATEGORIES } from "../data/products";
import { useCart } from "../context/CartContext";
import { useLocale } from "../context/LocaleContext";
import { ProductCard } from "../components/ProductCard";

const hexFor = (name) => COLORS.find((c) => c.name === name)?.hex || "#D4A53A";

const ProductDetail = () => {
  const { id } = useParams();
  const product = PRODUCTS.find((p) => p.id === id);
  const navigate = useNavigate();
  const { addItem, setDrawerOpen } = useCart();
  const { t, formatPrice } = useLocale();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [color, setColor] = useState(product?.colors[0]);
  const [tab, setTab] = useState("description");

  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === product?.category),
    [product]
  );
  const related = useMemo(
    () => PRODUCTS.filter((p) => p.category === product?.category && p.id !== product?.id).slice(0, 4),
    [product]
  );

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-white">
        <h2 className="font-heading text-3xl">Product not found</h2>
        <Link to="/shop" className="btn-ghost-gold mt-6 inline-flex">{t("common.browseShop")}</Link>
      </div>
    );
  }

  const handleAdd = () => addItem(product, qty, color);
  const handleBuyNow = () => {
    addItem(product, qty, color);
    setTimeout(() => { setDrawerOpen(false); navigate("/checkout"); }, 100);
  };

  return (
    <div data-testid="product-detail-page" className="text-white">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8 text-[11px] uppercase tracking-[0.22em] text-white/55 flex items-center gap-2">
        <Link to="/" className="hover:text-[#D4A53A]">{t("nav.home")}</Link>
        <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-[#D4A53A]">{t("nav.shop")}</Link>
        <ChevronRight size={12} />
        {category && (
          <>
            <Link to={`/shop?category=${category.id}`} className="hover:text-[#D4A53A]">{t(`cat.${category.id}`)}</Link>
            <ChevronRight size={12} />
          </>
        )}
        <span className="text-white/80">{product.name}</span>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-[#0A4143] border border-[#D4A53A]/15 overflow-hidden">
            <img
              src={product.images[activeImg]}
              alt={product.name}
              className="w-full h-full object-cover"
              data-testid="product-main-image"
            />
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImg(idx)}
                data-testid={`product-thumb-${idx}`}
                className={`aspect-square overflow-hidden border-2 transition ${
                  activeImg === idx ? "border-[#D4A53A]" : "border-[#D4A53A]/15 hover:border-[#D4A53A]/45"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="eyebrow mb-3">{category && t(`cat.${category.id}`)}</div>
          <h1 data-testid="product-title" className="font-heading font-black text-3xl lg:text-5xl leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={i < Math.round(product.rating) ? "fill-[#D4A53A] text-[#D4A53A]" : "text-white/30"}
                />
              ))}
            </div>
            <span className="text-sm text-white/65">{product.rating} · {product.reviews} {t("common.reviews")}</span>
            <span className="text-white/20">|</span>
            <span className="text-xs uppercase tracking-[0.22em] text-[#D4A53A]">
              {product.inStock ? t("common.inStock") : t("common.soldOut")}
            </span>
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span data-testid="product-price" className="font-heading font-black text-4xl text-[#D4A53A]">
              {formatPrice(product.price)}
            </span>
            <span className="text-white/40 text-sm line-through mb-1.5">{formatPrice(product.price * 1.2)}</span>
          </div>

          <p className="text-white/75 leading-relaxed mt-5 max-w-lg">{product.description}</p>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-4 mt-7">
            <div className="border border-[#D4A53A]/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#D4A53A] mb-1">{t("common.material")}</div>
              <div className="text-white text-sm">{product.material}</div>
            </div>
            <div className="border border-[#D4A53A]/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#D4A53A] mb-1">{t("common.dimensions")}</div>
              <div className="text-white text-sm">{product.dimensions}</div>
            </div>
          </div>

          {/* Color */}
          <div className="mt-7">
            <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4A53A] mb-3">
              {t("common.color")} · <span className="text-white/70">{color}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  data-testid={`product-color-${c}`}
                  title={c}
                  className={`h-9 w-9 rounded-full border-2 transition ${
                    color === c ? "border-[#D4A53A] ring-2 ring-[#D4A53A]/50" : "border-white/30"
                  }`}
                  style={{ background: hexFor(c) }}
                />
              ))}
            </div>
          </div>

          {/* Quantity + buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center border border-[#D4A53A]/40">
              <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="product-qty-dec" className="h-12 w-12 flex items-center justify-center text-white hover:text-[#D4A53A]">
                <Minus size={14} />
              </button>
              <div className="w-12 text-center text-white" data-testid="product-qty">{qty}</div>
              <button onClick={() => setQty(qty + 1)} data-testid="product-qty-inc" className="h-12 w-12 flex items-center justify-center text-white hover:text-[#D4A53A]">
                <Plus size={14} />
              </button>
            </div>
            <button onClick={handleAdd} disabled={!product.inStock} data-testid="product-add-to-cart" className="btn-gold flex-1 min-w-[180px] justify-center disabled:opacity-40">
              <ShoppingBag size={16} /> {t("common.addToCart")}
            </button>
            <button onClick={handleBuyNow} disabled={!product.inStock} data-testid="product-buy-now" className="btn-ghost-gold flex-1 min-w-[140px] justify-center disabled:opacity-40">
              {t("common.buyNow")}
            </button>
          </div>

          {/* Perks */}
          <div className="grid grid-cols-3 gap-3 mt-8 border-t border-[#D4A53A]/15 pt-7">
            {[
              { icon: Truck, t: t("pd.freeShip") },
              { icon: ShieldCheck, t: t("pd.warranty") },
              { icon: Repeat, t: t("pd.returns") },
            ].map((p) => (
              <div key={p.t} className="flex items-center gap-2">
                <p.icon size={16} className="text-[#D4A53A]" />
                <div className="text-xs text-white/70">{p.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12 border-t border-[#D4A53A]/15">
        <div className="flex flex-wrap gap-8 border-b border-[#D4A53A]/15 mb-8">
          {[
            { id: "description", l: t("pd.description") },
            { id: "specs", l: t("pd.specs") },
            { id: "reviews", l: `${t("pd.reviews")} (${REVIEWS.length})` },
          ].map((tab2) => (
            <button
              key={tab2.id}
              onClick={() => setTab(tab2.id)}
              data-testid={`product-tab-${tab2.id}`}
              className={`pb-4 text-xs uppercase tracking-[0.22em] border-b-2 -mb-px transition ${
                tab === tab2.id ? "border-[#D4A53A] text-[#D4A53A]" : "border-transparent text-white/65 hover:text-white"
              }`}
            >
              {tab2.l}
            </button>
          ))}
        </div>

        {tab === "description" && (
          <div className="max-w-3xl text-white/80 leading-relaxed space-y-4">
            <p>{product.description}</p>
          </div>
        )}

        {tab === "specs" && (
          <div className="max-w-3xl">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Material options", product.materials.join(", ")],
                  ["Available colors", product.colors.join(", ")],
                  [t("common.dimensions"), product.dimensions],
                  ["Print technology", product.material === "Resin" ? "MSLA Resin" : "FDM"],
                  ["Layer height", product.material === "Resin" ? "25–50 µ" : "100–200 µ"],
                  ["Finish", "Sanded · UV satin coat"],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-[#D4A53A]/10">
                    <td className="py-3 text-[#D4A53A] uppercase tracking-[0.18em] text-xs w-1/3">{k}</td>
                    <td className="py-3 text-white/85">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "reviews" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border border-[#D4A53A]/20 p-7">
              <div className="font-heading text-6xl font-black text-[#D4A53A]">{product.rating}</div>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className="fill-[#D4A53A] text-[#D4A53A]" />
                ))}
              </div>
              <p className="text-white/65 text-sm mt-2">{product.reviews} {t("common.reviews")}.</p>
            </div>
            <div className="lg:col-span-2 space-y-5">
              {REVIEWS.map((r) => (
                <div key={r.id} className="border border-[#D4A53A]/15 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-heading font-bold text-white">{r.name}</div>
                      <div className="text-xs text-white/55 mt-0.5">{r.date}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? "fill-[#D4A53A] text-[#D4A53A]" : "text-white/25"} />
                      ))}
                    </div>
                  </div>
                  <div className="font-heading text-white mt-3">{r.title}</div>
                  <p className="text-white/75 text-sm leading-relaxed mt-1.5">{r.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
          <div className="flex items-end justify-between mb-10">
            <h2 className="font-heading font-black text-2xl lg:text-4xl text-white">{t("pd.youMayLike")}</h2>
            <Link to="/shop" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white">
              {t("common.shopAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
