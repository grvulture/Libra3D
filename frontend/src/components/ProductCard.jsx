import React from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";
import { COLORS } from "../data/products";

const hexFor = (name) => COLORS.find((c) => c.name === name)?.hex || "#D4A53A";

export const ProductCard = ({ product }) => {
  const { addItem } = useCart();

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group relative bg-[#0F5E60] border border-[#D4A53A]/10 hover:border-[#D4A53A]/55 transition-all duration-500 flex flex-col"
    >
      <Link to={`/product/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-[#0A4143]">
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.new && (
            <span className="bg-[#D4A53A] text-[#0A2A2B] text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1">
              New
            </span>
          )}
          {product.bestSeller && (
            <span className="bg-black/60 backdrop-blur-md border border-[#D4A53A]/30 text-white text-[10px] uppercase tracking-[0.2em] px-2.5 py-1">
              Bestseller
            </span>
          )}
          {!product.inStock && (
            <span className="bg-black/70 text-white/80 text-[10px] uppercase tracking-[0.2em] px-2.5 py-1">
              Sold out
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/55 backdrop-blur-md text-white text-[11px] px-2 py-1">
          <Star size={11} className="fill-[#D4A53A] text-[#D4A53A]" />
          {product.rating}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4A53A]/90 mb-2">
          {product.category.replace(/-/g, " ")}
        </div>
        <Link
          to={`/product/${product.id}`}
          data-testid={`product-name-${product.id}`}
          className="font-heading font-bold text-white text-lg leading-tight hover:text-[#D4A53A] transition-colors"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-3 mt-3 text-xs text-white/60">
          <span className="border border-[#D4A53A]/30 px-2 py-0.5">{product.material}</span>
          <span>{product.reviews} reviews</span>
        </div>

        <div className="flex items-center gap-1.5 mt-4">
          {product.colors.slice(0, 5).map((c) => (
            <span
              key={c}
              title={c}
              className="h-3.5 w-3.5 rounded-full border border-white/30"
              style={{ background: hexFor(c) }}
            />
          ))}
          {product.colors.length > 5 && (
            <span className="text-[10px] text-white/50 ml-1">+{product.colors.length - 5}</span>
          )}
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="text-[#D4A53A] font-heading font-bold text-xl">
            ${product.price.toFixed(2)}
          </div>
          <button
            data-testid={`add-to-cart-${product.id}`}
            onClick={() => addItem(product, 1)}
            disabled={!product.inStock}
            className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-bold text-[#0A2A2B] bg-[#D4A53A] hover:bg-[#C9A249] px-4 py-2.5 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag size={13} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
