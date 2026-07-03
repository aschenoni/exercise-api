import Link from "next/link";
import { useId } from "react";
import { DATASET_VERSION } from "@/lib/dataset";

/**
 * The "Route slash" brand mark (Claude Design, 2026-07-03) — peach rounded
 * square with a diagonal slash cut out. Bare version per the wordmark lockup;
 * the tiled version lives in src/app/icon.svg. Mask id is unique per instance
 * so header + footer can coexist.
 */
export function BrandMark({ size = 26 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <mask id={id}>
        <rect x="7" y="7" width="18" height="18" rx="4.2" fill="#fff" />
        <rect
          x="13.6"
          y="-2"
          width="4.8"
          height="36"
          rx="2.4"
          transform="rotate(45 16 16)"
          fill="#000"
        />
      </mask>
      <rect x="7" y="7" width="18" height="18" rx="4.2" fill="#f5a97f" mask={`url(#${id})`} />
    </svg>
  );
}

// Env-gated (PRODUCT.md §6.5): coffee links render only when configured.
const COFFEE_URL = process.env.NEXT_PUBLIC_COFFEE_URL;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          <BrandMark size={28} />
          exerciseapi<span className="brand-suffix">/v1</span>
        </Link>
        <nav className="site-nav">
          <a href="/docs" className="hide-mobile">
            Docs
          </a>
          <a href="/openapi.json" className="hide-mobile">
            OpenAPI
          </a>
          {COFFEE_URL && (
            <a href={COFFEE_URL} className="hide-mobile" rel="noopener">
              ☕ Coffee
            </a>
          )}
          <a href="/docs" className="btn-primary">
            Read the docs
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand" style={{ marginBottom: 12 }}>
            <BrandMark size={28} />
            exerciseapi
          </div>
          <p className="footer-blurb">
            The OpenWeather of exercises. A small, opinionated, hand-curated catalog API.
          </p>
        </div>
        <div>
          <div className="footer-col-label">API</div>
          <div className="footer-links">
            <a href="/docs">Docs</a>
            <a href="/openapi.json">OpenAPI 3.1</a>
            <a href="/v1/meta">Meta &amp; vocabularies</a>
          </div>
        </div>
        <div>
          <div className="footer-col-label">DATA</div>
          <div className="footer-links">
            <span className="soon">Suggest an exercise (soon)</span>
            <a href="https://github.com/aschenoni/exercise-api" rel="noopener">
              GitHub
            </a>
            <a
              href="https://github.com/aschenoni/exercise-api/releases"
              rel="noopener"
            >
              Dataset snapshots
            </a>
          </div>
        </div>
        <div>
          <div className="footer-col-label">SUPPORT</div>
          <div className="footer-links">
            <a href="/health">Status</a>
            {COFFEE_URL && (
              <a href={COFFEE_URL} rel="noopener">
                ☕ Buy me a coffee
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="footer-legal">
        <div className="container footer-legal-inner">
          <span>Data CC BY 4.0 · Code MIT</span>
          <span>
            dataset v{DATASET_VERSION} · api v1
          </span>
        </div>
      </div>
    </footer>
  );
}
