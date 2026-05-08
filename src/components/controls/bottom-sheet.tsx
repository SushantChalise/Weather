"use client";

import { type ReactNode, useRef, useState } from "react";

type SheetState = "collapsed" | "half" | "full";

const SHEET_HEIGHTS: Record<SheetState, string> = {
  collapsed: "48px",
  half: "40vh",
  full: "85vh",
};

type Props = {
  children: ReactNode;
};

export function BottomSheet({ children }: Props) {
  const [state, setState] = useState<SheetState>("collapsed");
  const startY = useRef<number | null>(null);

  const cycleState = () => {
    setState((prev) => (prev === "collapsed" ? "half" : prev === "half" ? "full" : "collapsed"));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0]?.clientY ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const endY = e.changedTouches[0]?.clientY ?? startY.current;
    const delta = startY.current - endY;
    if (delta > 40) setState((prev) => (prev === "collapsed" ? "half" : "full"));
    else if (delta < -40) setState((prev) => (prev === "full" ? "half" : "collapsed"));
    startY.current = null;
  };

  return (
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] shadow-[var(--shadow-lg)] rounded-t-xl transition-all duration-300 ease-out overflow-hidden"
      style={{
        height: SHEET_HEIGHTS[state],
        zIndex: 50,
      }}
      role="dialog"
      aria-label="Controls panel"
    >
      {/* Handle */}
      <button
        type="button"
        onClick={cycleState}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="w-full flex justify-center items-center py-3 cursor-pointer"
        aria-label={state === "collapsed" ? "Open controls" : "Close controls"}
      >
        <div className="w-10 h-1 bg-[var(--color-border)] rounded-full" />
      </button>

      {/* Content */}
      {state !== "collapsed" && <div className="px-4 pb-4 overflow-y-auto">{children}</div>}
    </div>
  );
}
