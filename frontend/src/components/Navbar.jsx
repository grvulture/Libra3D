import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, Search } from "lucide-react";
import { BRAND } from "../data/products";
import { useCart } from "../context/CartContext";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/custom-orders", label: "Custom Orders" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalCount, setDrawerOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-navbar"
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-xl bg-[#0E5A5C]/85 border-b border-[#D4A53A]/20"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link
          to="/"
          data-testid="nav-logo-link"
          className="flex items-center gap-3 group"
        >
          <img
            src={BRAND.logoUrl}
            alt="LIBRA 3D Printing"
            className="h-12 w-12 object-cover border border-[#D4A53A]/30 group-hover:border-[#D4A53A] transition-colors"
          />
          <div className="hidden sm:block leading-none">
            <div className="font-heading font-black text-[#D4A53A] text-lg tracking-wider">
              LIBRA
            </div>
            <div className="text-[10px] uppercase tracking-[0.32em] text-white/70">
              3D Printing
            </div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-9">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.label.toLowerCase().replace(/\s/g, "-")}`}
              className={({ isActive }) =>
                `nav-link text-[12px] uppercase tracking-[0.22em] font-medium transition-colors ${
                  isActive
                    ? "text-[#D4A53A] active"
                    : "text-white/85 hover:text-[#D4A53A]"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            data-testid="nav-search-btn"
            onClick={() => navigate("/shop")}
            className="hidden md:flex h-10 w-10 items-center justify-center text-white/80 hover:text-[#D4A53A] transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <button
            data-testid="nav-cart-btn"
            onClick={() => setDrawerOpen(true)}
            className="relative h-10 w-10 flex items-center justify-center text-white hover:text-[#D4A53A] transition-colors"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {totalCount > 0 && (
              <span
                data-testid="nav-cart-badge"
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-[#D4A53A] text-[#0A2A2B] text-[10px] font-bold flex items-center justify-center"
              >
                {totalCount}
              </span>
            )}
          </button>

          <button
            data-testid="nav-mobile-toggle"
            onClick={() => setMobileOpen((s) => !s)}
            className="lg:hidden h-10 w-10 flex items-center justify-center text-white"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          data-testid="mobile-menu"
          className="lg:hidden border-t border-[#D4A53A]/20 bg-[#0A4143]"
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setMobileOpen(false)}
                data-testid={`mobile-nav-${l.label.toLowerCase().replace(/\s/g, "-")}`}
                className={({ isActive }) =>
                  `text-sm uppercase tracking-[0.22em] py-2 border-b border-[#D4A53A]/10 ${
                    isActive ? "text-[#D4A53A]" : "text-white/85"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
