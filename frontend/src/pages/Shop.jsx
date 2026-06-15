import React, { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronDown, Star } from "lucide-react";
import { PRODUCTS, CATEGORIES, MATERIALS, COLORS } from "../data/products";
import { ProductCard } from "../components/ProductCard";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "best", label: "Best Selling" },
  { id: "low", label: "Price: Low to High" },
  { id: "high", label: "Price: High to Low" },
];

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const initialCat = params.get("category") || "all";

  const [category, setCategory] = useState(initialCat);
  const [materials, setMaterials] = useState([]);
  const [colors, setColors] = useState([]);
  const [price, setPrice] = useState([0, 100]);
  const [availability, setAvailability] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setCategory(params.get("category") || "all");
  }, [params]);

  const toggle = (setter, arr, value) => {
    setter(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  };

  const filtered = useMemo(() => {
    let list = [...PRODUCTS];
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (materials.length) list = list.filter((p) => materials.includes(p.material));
    if (colors.length) list = list.filter((p) => p.colors.some((c) => colors.includes(c)));
    list = list.filter((p) => p.price >= price[0] && p.price <= price[1]);
    if (availability === "in") list = list.filter((p) => p.inStock);
    if (availability === "out") list = list.filter((p) => !p.inStock);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);

    if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    else if (sort === "best") list.sort((a, b) => b.reviews - a.reviews);
    else if (sort === "newest") list.sort((a, b) => Number(b.new) - Number(a.new));
    return list;
  }, [category, materials, colors, price, availability, minRating, sort]);

  const clearAll = () => {
    setCategory("all");
    setMaterials([]);
    setColors([]);
    setPrice([0, 100]);
    setAvailability("all");
    setMinRating(0);
    setParams({});
  };

  return (
    <div data-testid="shop-page" className="text-white">
      {/* Page header */}
      <section className="border-b border-[#D4A53A]/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
          <div className="eyebrow mb-4">Marketplace</div>
          <h1 className="font-heading font-black text-4xl lg:text-6xl">All Products</h1>
          <p className="text-white/70 mt-3 max-w-2xl">
            Browse {PRODUCTS.length} curated 3D-printed pieces across 7 categories — filter by material, color, price and more.
          </p>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-20 z-30 bg-[#0E5A5C]/95 backdrop-blur-md border-b border-[#D4A53A]/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <button
            data-testid="shop-filter-toggle"
            onClick={() => setFiltersOpen(true)}
            className="lg:hidden btn-ghost-gold !py-2 !px-4 !text-[11px]"
          >
            <SlidersHorizontal size={14} /> Filters
          </button>

          <div className="text-sm text-white/70">
            <span data-testid="shop-result-count" className="text-white font-semibold">{filtered.length}</span> products
          </div>

          <div className="relative">
            <label className="text-xs uppercase tracking-[0.22em] text-white/55 mr-3 hidden md:inline">Sort by</label>
            <div className="relative inline-block">
              <select
                data-testid="shop-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-[#0F5E60] border border-[#D4A53A]/30 text-white text-sm px-4 py-2 pr-9 focus:outline-none focus:border-[#D4A53A]"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#0F5E60]">{s.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#D4A53A] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="flex gap-10">
          {/* Sidebar */}
          <FilterSidebar
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            category={category}
            setCategory={(c) => {
              setCategory(c);
              if (c === "all") setParams({});
              else setParams({ category: c });
            }}
            materials={materials}
            toggleMaterial={(m) => toggle(setMaterials, materials, m)}
            colors={colors}
            toggleColor={(c) => toggle(setColors, colors, c)}
            price={price}
            setPrice={setPrice}
            availability={availability}
            setAvailability={setAvailability}
            minRating={minRating}
            setMinRating={setMinRating}
            clearAll={clearAll}
          />

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <div className="border border-[#D4A53A]/20 p-12 text-center">
                <p className="text-white/70">No products match your filters.</p>
                <button onClick={clearAll} className="btn-ghost-gold mt-6">Clear filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="shop-grid">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const FilterSidebar = ({
  open, onClose, category, setCategory, materials, toggleMaterial,
  colors, toggleColor, price, setPrice, availability, setAvailability,
  minRating, setMinRating, clearAll,
}) => {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <SidebarBody
          category={category} setCategory={setCategory}
          materials={materials} toggleMaterial={toggleMaterial}
          colors={colors} toggleColor={toggleColor}
          price={price} setPrice={setPrice}
          availability={availability} setAvailability={setAvailability}
          minRating={minRating} setMinRating={setMinRating}
          clearAll={clearAll}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-50 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-[#0A4143] z-50 transform transition-transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <div className="p-6 border-b border-[#D4A53A]/20 flex items-center justify-between">
          <h3 className="font-heading text-white font-bold">Filters</h3>
          <button onClick={onClose} className="text-white/70 hover:text-[#D4A53A]">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          <SidebarBody
            category={category} setCategory={setCategory}
            materials={materials} toggleMaterial={toggleMaterial}
            colors={colors} toggleColor={toggleColor}
            price={price} setPrice={setPrice}
            availability={availability} setAvailability={setAvailability}
            minRating={minRating} setMinRating={setMinRating}
            clearAll={clearAll}
          />
        </div>
      </aside>
    </>
  );
};

const FilterSection = ({ title, children }) => (
  <div className="pb-6 mb-6 border-b border-[#D4A53A]/15">
    <div className="text-[11px] uppercase tracking-[0.28em] text-[#D4A53A] mb-4">{title}</div>
    {children}
  </div>
);

const SidebarBody = ({
  category, setCategory, materials, toggleMaterial, colors, toggleColor,
  price, setPrice, availability, setAvailability, minRating, setMinRating, clearAll,
}) => {
  return (
    <div className="space-y-2">
      <FilterSection title="Category">
        <div className="space-y-2.5">
          <button
            onClick={() => setCategory("all")}
            data-testid="filter-cat-all"
            className={`block w-full text-left text-sm transition-colors ${
              category === "all" ? "text-[#D4A53A]" : "text-white/80 hover:text-white"
            }`}
          >
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              data-testid={`filter-cat-${c.id}`}
              className={`block w-full text-left text-sm transition-colors ${
                category === c.id ? "text-[#D4A53A]" : "text-white/80 hover:text-white"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Material">
        <div className="space-y-3">
          {MATERIALS.map((m) => (
            <label key={m} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={materials.includes(m)}
                onChange={() => toggleMaterial(m)}
                data-testid={`filter-material-${m}`}
                className="h-4 w-4 accent-[#D4A53A] bg-transparent border border-[#D4A53A]/40"
              />
              <span className="text-sm text-white/80 group-hover:text-white">{m}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        <div className="flex items-center gap-3 mb-3 text-sm">
          <input
            type="number"
            value={price[0]}
            onChange={(e) => setPrice([+e.target.value, price[1]])}
            data-testid="filter-price-min"
            className="w-20 bg-[#0F5E60] border border-[#D4A53A]/30 px-2 py-1 text-white input-gold"
          />
          <span className="text-white/50">—</span>
          <input
            type="number"
            value={price[1]}
            onChange={(e) => setPrice([price[0], +e.target.value])}
            data-testid="filter-price-max"
            className="w-20 bg-[#0F5E60] border border-[#D4A53A]/30 px-2 py-1 text-white input-gold"
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={price[1]}
          onChange={(e) => setPrice([price[0], +e.target.value])}
          className="w-full accent-[#D4A53A]"
        />
      </FilterSection>

      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => toggleColor(c.name)}
              data-testid={`filter-color-${c.name}`}
              title={c.name}
              className={`h-7 w-7 rounded-full border-2 transition ${
                colors.includes(c.name) ? "border-[#D4A53A] ring-2 ring-[#D4A53A]/50" : "border-white/30"
              }`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Availability">
        {[
          { id: "all", label: "All" },
          { id: "in", label: "In stock" },
          { id: "out", label: "Sold out" },
        ].map((opt) => (
          <label key={opt.id} className="flex items-center gap-3 mb-2.5 cursor-pointer">
            <input
              type="radio"
              checked={availability === opt.id}
              onChange={() => setAvailability(opt.id)}
              data-testid={`filter-avail-${opt.id}`}
              className="h-4 w-4 accent-[#D4A53A]"
            />
            <span className="text-sm text-white/80">{opt.label}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Minimum Rating">
        <div className="flex gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              data-testid={`filter-rating-${r}`}
              className={`flex-1 border px-2 py-1.5 text-xs flex items-center justify-center gap-1 ${
                minRating === r
                  ? "border-[#D4A53A] bg-[#D4A53A]/10 text-white"
                  : "border-[#D4A53A]/25 text-white/70 hover:border-[#D4A53A]/60"
              }`}
            >
              {r === 0 ? "Any" : <>{r}+ <Star size={10} className="fill-[#D4A53A] text-[#D4A53A]" /></>}
            </button>
          ))}
        </div>
      </FilterSection>

      <button onClick={clearAll} data-testid="filter-clear-all" className="text-xs uppercase tracking-[0.22em] text-[#D4A53A] hover:text-white">
        Clear all filters
      </button>
    </div>
  );
};

export default Shop;
