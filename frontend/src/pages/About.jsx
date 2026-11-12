import React from "react";
import { Link } from "react-router-dom";
import { Award, Factory, Recycle, Users } from "lucide-react";
import { BRAND } from "../data/products";
import { useLocale } from "../context/LocaleContext";

const About = () => {
  const { t } = useLocale();
  return (
    <div data-testid="about-page" className="text-white">
      <section className="relative overflow-hidden border-b border-[#D4A53A]/15">
        <img src={BRAND.headerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E5A5C]/70 via-[#0E5A5C]/90 to-[#0E5A5C]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20">
          <div className="eyebrow mb-4">{t("about.eyebrow")}</div>
          <h1 className="font-heading font-black text-4xl lg:text-7xl max-w-3xl leading-[1]">
            {t("about.heroLead")} <span className="text-[#D4A53A]">{t("about.heroAccent")}</span> {t("about.heroTail")}
          </h1>
          <p className="text-white/80 max-w-2xl mt-7 text-lg leading-relaxed">{t("about.intro")}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="eyebrow mb-3">{t("about.storyEyebrow")}</div>
          <h2 className="font-heading font-black text-3xl lg:text-5xl">{t("about.storyTitle")}</h2>
        </div>
        <div className="lg:col-span-7 space-y-5 text-white/80 leading-relaxed">
          <p>{t("about.story1")}</p>
          <p>{t("about.story2")}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Factory, k: "22+", t: t("about.stat1") },
            { icon: Award, k: "1k+", t: t("about.stat2") },
            { icon: Users, k: "8", t: t("about.stat3") },
            { icon: Recycle, k: "97%", t: t("about.stat4") },
          ].map((s) => (
            <div key={s.t} className="border border-[#D4A53A]/20 p-6 bg-[#0F5E60]">
              <s.icon size={20} className="text-[#D4A53A]" />
              <div className="font-heading font-black text-3xl lg:text-4xl text-white mt-4">{s.k}</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/65 mt-2">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 border-t border-[#D4A53A]/15 text-center">
        <h2 className="font-heading font-black text-3xl lg:text-5xl max-w-3xl mx-auto">{t("about.ctaTitle")}</h2>
        <p className="text-white/75 mt-4 max-w-xl mx-auto">{t("about.ctaBody")}</p>
        <div className="mt-9 flex flex-wrap gap-4 justify-center">
          <Link to="/contact" className="btn-gold">{t("about.getInTouch")}</Link>
          <Link to="/shop" className="btn-ghost-gold">{t("home.shopMarketplace")}</Link>
        </div>
      </section>
    </div>
  );
};

export default About;
