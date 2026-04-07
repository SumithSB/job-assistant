import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuthStore } from "@/store/authStore";

export default function RegisterPage() {
  const nav = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api.auth.register(email, password);
      setToken(r.access_token);
      nav("/");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Registration failed");
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="One account for your master resume, job analysis, and application tracking."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-2">
          <span className="ui-label">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="ui-input"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="ui-label">Password (min 8 characters)</span>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ui-input"
          />
        </label>
        {err ? <p className="ui-alert-error">{err}</p> : null}
        <button type="submit" className="ui-btn-primary w-full">
          Register
        </button>
      </form>
      <p className="ui-muted mt-6 text-center">
        Already have an account?{" "}
        <Link to="/login" className="ui-link">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
