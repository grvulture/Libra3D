import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { BRAND } from "../data/products";
import { useLocale } from "../context/LocaleContext";

export const Footer = () => {
  const { t } = useLocale();
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
            {t("footer.tagline")}
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
          <div className="eyebrow mb-5">{t("footer.shop")}</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link data-testid="footer-link-shop" to="/shop" className="hover:text-[#D4A53A]">{t("footer.allProducts")}</Link></li>
            <li><Link to="/categories" className="hover:text-[#D4A53A]">{t("nav.categories")}</Link></li>
            <li><Link to="/custom-orders" className="hover:text-[#D4A53A]">{t("nav.customOrders")}</Link></li>
            <li><Link to="/admin" className="hover:text-[#D4A53A]">{t("footer.dashboard")}</Link></li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="eyebrow mb-5">{t("footer.company")}</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link to="/about" className="hover:text-[#D4A53A]">{t("nav.about")}</Link></li>
            <li><Link to="/contact" className="hover:text-[#D4A53A]">{t("footer.contact")}</Link></li>
            <li><a href="#" className="hover:text-[#D4A53A]">{t("footer.careers")}</a></li>
            <li><a href="#" className="hover:text-[#D4A53A]">{t("footer.press")}</a></li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="eyebrow mb-5">{t("footer.contact")}</div>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-[#D4A53A] mt-0.5" />
              <span>Στασινοπουλου 18<br />Αγιος Δημητριος</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-[#D4A53A]" />
              <a href="mailto:hello@libra3d.gr" className="hover:text-[#D4A53A]">hello@libra3d.gr</a>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-[#D4A53A]" />
              <span>+30 69 8586 8284</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#D4A53A]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
          <div>{t("footer.rights")}</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[#D4A53A]">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-[#D4A53A]">{t("footer.terms")}</a>
            <a href="#" className="hover:text-[#D4A53A]">{t("footer.shippingLink")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
