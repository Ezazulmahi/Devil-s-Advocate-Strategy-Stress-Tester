"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ApiError } from "@/lib/api-config";
import { clientFetch, setClientToken } from "@/lib/client-api";

interface AuthResponse {
  access_token: string;
  user: { id: string; email: string };
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-frame" />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"sign-in" | "create-account">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const endpoint = mode === "sign-in" ? "/auth/login" : "/auth/register";
      const auth = await clientFetch<AuthResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setClientToken(auth.access_token);
      const from = searchParams.get("from");
      router.push(from && from !== "/" ? from : "/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-frame">
      <div className="auth-card">
        <div className="logo">
          Devil&apos;s<span>Advocate</span>
        </div>
        <p className="subtext" style={{ marginBottom: 28 }}>
          Attack your own strategy before someone else does.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={mode === "create-account" ? 8 : undefined}
              required
            />
          </div>
          {error && (
            <p style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 14 }}>{error}</p>
          )}
          <button
            type="submit"
            className="btn btn-red"
            style={{ width: "100%", padding: 11 }}
            disabled={submitting}
          >
            {submitting
              ? "Please wait…"
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
        <p className="auth-note">
          Every project is private to your account.
          <br />
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "create-account" : "sign-in");
              setError(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 700,
              padding: 0,
            }}
          >
            {mode === "sign-in" ? "Create an account" : "Already have an account? Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
