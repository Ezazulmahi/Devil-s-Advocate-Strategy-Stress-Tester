import AppShell from "@/components/AppShell";
import { PERSONAS } from "@/lib/mock-data";
import { serverFetch } from "@/lib/server-api";
import type { User } from "@/models/types";

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="project-card" style={{ marginBottom: 16, cursor: "default" }}>
      <h3 style={{ marginBottom: 4 }}>{title}</h3>
      <p style={{ marginBottom: 16 }}>{description}</p>
      {children}
    </div>
  );
}

export default async function SettingsPage() {
  const user = await serverFetch<User>("/auth/me");

  return (
    <AppShell>
      <div className="topbar">
        <div>
          <h1>Settings</h1>
          <p className="subtext">Account and workspace preferences</p>
        </div>
      </div>

      <SectionCard title="Profile" description="Your identity across every stress test you run.">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="settings-email">Email</label>
            <input id="settings-email" defaultValue={user.email} disabled />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="settings-created">Member since</label>
            <input id="settings-created" defaultValue={user.created_at.slice(0, 10)} disabled />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Default Personas"
        description="Reference only for now — persona selection happens per stress test on the New Stress Test page."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PERSONAS.map((persona) => (
            <div key={persona.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <span
                className="p-icon"
                style={{ background: persona.color, width: 24, height: 24, fontSize: 11, marginBottom: 0 }}
              >
                {persona.shortLabel}
              </span>
              {persona.name}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Notifications"
        description="In-app toasts already fire when a simulation completes or a persona responds to a rebuttal. Email delivery isn't built yet."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10, opacity: 0.5 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input type="checkbox" disabled style={{ width: 16, height: 16 }} />
            Email me when a stress test run completes (not yet available)
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input type="checkbox" disabled style={{ width: 16, height: 16 }} />
            Weekly digest of unresolved findings (not yet available)
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Danger Zone"
        description="Account deletion isn't wired up yet — delete individual projects from the Dashboard or Projects page instead, which does permanently remove that project and its full run history."
      >
        <button type="button" className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>
          Delete account (not yet available)
        </button>
      </SectionCard>
    </AppShell>
  );
}
