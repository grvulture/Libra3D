import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { TRANSLATIONS } from "../data/translations";

const LocaleContext = createContext(null);
export const useLocale = () => useContext(LocaleContext);

const STORAGE_KEY = "libra3d_locale_v1";

// Base prices in catalogue are EUR. Conversion rates relative to EUR.
const RATES = {
  EUR: 1,
  USD: 1.08,
};

const SYMBOLS = {
  EUR: "€",
  USD: "$",
};

const LOCALES = {
  en: "en-US",
  el: "el-GR",
};

export const LocaleProvider = ({ children }) => {
  // Lazy initializers read localStorage synchronously on first render,
  // avoiding any race with the persist effect under StrictMode.
  const [lang, setLang] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.lang && TRANSLATIONS[saved.lang]) return saved.lang;
      }
    } catch {
      /* ignore */
    }
    return "el"; // Default to Greek (Greece-based)
  });
  const [currency, setCurrency] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.currency && RATES[saved.currency]) return saved.currency;
      }
    } catch {
      /* ignore */
    }
    return "EUR"; // Default to EUR
  });

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang, currency }));
      document.documentElement.lang = lang;
    } catch {
      /* ignore */
    }
  }, [lang, currency]);

  const t = useCallback(
    (key, vars = {}) => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
      let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
      return str;
    },
    [lang]
  );

  const formatPrice = useCallback(
    (amountInEur, opts = {}) => {
      const { withSymbol = true, fractionDigits = 2 } = opts;
      const converted = amountInEur * (RATES[currency] || 1);
      try {
        return new Intl.NumberFormat(LOCALES[lang] || "en-US", {
          style: withSymbol ? "currency" : "decimal",
          currency,
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits,
        }).format(converted);
      } catch {
        return `${SYMBOLS[currency] || ""}${converted.toFixed(fractionDigits)}`;
      }
    },
    [currency, lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      currency,
      setCurrency,
      t,
      formatPrice,
      symbol: SYMBOLS[currency],
      currencies: Object.keys(RATES),
      languages: Object.keys(TRANSLATIONS),
    }),
    [lang, currency, t, formatPrice]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};
