"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { clientFetchBlob } from "@/lib/client-api";

export default function ExportReportButton({ runId }: { runId: string }) {
  const { notify } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await clientFetchBlob(`/runs/${runId}/export`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stress-test-run-${runId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      notify("Couldn't export the report — please try again.", "error");
    } finally {
      setExporting(false);
    }
  }

  return (
    <button type="button" className="btn btn-ghost" onClick={handleExport} disabled={exporting}>
      {exporting ? "Exporting…" : "Export Report"}
    </button>
  );
}
