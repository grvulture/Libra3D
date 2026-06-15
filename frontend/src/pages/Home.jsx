import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Wand2, Truck, Star } from "lucide-react";
import { BRAND, PRODUCTS, CATEGORIES } from "../data/products";
import { ProductCard } from "../components/ProductCard";

const Home = () => {
  const featured = PRODUCTS.filter((p) => p.bestSeller).slice(0, 4);
  const fresh = PRODUCTS.filter((p) => p.new).slice(0, 3);

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
                <div className="eyebrow mb-6 fade-up">A 3D-Printed Marketplace · Est. 2026</div>
                <h1
                  data-testid="hero-headline"
                  className="font-heading font-black text-4xl sm:text-5xl lg:text-7xl leading-[0.95] tracking-tight text-white fade-up"
                  style={{ animationDelay: "0.1s" }}
                >
                  Shop Unique <br />
                  <span className="text-[#D4A53A]">3D Printed</span> Products
                </h1>
                <p
                  className="mt-6 text-base sm:text-lg text-white/85 max-w-xl leading-relaxed fade-up"
                  style={{ animationDelay: "0.2s" }}
                >
                  Functional, decorative, and custom 3D printed items
                  crafted with precision — small batches, hand-finished, shipped worldwide.
                </p>
                <div
                  className="mt-9 flex flex-wrap items-center gap-4 fade-up"
                  style={{ animationDelay: "0.3s" }}
                >
                  <Link to="/shop" className="btn-gold" data-testid="hero-shop-btn">
                    Shop Products <ArrowRight size={16} />
                  </Link>
                  <Link to="/custom-orders" className="btn-ghost-gold" data-testid="hero-custom-btn">
                    Request Custom Print
                  </Link>
                </div>

                <div
                  className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.22em] text-white/70 fade-up"
                  style={{ animationDelay: "0.4s" }}
                >
                  <span className="flex items-center gap-2">
                    <Star size={13} className="text-[#D4A53A] fill-[#D4A53A]" /> 4.9 · 1.4k reviews
                  </span>
                  <span>•</span>
                  <span>Free ship over $75</span>
                  <span>•</span>
                  <span>Made in Berlin</span>
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
            <div className="eyebrow mb-3">Browse by</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white">Categories</h2>
          </div>
          <Link to="/categories" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white transition-colors flex items-center gap-2">
            View all <ArrowRight size={14} />
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
              <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A4143] via-[#0A4143]/40 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="text-[10px] uppercase tracking-[0.32em] text-[#D4A53A]">Category</div>
                <div className="font-heading font-bold text-white text-xl mt-1">{c.name}</div>
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
            <div className="mt-5 font-heading text-lg text-white">All 7 categories</div>
            <div className="text-xs text-white/60 mt-2 uppercase tracking-[0.22em]">Explore the catalogue</div>
          </Link>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16" data-testid="home-bestsellers">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div>
            <div className="eyebrow mb-3">Most loved</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white">Best Sellers</h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white flex items-center gap-2">
            Shop all <ArrowRight size={14} />
          </Link>
        </div>

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
            <div className="eyebrow mb-4">Made for you</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white leading-tight">
              Your idea, <br /> printed to perfection.
            </h2>
            <p className="mt-6 text-white/75 leading-relaxed max-w-md">
              Send us a sketch, a CAD file, or just a description. Our studio
              prototypes, prints and finishes every commission in-house — from a
              single replacement knob to a hundred-piece run.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
              {[
                { n: "01", t: "Submit brief" },
                { n: "02", t: "Approve quote" },
                { n: "03", t: "We print + ship" },
              ].map((s) => (
                <div key={s.n} className="border border-[#D4A53A]/20 p-4">
                  <div className="text-[#D4A53A] font-heading text-xl font-black">{s.n}</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-white/80 mt-2">{s.t}</div>
                </div>
              ))}
            </div>
            <div className="mt-9">
              <Link to="/custom-orders" className="btn-gold" data-testid="home-custom-cta">
                Request Custom Print <ArrowRight size={16} />
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
              <div className="text-[10px] uppercase tracking-[0.32em] font-bold">Studio Note</div>
              <div className="font-heading text-base font-bold mt-1 leading-snug">
                Avg lead time: 4–7 days · 25µ resin available on request.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 border-t border-[#D4A53A]/15">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Layers, t: "Precision Engineered", b: "Down to 25 microns of layer detail across resin and FDM platforms." },
            { icon: Sparkles, t: "Hand-Finished", b: "Every product is sanded, sealed and inspected in our Berlin studio." },
            { icon: Wand2, t: "Made to Order", b: "Stock products plus made-to-order pieces in your size, color and material." },
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
            <div className="eyebrow mb-3">Just landed</div>
            <h2 className="font-heading font-black text-3xl lg:text-5xl text-white">New Arrivals</h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white flex items-center gap-2">
            Browse new <ArrowRight size={14} />
          </Link>
        </div>
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
              <div className="eyebrow mb-3">Free worldwide shipping over $75</div>
              <h3 className="font-heading font-black text-2xl lg:text-4xl text-white max-w-xl">
                Ready to print something extraordinary?
              </h3>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/shop" className="btn-gold">Shop the marketplace</Link>
              <Link to="/custom-orders" className="btn-ghost-gold">Start a custom order</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
