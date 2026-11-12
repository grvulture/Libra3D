import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTicket, replyToTicket } from "../api/tickets";
import { useLocale } from "../context/LocaleContext";

const TicketView = () => {
  const { t } = useLocale();
  const { id } = useParams();
  const tRef = useRef(t);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchTicket(id);
      if (isActive()) setData(result);
    } catch (err) {
      if (isActive()) {
        setError(err?.response?.data?.detail || tRef.current("tickets.errors.load"));
        setData(null);
      }
    } finally {
      if (isActive()) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  useEffect(() => {
    let active = true;
    load(() => active);
    return () => {
      active = false;
    };
  }, [load]);

  const reply = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await replyToTicket(id, body);
      setBody("");
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("tickets.errors.reply"));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-32 text-white">{t("tickets.loading")}</div>;

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-6 py-32 text-white">
        <h1 className="font-heading font-black text-3xl mb-4">{t("tickets.accessRequired")}</h1>
        <p className="text-white/75 mb-6">{error || t("tickets.requestAccessBody")}</p>
        <a href="/ticket/access" className="btn-gold">{t("tickets.requestAccessLink")}</a>
      </div>
    );
  }

  const { ticket, messages } = data;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-white">
      <h1 className="font-heading font-black text-3xl mb-2">{ticket.subject}</h1>
      <div className="text-white/60 text-sm mb-6">{t("tickets.statusLabel")}: {t(`tickets.status.${ticket.status}`)} · {t("tickets.priorityLabel")}: {t(`tickets.priority.${ticket.priority}`)}</div>
      <div className="space-y-4 mb-8">
        {messages.map((message) => (
          <div key={message.id} className="border border-[#D4A53A]/20 bg-[#0F5E60] p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-[#D4A53A] mb-2">
              {message.author_type} · {new Date(message.created_at).toLocaleString()}
            </div>
            <div className="whitespace-pre-wrap">{message.body}</div>
          </div>
        ))}
      </div>
      <form onSubmit={reply} className="space-y-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="brand-input resize-none"
          placeholder={t("tickets.replyPlaceholder")}
        />
        <button type="submit" disabled={sending} className="btn-gold">
          {sending ? t("common.sending") : t("tickets.sendReply")}
        </button>
      </form>
      <style>{`
        .brand-input { width: 100%; background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 12px 14px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default TicketView;
