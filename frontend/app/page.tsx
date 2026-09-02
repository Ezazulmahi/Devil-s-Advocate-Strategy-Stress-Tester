"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/dashboard");
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
              required
            />
          </div>
          <button type="submit" className="btn btn-red" style={{ width: "100%", padding: 11 }}>
            Sign in
          </button>
        </form>
        <p className="auth-note">
          Every project is private to your account.
          <br />
          <strong>Create an account</strong>
        </p>
      </div>
    </div>
  );
}
