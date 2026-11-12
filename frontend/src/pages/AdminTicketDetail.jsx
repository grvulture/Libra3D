import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchAdminTicket, replyToAdminTicket, updateAdminTicket, retryEmailNotification } from "../api/tickets";
import { useLocale } from "../context/LocaleContext";

const AdminTicketDetail = () => {
  const { t } = useLocale();
  const { id } = useParams();
  const tRef = useRef(t);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const load = useCallback(async (isActive = () => true) => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdminTicket(id);
      if (isActive()) {
        setData(result);
        setStatus(result.ticket.status);
        setPriority(result.ticket.priority);
      }
    } catch (err) {
      if (isActive()) setError(err?.response?.data?.detail || tRef.current("tickets.errors.load"));
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

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyToAdminTicket(id, reply);
      setReply("");
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("tickets.errors.reply"));
    } finally {
      setSending(false);
    }
  };

  const saveMeta = async () => {
    try {
      await updateAdminTicket(id, { status, priority });
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("tickets.errors.update"));
    }
  };

  const retry = async (notificationId) => {
    try {
      await retryEmailNotification(notificationId);
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail || tRef.current("tickets.errors.retry"));
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-6 py-32 text-white">{t("tickets.loading")}</div>;
  if (error || !data) return <div className="max-w-3xl mx-auto px-6 py-32 text-white">{error || t("tickets.notFound")}</div>;

  const { ticket, messages, notifications } = data;

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 text-white">
      <Link to="/admin/tickets" className="text-[#D4A53A] text-sm">{t("tickets.backToTickets")}</Link>
      <Link to="/admin" className="text-[#D4A53A] text-sm ml-4">{t("common.backToDashboard")}</Link>
      <h1 className="font-heading font-black text-3xl mt-4 mb-2">{ticket.subject}</h1>
      <div className="text-white/60 text-sm mb-6">{ticket.customer_name} · {ticket.customer_email}</div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="brand-input">
          <option value="open">{t("tickets.status.open")}</option>
          <option value="pending">{t("tickets.status.pending")}</option>
          <option value="solved">{t("tickets.status.solved")}</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="brand-input">
          <option value="normal">{t("tickets.priority.normal")}</option>
          <option value="important">{t("tickets.priority.important")}</option>
          <option value="urgent">{t("tickets.priority.urgent")}</option>
        </select>
        <button onClick={saveMeta} className="btn-gold">Save</button>
      </div>

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

      <form onSubmit={sendReply} className="space-y-4 mb-8">
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} className="brand-input resize-none" placeholder={t("tickets.agentReplyPlaceholder")} />
        <button type="submit" disabled={sending} className="btn-gold">{sending ? t("common.sending") : t("tickets.sendReply")}</button>
      </form>

      <div>
        <h2 className="font-heading font-bold text-xl mb-3">{t("tickets.emailNotifications")}</h2>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div key={notification.id} className="border border-[#D4A53A]/20 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm">{notification.recipient}</div>
                <div className="text-xs text-white/60">{t(`tickets.notificationStatus.${notification.status}`)} · {t("tickets.attempts", { count: notification.attempts })}</div>
                {notification.last_error && <div className="text-xs text-red-300">{notification.last_error}</div>}
              </div>
              {notification.status !== "sent" && (
                <button onClick={() => retry(notification.id)} className="btn-ghost-gold">{t("common.retry")}</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .brand-input { width: 100%; background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 12px 14px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default AdminTicketDetail;
