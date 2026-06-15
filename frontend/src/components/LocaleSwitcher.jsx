import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLocale } from "../context/LocaleContext";

const LANG_LABELS = {
  en: { code: "EN", name: "English" },
  el: { code: "ΕΛ", name: "Ελληνικά" },
};

const CURRENCY_LABELS = {
  EUR: { sym: "€", name: "Euro" },
  USD: { sym: "$", name: "US Dollar" },
};

export const LocaleSwitcher = ({ compact = false }) => {
  const { lang, setLang, currency, setCurrency, languages, currencies } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        data-testid="locale-switcher-btn"
        aria-label="Change language and currency"
        className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border border-[#D4A53A]/30 hover:border-[#D4A53A] text-white/85 hover:text-[#D4A53A] transition-colors ${
          compact ? "px-2.5 py-1.5" : "px-3 py-2"
        }`}
      >
        <Globe size={13} />
        <span className="font-semibold">{LANG_LABELS[lang].code}</span>
        <span className="text-white/40">·</span>
        <span>{CURRENCY_LABELS[currency].sym}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          data-testid="locale-switcher-panel"
          className="absolute right-0 mt-2 w-56 bg-[#0A4143] border border-[#D4A53A]/30 shadow-2xl z-50"
        >
          <div className="p-4">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4A53A] mb-3">
              Language
            </div>
            <div className="space-y-1">
              {languages.map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  data-testid={`locale-lang-${code}`}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    lang === code
                      ? "bg-[#D4A53A]/10 text-[#D4A53A]"
                      : "text-white/85 hover:bg-[#0F5E60]"
                  }`}
                >
                  <span>{LANG_LABELS[code].name}</span>
                  {lang === code && <Check size={13} className="text-[#D4A53A]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[#D4A53A]/15 p-4">
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4A53A] mb-3">
              Currency
            </div>
            <div className="space-y-1">
              {currencies.map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  data-testid={`locale-currency-${code}`}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    currency === code
                      ? "bg-[#D4A53A]/10 text-[#D4A53A]"
                      : "text-white/85 hover:bg-[#0F5E60]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-bold w-4">{CURRENCY_LABELS[code].sym}</span>
                    <span>{CURRENCY_LABELS[code].name}</span>
                    <span className="text-white/40 text-[10px]">({code})</span>
                  </span>
                  {currency === code && <Check size={13} className="text-[#D4A53A]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
