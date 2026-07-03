"use client";

import { useRef, useState, type ReactNode } from "react";
import { track } from "@vercel/analytics";

export function CopyButton({
  text,
  idle,
  copied,
  className,
  children,
}: {
  text: string;
  idle: ReactNode;
  copied: ReactNode;
  className: string;
  children?: ReactNode;
}) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <button
      type="button"
      className={className}
      aria-label="Copy to clipboard"
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        // funnel proxy for "developer grabbed a snippet" (PRODUCT.md §11)
        track("snippet_copied");
        clearTimeout(timer.current);
        setDone(true);
        timer.current = setTimeout(() => setDone(false), 1400);
      }}
    >
      {children}
      <span className="glyph">{done ? copied : idle}</span>
    </button>
  );
}
