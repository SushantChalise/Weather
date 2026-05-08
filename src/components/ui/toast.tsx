"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  durationMs?: number;
  onDone: () => void;
};

export function Toast({ message, durationMs = 2000, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone();
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-white text-xs px-4 py-2 rounded-full shadow-lg z-50 animate-fade-in"
    >
      {message}
    </div>
  );
}

type UseToastReturn = {
  show: (msg: string) => void;
  ToastNode: React.ReactNode;
};

export function useToast(): UseToastReturn {
  const [state, setState] = useState<{ message: string; key: number } | null>(null);

  function show(msg: string) {
    setState({ message: msg, key: Date.now() });
  }

  const ToastNode = state ? (
    <Toast key={state.key} message={state.message} onDone={() => setState(null)} />
  ) : null;

  return { show, ToastNode };
}
