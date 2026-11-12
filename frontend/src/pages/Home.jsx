import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Wand2, Star } from "lucide-react";
import { BRAND, CATEGORIES } from "../data/products";
import { useProducts } from "../hooks/useProducts";
import { ProductCard } from "../components/ProductCard";
import { useLocale } from "../context/LocaleContext";

const Home = () => {
  const { t, formatPrice } = useLocale();
  const { data: products, isLoading, isError, error, refetch } = useProducts();
  const featured = (products || []).filter((p) => p.bestSeller).slice(0, 4);
  const fresh = (products || []).filter((p) => p.new).slice(0, 3);

  return (
    <div data-testid="home-page" className="text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="relative">
          <img
            src={BRAND.headerUrl}
            alt="LIBRA 3D Printing"
            className="w-full h-[460px] sm:h-[520px] lg:h-[640px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0E5A5C]/95 via-[#0E5A5C]/55 to-transparent" />
          <div className="absolute inset-0 grain" />

          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 w-full">
              <div className="max-w-2xl">
                <div className="eyebrow mb-6 fade-up">{t("hero.eyebrow")}</div>
                <h1
                  data-testid="hero-headline"
                  className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl leading-[0.95] tracking-tight text-white fade-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  {t("hero.titleLine1")} <br />
                  <span className="text-[#D4A53A]">{t("hero.titleLine2a")}</span> {t("hero.titleLine2b")}
                </h1>
                <p
                  className="mt-6 text-base sm:text-lg text-white/85 max-w-xl leading-relaxed fade-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  {t("hero.subtitle")}
                </p>
                <div
                  className="mt-9 flex flex-wrap items-center gap-4 fade-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <Link to="/shop" className="btn-gold" data-testid="hero-shop-btn">
                    {t("hero.shopBtn")} <ArrowRight size={16} />
                  </Link>
                  <Link to="/custom-orders" className="btn-ghost-gold" data-testid="hero-custom-btn">
                    {t("hero.customBtn")}
                  </Link>
                </div>

                <div
                  className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.22em] text-white/70 fade-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  <span className="flex items-center gap-2">
                    <Star size={13} className="text-[#D4A53A] fill-[#D4A53A]" /> {t("hero.rating")}
                  </span>
                  <span>•</span>
                  <span>{t("hero.freeShipping", { amount: formatPrice(75, { fractionDigits: 0 }) })}</span>
                  <span>•</span>
                  <span>{t("hero.madeIn")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats marquee bar */}
        <div className="border-y border-[#D4A53A]/20 bg-[#0A4143]/80 backdrop-blur-md overflow-hidden">
          <div className="flex marquee-track whitespace-nowrap py-5 text-[#D4A53A]/90">
            {Array.from({ length: 2 }).map((_, k) => (
              <div key={k} className="flex items-center gap-12 px-6 text-sm uppercase tracking-[0.32em]">
                <span>Resin · PLA · PETG · ABS · TPU · Nylon</span>
                <span className="text-white/30">/</span>
                <span>Hand-finished</span>
                <span className="text-white/30">/</span>
                <span>Custom designs</span>
                <span className="text-white/30">/</span>
                <span>Shipped worldwide</span>
                <span className="text-white/30">/</span>
                <span>Small-batch craft</span>
                <span className="text-white/30">/</span>
                <span>Premium finishes</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES STRIP */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24" data-testid="home-categories">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div>
            <div className="eyebrow mb-3">{t("home.browseBy")}</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white">{t("home.categories")}</h2>
          </div>
          <Link to="/categories" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white transition-colors flex items-center gap-2">
            {t("common.viewAll")} <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {CATEGORIES.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.id}`}
              data-testid={`home-cat-${c.id}`}
              className="group relative aspect-[4/5] overflow-hidden border border-[#D4A53A]/15 hover:border-[#D4A53A]/60 transition-colors"
            >
              <img src={c.image} alt={t(`cat.${c.id}`)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A4143] via-[#0A4143]/40 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="text-[10px] uppercase tracking-[0.32em] text-[#D4A53A]">{t("home.categories")}</div>
                <div className="font-heading font-bold text-white text-xl mt-1">{t(`cat.${c.id}`)}</div>
              </div>
            </Link>
          ))}
          <Link
            to="/categories"
            className="hidden lg:flex relative aspect-[4/5] border border-[#D4A53A]/30 hover:border-[#D4A53A] bg-[#0F5E60] flex-col items-center justify-center p-6 text-center group transition-colors"
          >
            <div className="h-14 w-14 border border-[#D4A53A]/40 flex items-center justify-center group-hover:bg-[#D4A53A]/10">
              <ArrowRight size={20} className="text-[#D4A53A] group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-5 font-heading text-lg text-white">{t("categories.title")}</div>
          </Link>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16" data-testid="home-bestsellers">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div>
            <div className="eyebrow mb-3">{t("home.mostLoved")}</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white">{t("home.bestSellers")}</h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white flex items-center gap-2">
            {t("common.shopAll")} <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading && <div data-testid="products-loading" className="text-white/70">Loading products…</div>}
        {isError && (
          <div data-testid="products-error" className="text-white/70">
            Could not load products. {error?.message}
            <button onClick={() => refetch()} className="ml-3 text-[#D4A53A] underline">Retry</button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* SPLIT — CUSTOM PRINTS PROMO */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="eyebrow mb-4">{t("home.madeForYou")}</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white leading-tight">
              {t("home.customTitle1")} <br /> {t("home.customTitle2")}
            </h2>
            <p className="mt-6 text-white/75 leading-relaxed max-w-md">{t("home.customCopy")}</p>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { n: "01", t: t("home.step1") },
                { n: "02", t: t("home.step2") },
                { n: "03", t: t("home.step3") },
              ].map((s) => (
                <div key={s.n} className="border border-[#D4A53A]/20 p-4">
                  <div className="text-[#D4A53A] font-heading text-xl font-black">{s.n}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/80 mt-2">{s.t}</div>
                </div>
              ))}
            </div>
            <div className="mt-9">
              <Link to="/custom-orders" className="btn-gold" data-testid="home-custom-cta">
                {t("hero.customBtn")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 order-1 lg:order-2 relative">
            <div className="aspect-[4/3] overflow-hidden border border-[#D4A53A]/20 relative">
              <img
                src="https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=1200&q=70"
                alt="3D printing studio"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A4143]/80 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-4 lg:left-auto lg:-bottom-8 lg:-right-6 bg-[#D4A53A] text-[#0A2A2B] px-5 py-4 max-w-xs">
              <div className="text-[10px] uppercase tracking-[0.32em] font-bold">{t("home.studioNote")}</div>
              <div className="font-heading text-base font-bold mt-1 leading-snug">{t("home.studioCopy")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-[#D4A53A]/15">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Layers, t: t("home.vp1Title"), b: t("home.vp1Copy") },
            { icon: Sparkles, t: t("home.vp2Title"), b: t("home.vp2Copy") },
            { icon: Wand2, t: t("home.vp3Title"), b: t("home.vp3Copy") },
          ].map((v) => (
            <div key={v.t} className="bg-[#0F5E60] border border-[#D4A53A]/15 p-8">
              <div className="h-12 w-12 border border-[#D4A53A]/40 flex items-center justify-center text-[#D4A53A] mb-5">
                <v.icon size={20} />
              </div>
              <div className="font-heading font-bold text-white text-xl">{v.t}</div>
              <p className="text-white/70 mt-3 leading-relaxed">{v.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16" data-testid="home-new-arrivals">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div>
            <div className="eyebrow mb-3">{t("home.justLanded")}</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white">{t("home.newArrivals")}</h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white flex items-center gap-2">
            {t("common.viewAll")} <ArrowRight size={14} />
          </Link>
        </div>
        {isLoading && <div data-testid="products-loading" className="text-white/70">Loading products…</div>}
        {isError && (
          <div data-testid="products-error" className="text-white/70">
            Could not load products. {error?.message}
            <button onClick={() => refetch()} className="ml-3 text-[#D4A53A] underline">Retry</button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {fresh.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="bg-[#0F5E60] border border-[#D4A53A]/25 px-8 lg:px-14 py-12 lg:py-16 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 h-64 w-64 bg-[#D4A53A]/10 blur-3xl rounded-full" />
          <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <div className="eyebrow mb-3">{t("home.ctaEyebrow", { amount: formatPrice(75, { fractionDigits: 0 }) })}</div>
              <h3 className="font-heading font-black text-2xl lg:text-4xl text-white max-w-xl">
                {t("home.ctaTitle")}
              </h3>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="btn-gold">{t("home.shopMarketplace")}</Link>
              <Link to="/custom-orders" className="btn-ghost-gold">{t("home.startCustom")}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
