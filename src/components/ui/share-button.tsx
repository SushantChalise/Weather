"use client";

import { useToast } from "@/components/ui/toast";

type Props = {
  title?: string;
  className?: string;
};

export function ShareButton({ title = "Nepal Mountain Weather", className }: Props) {
  const { show, ToastNode } = useToast();

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User dismissed share sheet — do nothing
        return;
      }
    }
    // Desktop fallback: copy URL
    try {
      await navigator.clipboard.writeText(url);
      show("Link copied to clipboard");
    } catch {
      show("Could not copy link");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className={className}
        aria-label="Share this view"
      >
        Share
      </button>
      {ToastNode}
    </>
  );
}
