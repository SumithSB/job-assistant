import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "@/api/client";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const nav = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api.auth.login(email, password);
      setToken(r.access_token);
      nav("/");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Login failed");
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Continue to your pipeline — analyze roles, track applications, and keep one profile in sync."
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
          <span className="ui-label">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="ui-input"
          />
        </label>
        {err ? <p className="ui-alert-error">{err}</p> : null}
        <button type="submit" className="ui-btn-primary w-full">
          Sign in
        </button>
      </form>
      <p className="ui-muted mt-6 text-center">
        No account?{" "}
        <Link to="/register" className="ui-link">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
