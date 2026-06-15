import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { BRAND } from "../data/products";

export const Footer = () => {
  return (
    <footer data-testid="site-footer" className="bg-[#0A4143] border-t border-[#D4A53A]/15 mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3">
            <img
              src={BRAND.logoUrl}
              alt="LIBRA"
              className="h-12 w-12 object-cover border border-[#D4A53A]/40"
            />
            <div>
              <div className="font-heading font-black text-[#D4A53A] text-xl tracking-wider">LIBRA</div>
              <div className="text-[10px] uppercase tracking-[0.32em] text-white/60">3D Printing</div>
            </div>
          </div>
          <p className="text-white/70 text-sm leading-relaxed mt-6 max-w-sm">
            A premium marketplace for functional, decorative & custom 3D-printed goods.
            Crafted in small batches, finished by hand, shipped worldwide.
          </p>
          <div className="flex items-center gap-3 mt-7">
            {[Instagram, Twitter, Facebook, Linkedin].map((Icon, i) => (
              <a
                key={i}
                href="#"
                data-testid={`footer-social-${i}`}
                className="h-10 w-10 flex items-center justify-center border border-[#D4A53A]/30 hover:border-[#D4A53A] hover:text-[#D4A53A] text-white/80 transition-colors"
                aria-label="Social link"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="eyebrow mb-5">Shop</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link data-testid="footer-link-shop" to="/shop" className="hover:text-[#D4A53A]">All Products</Link></li>
            <li><Link to="/categories" className="hover:text-[#D4A53A]">Categories</Link></li>
            <li><Link to="/custom-orders" className="hover:text-[#D4A53A]">Custom Orders</Link></li>
            <li><Link to="/admin" className="hover:text-[#D4A53A]">Seller Dashboard</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="eyebrow mb-5">Company</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link to="/about" className="hover:text-[#D4A53A]">About</Link></li>
            <li><Link to="/contact" className="hover:text-[#D4A53A]">Contact</Link></li>
            <li><a href="#" className="hover:text-[#D4A53A]">Careers</a></li>
            <li><a href="#" className="hover:text-[#D4A53A]">Press</a></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="eyebrow mb-5">Contact</div>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-[#D4A53A] mt-0.5" />
              <span>Workshop 14 · Unit B · Atelier District<br/>Berlin · Germany</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-[#D4A53A]" />
              <a href="mailto:hello@libra3d.studio" className="hover:text-[#D4A53A]">hello@libra3d.studio</a>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-[#D4A53A]" />
              <span>+49 30 1234 5678</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#D4A53A]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div>© 2026 LIBRA 3D Printing. All printed in-house.</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#D4A53A]">Privacy</a>
            <a href="#" className="hover:text-[#D4A53A]">Terms</a>
            <a href="#" className="hover:text-[#D4A53A]">Shipping</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
