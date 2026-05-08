"use client";

import { CompareButton } from "@/app/compare-button";
import { CopyBriefButton } from "@/components/ui/copy-brief-button";
import { ShareButton } from "@/components/ui/share-button";
import { useSelectionStore } from "@/state/selectionStore";

const BTN =
  "flex-1 text-xs py-2 px-2 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] transition-colors";

export function LiveActionButtons() {
  const { selectedCorridor } = useSelectionStore();

  return (
    <div className="flex gap-2">
      <CompareButton />
      <ShareButton className={BTN} />
      {selectedCorridor ? (
        <CopyBriefButton corridorId={selectedCorridor} className={BTN} />
      ) : (
        <button
          type="button"
          disabled
          className={`${BTN} cursor-not-allowed`}
          aria-label="Select a corridor to copy brief"
        >
          Copy Brief
        </button>
      )}
    </div>
  );
}
