import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, PRODUCTS } from "../data/products";

const Categories = () => {
  const countFor = (id) => PRODUCTS.filter((p) => p.category === id).length;

  return (
    <div data-testid="categories-page" className="text-white">
      <section className="border-b border-[#D4A53A]/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12">
          <div className="eyebrow mb-4">Explore the catalogue</div>
          <h1 className="font-heading font-black text-4xl lg:text-6xl">All Categories</h1>
          <p className="text-white/70 mt-3 max-w-2xl">
            Seven specialised collections — from sculptural decor to engineered replacement parts.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.id}`}
              data-testid={`category-card-${c.id}`}
              className={`group relative overflow-hidden border border-[#D4A53A]/15 hover:border-[#D4A53A]/60 transition-all duration-500 ${
                i === 0 ? "lg:col-span-2 lg:row-span-2 aspect-square lg:aspect-auto" : "aspect-[4/5]"
              }`}
            >
              <img
                src={c.image}
                alt={c.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A4143] via-[#0A4143]/55 to-transparent" />

              <div className="absolute top-4 right-4 h-10 w-10 border border-[#D4A53A]/40 group-hover:bg-[#D4A53A] flex items-center justify-center transition-colors">
                <ArrowUpRight size={16} className="text-[#D4A53A] group-hover:text-[#0A2A2B] transition-colors" />
              </div>

              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-[#D4A53A]">
                  <span>0{i + 1}</span>
                  <span className="h-px w-8 bg-[#D4A53A]/50" />
                  <span>{countFor(c.id)} products</span>
                </div>
                <div className="font-heading font-black text-white text-2xl lg:text-3xl mt-3">{c.name}</div>
                <p className="text-white/75 text-sm mt-2 max-w-md">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Categories;
