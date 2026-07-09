"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useCallback } from "react";

type ImportStatus = {
  id: number;
  status: "pending" | "running" | "done" | "error";
  totalShows: number;
  processedShows: number;
  importedShows: number;
  importedEpisodes: number;
  skippedShows: number;
  skippedJson: { tmdbId?: number; tvdbId?: number; name: string; reason: string }[];
};

type Phase = "idle" | "uploading" | "processing" | "done" | "error";

export function ImportSection({
  accept,
  translationPrefix,
}: {
  accept: string;
  translationPrefix: "claqueta" | "tvtime";
}) {
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
      (s) => {
        const id = s.tmdbId ? `TMDB#${s.tmdbId}` : `TVDB#${s.tvdbId}`;
        return `${id} — ${s.name}: ${s.reason}`;
      },
    );
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-skipped.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [importStatus]);

  const dropzoneKey = translationPrefix === "claqueta" ? "dropzoneClaqueta" : "dropzone";
  const dropzoneHintKey = translationPrefix === "claqueta" ? "dropzoneHintClaqueta" : "dropzoneHint";

  return (
    <div>
      <p className="text-xs text-muted mb-3">{t(`${translationPrefix}Description`)}</p>
      {translationPrefix === "tvtime" && (
        <p className="text-xs text-muted mb-4">{t("instructions")}</p>
      )}

      {phase === "idle" && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragging
              ? "border-accent bg-accent/10"
              : "border-border hover:border-accent/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <p className="text-sm mb-3">{t(dropzoneKey)}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm"
          >
            {t("dropzoneButton")}
          </button>
          <p className="text-xs text-muted mt-3">{t(dropzoneHintKey)}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={translationPrefix === "tvtime"}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {phase === "uploading" && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm">{t("uploading")}</p>
        </div>
      )}

      {phase === "processing" && importStatus && (
        <div className="py-4">
          <p className="mb-3 font-medium text-sm">{t("processing")}</p>
          <div className="w-full bg-border rounded-full h-2.5 mb-2">
            <div
              className="bg-accent h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${importStatus.totalShows > 0 ? (importStatus.processedShows / importStatus.totalShows) * 100 : 0}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted">
            {t("progress", {
              processed: importStatus.processedShows,
              total: importStatus.totalShows,
            })}
          </p>
        </div>
      )}

      {phase === "processing" && !importStatus && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-accent border-t-transparent rounded-full mb-3" />
          <p className="text-sm">{t("processing")}</p>
        </div>
      )}

      {phase === "done" && importStatus && (
        <div className="py-4 space-y-3">
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="font-semibold text-green-800 dark:text-green-200 text-sm mb-2">
              {t("done")}
            </p>
            <ul className="text-xs space-y-1">
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
            <details className="border border-border rounded-lg p-3">
              <summary className="cursor-pointer font-medium text-xs">
                {t("skippedDetail")}
              </summary>
              <ul className="mt-2 text-xs space-y-1 text-muted">
                {importStatus.skippedJson.map((s, i) => (
                  <li key={s.tmdbId ?? s.tvdbId ?? i}>
                    <span className="font-mono text-xs">
                      {s.tmdbId ? `TMDB#${s.tmdbId}` : `TVDB#${s.tvdbId}`}
                    </span>{" "}
                    — {s.name}: {s.reason}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={downloadSkipped}
                className="mt-2 text-xs text-accent hover:underline"
              >
                {t("downloadSkipped")}
              </button>
            </details>
          )}

          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm"
          >
            {t("importAnother")}
          </button>
        </div>
      )}

      {phase === "error" && (
        <div className="py-4 space-y-3">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="font-semibold text-red-800 dark:text-red-200 text-sm">
              {errorMessage || t("error")}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-sm"
          >
            {t("importAnother")}
          </button>
        </div>
      )}
    </div>
  );
}

export function TvTimeImportDone() {
  const t = useTranslations("pages.import");
  return (
    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
      <p className="text-sm text-green-800 dark:text-green-200">
        {t("alreadyImported")}
      </p>
    </div>
  );
}
