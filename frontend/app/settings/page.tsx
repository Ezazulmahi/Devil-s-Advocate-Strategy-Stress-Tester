import AppShell from "@/components/AppShell";
import { PERSONAS } from "@/lib/mock-data";

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

export default function SettingsPage() {
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
            <label htmlFor="name">Name</label>
            <input id="name" defaultValue="Md Tahmid Uddin" />
          </div>
          <div className="field" style={{ flex: 1, minWidth: 200 }}>
            <label htmlFor="settings-email">Email</label>
            <input id="settings-email" defaultValue="tamimhasanakib@gmail.com" disabled />
          </div>
        </div>
        <button type="button" className="btn btn-red" style={{ marginTop: 4 }}>
          Save changes
        </button>
      </SectionCard>

      <SectionCard
        title="Default Personas"
        description="Pre-selected personas whenever you start a new stress test — you can still change them per run."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PERSONAS.map((persona) => (
            <label
              key={persona.id}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}
            >
              <input
                type="checkbox"
                defaultChecked={persona.id !== "hacker" && persona.id !== "academic"}
                style={{ width: 16, height: 16 }}
              />
              <span
                className="p-icon"
                style={{ background: persona.color, width: 24, height: 24, fontSize: 11, marginBottom: 0 }}
              >
                {persona.shortLabel}
              </span>
              {persona.name}
            </label>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Notifications"
        description="Get pinged when a live simulation finishes or a persona escalates on you."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
            Email me when a stress test run completes
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input type="checkbox" defaultChecked style={{ width: 16, height: 16 }} />
            Email me when a persona escalates a finding to critical
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
            <input type="checkbox" style={{ width: 16, height: 16 }} />
            Weekly digest of unresolved findings across all projects
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Danger Zone"
        description="Deleting your account removes every project, run, and finding permanently."
      >
        <button type="button" className="btn btn-ghost" style={{ borderColor: "var(--red)", color: "var(--red)" }}>
          Delete account
        </button>
      </SectionCard>
    </AppShell>
  );
}
