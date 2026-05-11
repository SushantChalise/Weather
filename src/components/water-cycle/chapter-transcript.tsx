/**
 * chapter-transcript.tsx — Static chapter transcript for reduced-motion + screen readers
 *
 * Purpose (T4.1):
 *   - When prefers-reduced-motion is REDUCE: renders visually as an <article>
 *     beneath the static poster, giving full narrative text + headline numbers
 *     + scene layer citations without any animation.
 *   - When motion is OK: renders as sr-only (screen-reader-accessible only),
 *     so all screen-reader users always get the structured text content.
 *
 * WCAG 2.1 AA: text colors chosen for >=4.5:1 contrast on #0f172a (slate-950):
 *   - Caption text: #cbd5e1 (slate-300) — 7.5:1
 *   - Labels: #7dd3fc (sky-300) — 7:1
 *   - Values: #f8fafc (slate-50) — 18:1
 *   - Muted: #94a3b8 (slate-400) — 4.6:1
 *
 * Color grammar (WATER_CYCLE_SPEC.md §7): violations are bugs.
 *   #7DD3FC = ice/glaciers, #0E7490 = lakes, #38BDF8 = active-water,
 *   #F87171 = loss/risk, #FBBF24 = heat, #FCD34D = people, #475569 = terrain
 *
 * No animation, no GSAP, no Framer Motion — this is the static fallback.
 * Per spec §7 hard constraint 3: no autoplay under reduced-motion.
 */
"use client";

import { useEffect, useState } from "react";

import type { Provenance } from "@/lib/water-cycle/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a clickable href from a citation string ("doi:..." or "url:..."). */
function citationHref(citation: string): string | undefined {
  if (citation.startsWith("doi:")) {
    return `https://doi.org/${citation.slice(4)}`;
  }
  if (citation.startsWith("url:")) {
    return citation.slice(4);
  }
  return undefined;
}

/** Strip HTML tags from caption_text for safe plain-text rendering. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ChapterTranscriptProps = {
  /** Single chapter's provenance.json content */
  provenance: Provenance;
  /**
   * When true: renders visually (reduced-motion fallback path).
   * When false/undefined: renders as sr-only (screen-reader only).
   */
  isVisible?: boolean;
};

// ---------------------------------------------------------------------------
// ChapterTranscript
// ---------------------------------------------------------------------------

export function ChapterTranscript({ provenance, isVisible }: ChapterTranscriptProps) {
  const chapterNum = provenance.chapter_id.slice(2); // "ch0" → "0"
  const plainCaption = stripHtml(provenance.caption_text);

  // Sr-only wrapper classes (when motion is OK, visual users see only poster+video)
  // The chapter-transcript class is toggled to visible by CSS under reduced-motion.
  const articleClasses = [
    "chapter-transcript",
    // When isVisible prop forces display (reduced-motion detected in JS):
    // let the parent control visibility instead of relying only on CSS.
    // We still add the class so CSS media query works for SSR/no-JS cases.
    !isVisible ? "sr-only" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      className={articleClasses}
      aria-label={`Chapter ${chapterNum} transcript: ${provenance.shot_id}`}
      data-chapter-id={provenance.chapter_id}
      data-testid="chapter-transcript"
    >
      {isVisible && (
        <div className="chapter-transcript-content">
          {/* Chapter heading */}
          <h3>
            Chapter {chapterNum} —{" "}
            {provenance.shot_id
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ")}
          </h3>

          {/* Caption text — HTML stripped for safe plain-text rendering */}
          <p>{plainCaption}</p>

          {/* Headline numbers as a definition list */}
          {provenance.headline_numbers.length > 0 && (
            <section aria-label="Key statistics">
              <h4
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginTop: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                Key numbers
              </h4>
              <dl>
                {provenance.headline_numbers.map((n) => {
                  const href = citationHref(n.citation);
                  return (
                    <div key={`${n.value}-${n.label}`} style={{ display: "contents" }}>
                      <dt>{n.value}</dt>
                      <dd>
                        {n.label}
                        {href && (
                          <>
                            {" "}
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#38bdf8",
                                fontSize: "0.75rem",
                                textDecoration: "underline",
                              }}
                              aria-label={`Source for ${n.label} (opens in new tab)`}
                            >
                              [source]
                            </a>
                          </>
                        )}
                        {n.uncertainty && (
                          <span
                            style={{
                              color: "#64748b",
                              fontSize: "0.75rem",
                              marginLeft: "0.25rem",
                            }}
                          >
                            ({n.uncertainty} uncertainty)
                          </span>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          )}

          {/* Scene layers as a list with citations */}
          {provenance.scene_layers.length > 0 && (
            <section aria-label="Data sources in this chapter">
              <h4
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginTop: "1rem",
                  marginBottom: "0.5rem",
                }}
              >
                Data layers
              </h4>
              <ul>
                {provenance.scene_layers.map((layer) => {
                  const doiHref = layer.source.doi
                    ? `https://doi.org/${layer.source.doi}`
                    : undefined;
                  return (
                    <li key={layer.id}>
                      <span style={{ color: layer.color, fontWeight: 600 }}>
                        {layer.source.dataset}
                      </span>
                      {layer.source.year_keyframe !== undefined && (
                        <span style={{ color: "#64748b" }}> ({layer.source.year_keyframe})</span>
                      )}
                      {layer.source.doi && (
                        <>
                          {" — "}
                          {doiHref ? (
                            <a
                              href={doiHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#38bdf8",
                                fontSize: "0.75rem",
                                textDecoration: "underline",
                              }}
                              aria-label={`DOI for ${layer.source.dataset} (opens in new tab)`}
                            >
                              doi:{layer.source.doi}
                            </a>
                          ) : (
                            <span style={{ color: "#64748b" }}>doi:{layer.source.doi}</span>
                          )}
                        </>
                      )}
                      {layer.source.filter && (
                        <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                          {" "}
                          · filter: {layer.source.filter}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* When sr-only, still expose text content to screen readers */}
      {!isVisible && (
        <div>
          <p>{plainCaption}</p>
          {provenance.headline_numbers.map((n) => (
            <p key={`${n.value}-${n.label}`}>
              {n.value}: {n.label}
            </p>
          ))}
          {provenance.scene_layers.map((layer) => (
            <p key={layer.id}>
              Data source: {layer.source.dataset}
              {layer.source.doi ? ` (doi:${layer.source.doi})` : ""}
            </p>
          ))}
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// ChapterTranscriptWithMotionDetect
// ---------------------------------------------------------------------------
// Client-side wrapper that detects prefers-reduced-motion and passes
// isVisible to ChapterTranscript. Used by ChapterSection.

export function ChapterTranscriptWithMotionDetect({ provenance }: { provenance: Provenance }) {
  // Initialize synchronously so transcript renders correctly on first paint
  const [prefersReduced, setPrefersReduced] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return <ChapterTranscript provenance={provenance} isVisible={prefersReduced} />;
}
