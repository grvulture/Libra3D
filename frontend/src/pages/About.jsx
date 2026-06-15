import React from "react";
import { Link } from "react-router-dom";
import { Award, Factory, Recycle, Users } from "lucide-react";
import { BRAND } from "../data/products";

const About = () => {
  return (
    <div data-testid="about-page" className="text-white">
      <section className="relative overflow-hidden border-b border-[#D4A53A]/15">
        <img
          src={BRAND.headerUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0E5A5C]/70 via-[#0E5A5C]/90 to-[#0E5A5C]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-20">
          <div className="eyebrow mb-4">About the studio</div>
          <h1 className="font-heading font-black text-4xl lg:text-7xl max-w-3xl leading-[1]">
            We print the in-between of <span className="text-[#D4A53A]">imagination</span> and reality.
          </h1>
          <p className="text-white/80 max-w-2xl mt-7 text-lg leading-relaxed">
            LIBRA is a small studio of designers, engineers and finishers based in
            Berlin. We ship our own marketplace of curated 3D-printed pieces, and
            we print one-off commissions for clients all over the world.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <div className="eyebrow mb-3">Our story</div>
          <h2 className="font-heading font-black text-3xl lg:text-5xl">
            Crafted in small batches, since 2019.
          </h2>
        </div>
        <div className="lg:col-span-7 space-y-5 text-white/80 leading-relaxed">
          <p>
            What started as a basement workshop with a single FDM printer has grown into a
            studio of eight people running 22 industrial machines around the clock. We still
            sand, finish and pack every product by hand.
          </p>
          <p>
            Our marketplace exists to bring small-batch, design-led 3D-printed goods to
            customers who care about provenance and craft. Every product on this site was
            modeled, printed and shipped from our workshop.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Factory, k: "22", t: "Machines in studio" },
            { icon: Award, k: "14.2k", t: "Pieces shipped" },
            { icon: Users, k: "8", t: "Studio members" },
            { icon: Recycle, k: "97%", t: "Recyclable materials" },
          ].map((s) => (
            <div key={s.t} className="border border-[#D4A53A]/20 p-6 bg-[#0F5E60]">
              <s.icon size={20} className="text-[#D4A53A]" />
              <div className="font-heading font-black text-3xl lg:text-4xl text-white mt-4">{s.k}</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/65 mt-2">{s.t}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 border-t border-[#D4A53A]/15">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { t: "Materials", b: "PLA · PETG · ABS · TPU · Nylon · Resin. Industrial-grade, certified, traceable." },
            { t: "Process", b: "Design ➝ slice ➝ print ➝ wash & cure ➝ sand ➝ seal ➝ inspect ➝ pack." },
            { t: "Sustainability", b: "We recycle 97% of failed prints, run on green energy and use compostable packaging." },
          ].map((c) => (
            <div key={c.t}>
              <div className="eyebrow mb-3">{c.t}</div>
              <p className="text-white/80 leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-20 border-t border-[#D4A53A]/15 text-center">
        <h2 className="font-heading font-black text-3xl lg:text-5xl max-w-3xl mx-auto">
          Want to see the studio?
        </h2>
        <p className="text-white/75 mt-4 max-w-xl mx-auto">
          We host open-studio days every last Friday of the month. RSVP via our contact page.
        </p>
        <div className="mt-9 flex flex-wrap gap-4 justify-center">
          <Link to="/contact" className="btn-gold">Get in touch</Link>
          <Link to="/shop" className="btn-ghost-gold">Shop the marketplace</Link>
        </div>
      </section>
    </div>
  );
};

export default About;
