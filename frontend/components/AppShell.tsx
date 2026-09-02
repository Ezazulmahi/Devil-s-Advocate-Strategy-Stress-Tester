"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

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
          <div className="avatar">MT</div>
          <span className="user-name">Md Tahmid Uddin</span>
        </div>
      </div>
      <div className="main">{children}</div>
    </div>
  );
}
