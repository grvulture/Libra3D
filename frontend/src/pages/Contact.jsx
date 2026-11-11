import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, MessageSquare, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "../context/LocaleContext";

const Contact = () => {
  const { t } = useLocale();
  const [form, setForm] = useState({ name: "", email: "", subject: "General", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error(t("contact.errorRequired"));
      return;
    }
    setSent(true);
    toast.success(t("contact.successToast"));
  };

  return (
    <div data-testid="contact-page" className="text-white">
      <section className="border-b border-[#D4A53A]/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">
          <div className="eyebrow mb-3">{t("contact.eyebrow")}</div>
          <h1 className="font-heading font-black text-4xl lg:text-6xl">{t("contact.title")}</h1>
          <p className="text-white/75 mt-4 max-w-2xl">{t("contact.subtitle")}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <aside className="lg:col-span-4 space-y-5">
          {[
            { icon: Mail, t: t("contact.emailLabel"), v: "hello@libra3d.gr" },
            { icon: Phone, t: t("contact.phoneLabel"), v: "+30 69 8586 8284" },
            { icon: MapPin, t: t("contact.studioLabel"), v: (<>Στασινοπουλου 18<br />Αγιος Δημητριος</>) },
            { icon: MessageSquare, t: t("contact.chatLabel"), v: t("contact.chatValue") },
          ].map((c) => (
            <div key={c.t} className="border border-[#D4A53A]/20 p-6 bg-[#0F5E60] flex gap-5">
              <div className="h-11 w-11 border border-[#D4A53A]/40 flex items-center justify-center text-[#D4A53A] flex-shrink-0">
                <c.icon size={18} />
              </div>
              <div>
                <div className="eyebrow mb-1">{c.t}</div>
                <div className="text-white whitespace-pre-line">{c.v}</div>
              </div>
            </div>
          ))}
        </aside>

        <div className="lg:col-span-8">
          {sent ? (
            <div className="border border-[#D4A53A]/30 bg-[#0F5E60] p-12 text-center" data-testid="contact-success">
              <div className="h-14 w-14 mx-auto border border-[#D4A53A] flex items-center justify-center mb-6">
                <CheckCircle2 size={22} className="text-[#D4A53A]" />
              </div>
              <h2 className="font-heading font-black text-3xl">{t("contact.successTitle")}</h2>
              <p className="text-white/75 mt-3">
                {t("contact.successBody", { name: form.name.split(" ")[0], email: form.email })}
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "General", message: "" }); }}
                className="btn-ghost-gold mt-8"
              >
                {t("contact.another")}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} data-testid="contact-form" className="border border-[#D4A53A]/20 bg-[#0F5E60] p-7 lg:p-10 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label={t("contact.name")}>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" className="brand-input" />
                </Field>
                <Field label={t("contact.email")}>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" className="brand-input" />
                </Field>
              </div>
              <Field label={t("contact.subject")}>
                <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} data-testid="contact-subject" className="brand-input">
                  {["General", "Custom order", "Wholesale", "Press", "Partnership"].map((s) => (
                    <option key={s} value={s} className="bg-[#0F5E60]">{s}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("contact.message")}>
                <textarea rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" className="brand-input resize-none" />
              </Field>
              <button type="submit" className="btn-gold" data-testid="contact-send">
                <Send size={14} /> {t("contact.send")}
              </button>
            </form>
          )}
        </div>
      </section>

      <style>{`
        .brand-input {
          width: 100%;
          background: #0A4143;
          border: 1px solid rgba(212,165,58,0.25);
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }
        .brand-input:focus {
          outline: none;
          border-color: #D4A53A;
          box-shadow: 0 0 0 1px rgba(212,165,58,0.4);
        }
      `}</style>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{label}</div>
    {children}
  </label>
);

export default Contact;
