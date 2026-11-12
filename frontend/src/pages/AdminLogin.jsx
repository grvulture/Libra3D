import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
  const { signIn, ensureCsrfToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await ensureCsrfToken();
      await signIn(email, password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-32 text-white">
      <h1 className="font-heading font-black text-3xl mb-6">Admin login</h1>
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">Email</div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="brand-input" />
        </label>
        <label className="block">
          <div className="text-[11px] uppercase tracking-[0.22em] text-[#D4A53A] mb-2">Password</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="brand-input" />
        </label>
        {error && <div className="text-red-300 text-sm">{error}</div>}
        <button type="submit" disabled={submitting} className="btn-gold w-full justify-center">
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <style>{`
        .brand-input {
          width: 100%;
          background: #0A4143;
          border: 1px solid rgba(212,165,58,0.25);
          color: #fff;
          padding: 12px 14px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
