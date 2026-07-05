"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Fixed bottom tab bar, mobile only (design: ExerciseAPI Mobile, 2026-07-05).
 * Replaces the header nav under 860px; hidden on desktop via CSS.
 */

const ICONS = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  ),
  docs: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5M9 12h7M9 16h7" />
    </svg>
  ),
  chat: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16v11H9l-4 3v-3H4z" />
    </svg>
  ),
} as const;

export function MobileTabBar({ showChat }: { showChat: boolean }) {
  const pathname = usePathname();
  const ref = useRef<HTMLElement>(null);

  // iOS browsers (Safari AND Chrome, each with its own bug flavor) fail to
  // re-anchor position:fixed elements when their toolbars collapse on scroll,
  // leaving the bar floating with a gutter below. Track the visual viewport
  // and translate the bar to the true visible bottom whenever they disagree.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = ref.current;
    if (!vv || !el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const gap = Math.max(0, vv.offsetTop + vv.height - window.innerHeight);
      el.style.transform = gap > 0.5 ? `translateY(${gap}px)` : "";
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    update();
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, []);
  const tabs: { href: string; label: string; icon: keyof typeof ICONS }[] = [
    { href: "/", label: "Home", icon: "home" },
    { href: "/docs", label: "Docs", icon: "docs" },
    ...(showChat ? [{ href: "/chat", label: "Chat", icon: "chat" as const }] : []),
  ];
  return (
    <nav ref={ref} className="mobile-tabbar" aria-label="Primary">
      {tabs.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className="mobile-tab" aria-current={active ? "page" : undefined}>
            {ICONS[t.icon]}
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
