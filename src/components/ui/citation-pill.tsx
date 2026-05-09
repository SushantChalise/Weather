"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CitationDataset = {
  slug: string;
  name: string;
  version?: string;
  license: string;
  citation: string;
  sourceUrl: string;
  description?: string;
  spatialRes?: string;
  temporalRes?: string;
  methodologyUrl?: string;
};

type Props = {
  dataset: CitationDataset;
  className?: string;
};

function InfoIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1" />
      <rect x="4.5" y="4" width="1" height="3.5" fill="currentColor" rx="0.5" />
      <rect x="4.5" y="2.5" width="1" height="1" fill="currentColor" rx="0.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CitationPill({ dataset, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) close();
  };

  const handleOverlayKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") close();
  };

  return (
    <>
      {/* Pill button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer select-none",
          "bg-neutral-100 dark:bg-neutral-800",
          "text-neutral-600 dark:text-neutral-300",
          "hover:bg-neutral-200 dark:hover:bg-neutral-700",
          "transition-colors duration-150",
          "border border-neutral-200 dark:border-neutral-700",
          className,
        ].join(" ")}
        style={{ fontSize: "11px", fontFamily: "Inter, sans-serif" }}
        aria-label={`View source: ${dataset.name}`}
      >
        <InfoIcon />
        <span>Source: {dataset.name}</span>
      </button>

      {/* Modal / overlay (inline, not a portal) */}
      {open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          onKeyDown={handleOverlayKeyDown}
          className={[
            "fixed inset-0 z-50 flex items-end justify-center",
            "sm:items-center",
            "bg-black/50 backdrop-blur-sm",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label={`${dataset.name} source details`}
        >
          <div
            className={[
              "relative w-full max-h-[90dvh] overflow-y-auto",
              "sm:max-w-md sm:rounded-xl sm:max-h-[85vh]",
              "bg-white dark:bg-neutral-900",
              "rounded-t-xl",
              "shadow-2xl",
              "p-5",
            ].join(" ")}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-50 leading-tight">
                {dataset.name}
              </h2>
              <button
                type="button"
                onClick={close}
                className={[
                  "shrink-0 rounded-md p-1",
                  "text-neutral-500 dark:text-neutral-400",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                  "transition-colors duration-150",
                ].join(" ")}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Meta grid */}
            <dl className="space-y-2.5 text-sm mb-4">
              {dataset.version && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-neutral-500 dark:text-neutral-400">Version</dt>
                  <dd className="text-neutral-800 dark:text-neutral-200">{dataset.version}</dd>
                </div>
              )}

              {/* License badge */}
              <div className="flex gap-2 items-center">
                <dt className="w-24 shrink-0 text-neutral-500 dark:text-neutral-400">License</dt>
                <dd>
                  <span
                    className={[
                      "inline-block px-1.5 py-0.5 rounded text-xs font-medium",
                      "bg-green-50 dark:bg-green-900/30",
                      "text-green-700 dark:text-green-400",
                      "border border-green-200 dark:border-green-800",
                    ].join(" ")}
                  >
                    {dataset.license}
                  </span>
                </dd>
              </div>

              {dataset.spatialRes && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-neutral-500 dark:text-neutral-400">
                    Spatial res.
                  </dt>
                  <dd className="text-neutral-800 dark:text-neutral-200">{dataset.spatialRes}</dd>
                </div>
              )}

              {dataset.temporalRes && (
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-neutral-500 dark:text-neutral-400">
                    Temporal res.
                  </dt>
                  <dd className="text-neutral-800 dark:text-neutral-200">{dataset.temporalRes}</dd>
                </div>
              )}
            </dl>

            {/* Description */}
            {dataset.description && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                {dataset.description}
              </p>
            )}

            {/* Citation */}
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-1.5">
                Citation
              </p>
              <blockquote
                className={[
                  "text-xs leading-relaxed",
                  "border-l-2 border-neutral-300 dark:border-neutral-600",
                  "pl-3 py-1",
                  "text-neutral-700 dark:text-neutral-300",
                  "italic",
                ].join(" ")}
              >
                {dataset.citation}
              </blockquote>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-3">
              <a
                href={dataset.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={[
                  "inline-flex items-center gap-1 text-xs font-medium",
                  "text-blue-600 dark:text-blue-400",
                  "hover:underline",
                ].join(" ")}
              >
                View source
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                  <path
                    d="M2 8l6-6M4 2h4v4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              {dataset.methodologyUrl && (
                <a
                  href={dataset.methodologyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    "inline-flex items-center gap-1 text-xs font-medium",
                    "text-blue-600 dark:text-blue-400",
                    "hover:underline",
                  ].join(" ")}
                >
                  Methodology
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path
                      d="M2 8l6-6M4 2h4v4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
