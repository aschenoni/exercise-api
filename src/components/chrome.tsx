import Link from "next/link";
import { DATASET_VERSION } from "@/lib/dataset";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-dot" />
          exerciseapi<span className="brand-suffix">/v1</span>
        </Link>
        <nav className="site-nav">
          <a href="/docs" className="hide-mobile">
            Docs
          </a>
          <a href="/openapi.json" className="hide-mobile">
            OpenAPI
          </a>
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
            <span className="brand-dot" />
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
            <span className="soon">GitHub (soon)</span>
          </div>
        </div>
        <div>
          <div className="footer-col-label">SUPPORT</div>
          <div className="footer-links">
            <a href="/health">Status</a>
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
