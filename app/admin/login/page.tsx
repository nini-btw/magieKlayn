"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import Logo from "@/presentation/components/ui/Logo";
import { loginAdmin } from "../actions";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const [email, setEmail] = React.useState("admin@magieklayn.com");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await loginAdmin(email, password);

      if (result.success) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-inner">
        <Link href="/" className="admin-login-brand">
          <Logo />
          <span className="admin-login-brand-sub">Admin</span>
        </Link>

        <div className="admin-login-card">
          <h1 className="admin-login-title">Sign in</h1>

          {error && (
            <div
              data-testid="login-error"
              className="form-error"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "var(--space-md)",
              }}
            >
              <AlertCircleIcon className="h-5 w-5" style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="admin-email">
                Email
              </label>
              <input
                id="admin-email"
                className="form-input"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                className="form-input"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-submit-row">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isLoading}
                data-testid="login-button"
              >
                {isLoading ? "Signing in…" : "Sign in"}
              </button>
            </div>
          </form>

          <p className="admin-login-hint">
            Default: admin@magieklayn.com / admin123
          </p>
        </div>

        <p className="admin-login-footer">
          © {new Date().getFullYear()} Magie Klayn
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="admin-login-page">
          <p
            className="state-message"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Loading…
          </p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
