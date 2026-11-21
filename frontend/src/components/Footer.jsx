import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin, Smartphone, MessageCircle } from "lucide-react";
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
            {[Instagram, Facebook].map((Icon, i) => (
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
          </ul>
        </div>

        <div className="md:col-span-2">
          <div className="eyebrow mb-5">{t("footer.company")}</div>
          <ul className="space-y-3 text-sm text-white/80">
            <li><Link to="/about" className="hover:text-[#D4A53A]">{t("nav.about")}</Link></li>
            <li><Link to="/contact" className="hover:text-[#D4A53A]">{t("footer.contact")}</Link></li>
            <li className="space-y-1">
              <div className="text-white/90">{t("footer.headOffice")}:</div>
              <div className="text-white/70">{t("footer.headOfficeLocation")}</div>
            </li>
            <li className="space-y-1">
              <div className="text-white/90">{t("footer.branch")}:</div>
              <div className="text-white/70">{t("footer.branchLocation")}</div>
            </li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="eyebrow mb-5">{t("footer.contact")}</div>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-[#D4A53A] mt-0.5" />
              <span className="whitespace-pre-line">{t("footer.address")}</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-[#D4A53A]" />
              <a href="mailto:info@3dlibra.gr" className="hover:text-[#D4A53A]">info@3dlibra.gr</a>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={16} className="text-[#D4A53A]" />
              <a href="tel:+302286082441" className="hover:text-[#D4A53A]">+30 22860 82441</a>
            </li>
            <li className="flex items-center gap-3">
              <Smartphone size={16} className="text-[#D4A53A]" />
              <a href="tel:+306985868284" className="hover:text-[#D4A53A]">+30 69 8586 8284</a>
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle size={16} className="text-[#D4A53A]" aria-hidden="true" />
              <a
                href="viber://chat?number=%2B306985868284"
                className="hover:text-[#D4A53A]"
                aria-label={`${t("footer.viber")}: +30 69 8586 8284`}
              >
                {t("footer.viber")} · +30 69 8586 8284
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#D4A53A]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap items-center justify-center md:justify-between gap-x-6 gap-y-3 text-xs text-white/60">
          <div className="text-center md:text-left">{t("footer.rights")}</div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a
              href="https://www.axxis.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-grid grid-cols-[1fr_auto_1fr] items-center gap-x-2 hover:text-[#D4A53A]"
            >
              <span className="text-right">{t("footer.creditDevelopment")}  ⟐</span>
              <strong>AXXIS.dev</strong>
              <span className="text-left">⟐  {t("footer.creditHosting")}</span>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a href="#" className="hover:text-[#D4A53A]">{t("footer.privacy")}</a>
            <a href="#" className="hover:text-[#D4A53A]">{t("footer.terms")}</a>
            <a href="#" className="hover:text-[#D4A53A]">{t("footer.shippingLink")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
