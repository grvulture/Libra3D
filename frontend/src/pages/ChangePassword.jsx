import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";
import { changePassword } from "../api/auth";

const byteLength = (value) => new TextEncoder().encode(value).length;

const ChangePassword = () => {
  const { t } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const cancelTarget = location.state?.from && String(location.state.from).startsWith("/") ? location.state.from : "/admin";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!currentPassword) return t("changePassword.errors.currentRequired");
    if (newPassword.length < 12) return t("changePassword.errors.tooShort");
    if (byteLength(newPassword) > 72) return t("changePassword.errors.tooLong");
    if (newPassword !== confirmPassword) return t("changePassword.errors.mismatch");
    return "";
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(t("changePassword.success"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.response?.data?.detail || t("changePassword.errors.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <div className="max-w-md mx-auto px-6 py-32 text-white">Authentication required.</div>;
  }

  return (
    <div className="max-w-md mx-auto px-6 py-32 text-white">
      <h1 className="font-heading font-black text-3xl mb-6">{t("changePassword.title")}</h1>
      {success && <div className="text-green-300 text-sm mb-4">{success}</div>}
      {error && <div className="text-red-300 text-sm mb-4">{error}</div>}
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("changePassword.currentPassword")}</div>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="brand-input" />
        </label>
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("changePassword.newPassword")}</div>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="brand-input" />
        </label>
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">{t("changePassword.confirmPassword")}</div>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="brand-input" />
        </label>
        <div className="flex gap-3">
          <button type="submit" disabled={submitting} className="btn-gold flex-1 justify-center">
            {submitting ? t("changePassword.changing") : t("changePassword.change")}
          </button>
          <button
            type="button"
            onClick={() => navigate(cancelTarget, { replace: true })}
            className="btn-ghost-gold flex-1 justify-center"
          >
            {t("common.cancel")}
          </button>
        </div>
      </form>
      <style>{`
        .brand-input { width: 100%; background: #0A4143; border: 1px solid rgba(212,165,58,0.25); color: #fff; padding: 12px 14px; font-size: 14px; }
      `}</style>
    </div>
  );
};

export default ChangePassword;
