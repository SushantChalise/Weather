/**
 * chapter-overlay.tsx — Per-chapter overlay dispatcher
 *
 * Routes chapterId → the correct per-chapter overlay component.
 * Each overlay is server-renderable (no "use client") and renders
 * headlines, captions, and citation chips.
 */
import type { Provenance } from "@/lib/water-cycle/types";
import { Ch0Overlay } from "./per-chapter/ch0-reservoir";
import { Ch1Overlay } from "./per-chapter/ch1-retreat";
import { Ch2Overlay } from "./per-chapter/ch2-lake-bloom";
import { Ch3Overlay } from "./per-chapter/ch3-sankey";
import { Ch4Overlay } from "./per-chapter/ch4-hydro-clock";
import { Ch5Overlay } from "./per-chapter/ch5-impurities";
import { Ch6Overlay } from "./per-chapter/ch6-choice";

type ChapterId = "ch0" | "ch1" | "ch2" | "ch3" | "ch4" | "ch5" | "ch6";

type Props = {
  chapterId: ChapterId;
  provenance: Provenance;
  onShowProvenance: () => void;
};

export function ChapterOverlay({ chapterId, provenance, onShowProvenance }: Props) {
  switch (chapterId) {
    case "ch0":
      return <Ch0Overlay provenance={provenance} onShowProvenance={onShowProvenance} />;
    case "ch1":
      return <Ch1Overlay provenance={provenance} onShowProvenance={onShowProvenance} />;
    case "ch2":
      return <Ch2Overlay provenance={provenance} onShowProvenance={onShowProvenance} />;
    case "ch3":
      return <Ch3Overlay provenance={provenance} onShowProvenance={onShowProvenance} />;
    case "ch4":
      return <Ch4Overlay provenance={provenance} onShowProvenance={onShowProvenance} />;
    case "ch5":
      return <Ch5Overlay provenance={provenance} onShowProvenance={onShowProvenance} />;
    case "ch6":
      return <Ch6Overlay provenance={provenance} onShowProvenance={onShowProvenance} />;
    default:
      return null;
  }
}
