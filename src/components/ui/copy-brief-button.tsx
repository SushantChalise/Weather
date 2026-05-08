"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import type { CorridorId } from "@/types/weather";

type Props = {
  corridorId: CorridorId;
  className?: string;
};

export function CopyBriefButton({ corridorId, className }: Props) {
  const { show, ToastNode } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    setLoading(true);
    try {
      const res = await fetch(`/api/brief/${corridorId}`);
      if (!res.ok) throw new Error("Failed to fetch brief");
      const json = (await res.json()) as { brief: { plaintext: string } };
      await navigator.clipboard.writeText(json.brief.plaintext);
      show("Brief copied to clipboard");
    } catch {
      show("Could not copy — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        disabled={loading}
        className={className}
        aria-label="Copy guide brief to clipboard"
      >
        {loading ? "…" : "Copy Brief"}
      </button>
      {ToastNode}
    </>
  );
}
