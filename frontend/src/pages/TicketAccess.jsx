import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { validateTicketAccess, exchangeTicketAccess, requestTicketAccess } from "../api/tickets";
import { useLocale } from "../context/LocaleContext";

const readFragmentToken = () => {
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  return params.get("token");
};

const TicketAccess = () => {
  const { t } = useLocale();
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; });
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState("checking");
  const [ticketId, setTicketId] = useState(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    const fragmentToken = readFragmentToken();
    if (fragmentToken) {
      window.history.replaceState({}, "", window.location.pathname + window.location.search);
    }
    if (!fragmentToken) {
      setStatus("request");
      return;
    }
    setToken(fragmentToken);
    let active = true;
    validateTicketAccess(fragmentToken)
      .then((data) => {
        if (active) {
          setTicketId(data.ticket_id);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) {
          setStatus("request");
          setError(tRef.current("tickets.access.invalidOrExpired"));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const exchange = async () => {
    if (!token) return;
    try {
      const result = await exchangeTicketAccess(token);
      navigate(`/ticket/${result.ticket_id}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || t("tickets.errors.open"));
    }
  };

  const requestLink = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await requestTicketAccess(email);
      setMessage(t("tickets.access.linkSent"));
    } catch (err) {
      setMessage(t("tickets.access.linkSent"));
    }
  };

  if (status === "checking") {
    return <div className="max-w-3xl mx-auto px-6 py-32 text-white">{t("tickets.access.checking")}</div>;
  }

  if (status === "ready") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-32 text-white">
        <h1 className="font-heading font-black text-3xl mb-4">{t("tickets.access.openTitle")}</h1>
        <p className="text-white/75 mb-6">{t("tickets.access.valid")}</p>
        {error && <div className="text-red-300 text-sm mb-4">{error}</div>}
        <button onClick={exchange} className="btn-gold">{t("tickets.access.continue")}</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 py-32 text-white">
      <h1 className="font-heading font-black text-3xl mb-4">{t("tickets.access.requestTitle")}</h1>
      <p className="text-white/75 mb-6">{t("tickets.access.requestBody")}</p>
      {error && <div className="text-red-300 text-sm mb-4">{error}</div>}
      {message && <div className="text-green-300 text-sm mb-4">{message}</div>}
      <form onSubmit={requestLink} className="space-y-5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="brand-input"
          placeholder={t("tickets.access.emailPlaceholder")}
        />
        <button type="submit" className="btn-gold w-full justify-center">{t("tickets.access.sendLink")}</button>
      </form>
      <style>{`
        .brand-input { width: 100%; background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 12px 14px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default TicketAccess;
