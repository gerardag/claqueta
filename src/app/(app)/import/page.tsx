"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useCallback, useEffect } from "react";

type ImportStatus = {
  id: number;
  status: "pending" | "running" | "done" | "error";
  totalShows: number;
  processedShows: number;
  importedShows: number;
  importedEpisodes: number;
  skippedShows: number;
  skippedJson: { tvdbId: number; name: string; reason: string }[];
};

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

export default function ImportPage() {
  const t = useTranslations("pages.import");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const pollStatus = useCallback((importId: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/import/${importId}/status`);
        if (!res.ok) return;
        const data: ImportStatus = await res.json();
        setImportStatus(data);

        if (data.status === "done") {
          setPhase("done");
          clearInterval(interval);
        } else if (data.status === "error") {
          setPhase("error");
          clearInterval(interval);
        }
      } catch {
        /* keep polling */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      setPhase("uploading");
      setErrorMessage("");
      setImportStatus(null);

      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      try {
        const res = await fetch("/api/import", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setErrorMessage(data?.error ?? t("error"));
          setPhase("error");
          return;
        }

        const { importId } = await res.json();
        setPhase("processing");
        pollStatus(importId);
      } catch {
        setErrorMessage(t("error"));
        setPhase("error");
      }
    },
    [t, pollStatus],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        upload(e.dataTransfer.files);
      }
    },
    [upload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        upload(e.target.files);
      }
    },
    [upload],
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setImportStatus(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const downloadSkipped = useCallback(() => {
    if (!importStatus?.skippedJson?.length) return;
    const lines = importStatus.skippedJson.map(
      (s) => `TVDB#${s.tvdbId} — ${s.name}: ${s.reason}`,
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-skipped.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [importStatus]);

  // Restore polling if user navigates back and there's a running import
  useEffect(() => {
    async function checkRunning() {
      // Check last import on mount by looking at URL or local state
      // This is handled by the polling already — no-op
    }
    checkRunning();
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display font-bold text-2xl tracking-tight mb-2">{t("title")}</h1>
      <p className="text-muted mb-1">{t("tvtimeDescription")}</p>
      <p className="text-sm text-muted mb-6">{t("instructions")}</p>

      {phase === "idle" && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
            dragging
              ? "border-foreground bg-foreground/10"
              : "border-border hover:border-foreground/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <p className="text-lg mb-3">{t("dropzone")}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:opacity-90 transition-opacity"
          >
            {t("dropzoneButton")}
          </button>
          <p className="text-xs text-muted mt-3">{t("dropzoneHint")}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.csv"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {phase === "uploading" && (
        <div className="text-center py-10">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-foreground border-t-transparent rounded-full mb-3" />
          <p>{t("uploading")}</p>
        </div>
      )}

      {phase === "processing" && importStatus && (
        <div className="py-6">
          <p className="mb-3 font-medium">{t("processing")}</p>
          <div className="w-full bg-border rounded-full h-3 mb-2">
            <div
              className="bg-foreground h-3 rounded-full transition-all duration-300"
              style={{
                width: `${importStatus.totalShows > 0 ? (importStatus.processedShows / importStatus.totalShows) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-sm text-muted">
            {t("progress", {
              processed: importStatus.processedShows,
              total: importStatus.totalShows,
            })}
          </p>
        </div>
      )}

      {phase === "processing" && !importStatus && (
        <div className="text-center py-10">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-foreground border-t-transparent rounded-full mb-3" />
          <p>{t("processing")}</p>
        </div>
      )}

      {phase === "done" && importStatus && (
        <div className="py-6 space-y-4">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-5">
            <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
              {t("done")}
            </p>
            <ul className="text-sm space-y-1">
              <li>{t("resultShows", { count: importStatus.importedShows })}</li>
              <li>
                {t("resultEpisodes", {
                  count: importStatus.importedEpisodes,
                })}
              </li>
              {importStatus.skippedShows > 0 && (
                <li>
                  {t("resultSkipped", { count: importStatus.skippedShows })}
                </li>
              )}
            </ul>
          </div>

          {importStatus.skippedJson?.length > 0 && (
            <details className="border border-border rounded-xl p-4">
              <summary className="cursor-pointer font-medium text-sm">
                {t("skippedDetail")}
              </summary>
              <ul className="mt-2 text-sm space-y-1 text-muted">
                {importStatus.skippedJson.map((s) => (
                  <li key={s.tvdbId}>
                    <span className="font-mono text-xs">TVDB#{s.tvdbId}</span>{" "}
                    — {s.name}: {s.reason}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={downloadSkipped}
                className="mt-3 text-sm text-foreground hover:underline"
              >
                {t("downloadSkipped")}
              </button>
            </details>
          )}

          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:opacity-90 transition-opacity"
          >
            {t("importAnother")}
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="py-6 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <p className="font-semibold text-red-800 dark:text-red-200">
              {errorMessage || t("error")}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-accent text-accent-fg rounded-lg hover:opacity-90 transition-opacity"
          >
            {t("importAnother")}
          </button>
        </div>
      )}
    </div>
  );
}
