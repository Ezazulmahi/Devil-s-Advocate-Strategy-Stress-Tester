"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ToastItem {
  id: number;
  message: string;
  tone: "default" | "error";
}

interface ToastContextValue {
  notify: (message: string, tone?: "default" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback((message: string, tone: "default" | "error" = "default") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          zIndex: 200,
          maxWidth: 320,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="project-card"
            style={{
              cursor: "default",
              padding: "12px 16px",
              borderLeft: `3px solid ${t.tone === "error" ? "var(--red)" : "var(--green)"}`,
              boxShadow: "0 8px 20px rgba(0,0,0,0.4)",
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-light)" }}>{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
