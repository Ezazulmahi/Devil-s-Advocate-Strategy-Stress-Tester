"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearClientToken, clientFetch } from "@/lib/client-api";
import type { User } from "@/models/types";

function isActive(pathname: string, section: "dashboard" | "projects" | "settings") {
  if (section === "dashboard") return pathname === "/dashboard";
  if (section === "settings") return pathname.startsWith("/settings");
  return (
    pathname.startsWith("/projects") ||
    pathname.startsWith("/findings")
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    clientFetch<User>("/auth/me")
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        // Session may have expired between navigations — middleware will
        // catch it on the next full page load; just leave the fallback shown.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const initials = user
    ? user.email.slice(0, 2).toUpperCase()
    : "··";

  function handleSignOut() {
    clearClientToken();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="shell">
      <div className="rail">
        <div className="logo">
          Devil&apos;s<span>Advocate</span>
        </div>
        <div className="tagline">stress-test everything</div>
        <nav>
          <Link href="/dashboard" className={isActive(pathname, "dashboard") ? "active" : ""}>
            Dashboard
          </Link>
          <Link href="/projects" className={isActive(pathname, "projects") ? "active" : ""}>
            Projects
          </Link>
          <Link href="/settings" className={isActive(pathname, "settings") ? "active" : ""}>
            Settings
          </Link>
        </nav>
        <div className="divider" />
        <nav>
          <Link href="/help">Help</Link>
        </nav>
        <div className="user">
          <div className="avatar">{initials}</div>
          <span className="user-name">{user?.email ?? "Loading…"}</span>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn btn-ghost"
            style={{ marginLeft: "auto", padding: "3px 9px", fontSize: 11 }}
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="main">{children}</div>
    </div>
  );
}
