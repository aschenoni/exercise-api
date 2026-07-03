import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { ChatUI } from "@/components/chat-ui";
import { isChatEnabled } from "@/lib/site";

export const metadata: Metadata = {
  title: "Chat — ExerciseAPI",
  description:
    "Ask the ExerciseAPI catalog assistant about exercises, SFR ratings, substitution groups, progressions, and how to query the API.",
};

export default function ChatPage() {
  return (
    <>
      <SiteHeader />
      <main className="container docs-main" style={{ maxWidth: 760 }}>
        <div className="eyebrow">CHAT · CATALOG-GROUNDED</div>
        <h1 className="h2" style={{ fontSize: 34 }}>
          Ask the catalog
        </h1>
        {isChatEnabled() ? (
          <>
            <p className="section-lede">
              Answers come from the dataset, not the internet. Missing an exercise? The
              assistant will point you to{" "}
              <code className="inline-code">POST /v1/suggestions</code>. Tightly
              rate-limited — this is a demo surface, not a coaching product.
            </p>
            <ChatUI />
          </>
        ) : (
          <p className="section-lede">
            The chat assistant is switched off for now. Everything else works —
            browse the <a href="/docs" style={{ color: "var(--accent)" }}>docs</a>,
            query the API key-free, or submit ideas via{" "}
            <code className="inline-code">POST /v1/suggestions</code>.
          </p>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
