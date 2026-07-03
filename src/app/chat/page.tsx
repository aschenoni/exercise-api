import type { Metadata } from "next";
import { SiteHeader, SiteFooter } from "@/components/chrome";
import { ChatUI } from "@/components/chat-ui";

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
        <p className="section-lede">
          Answers come from the dataset, not the internet. Missing an exercise? The
          assistant will point you to{" "}
          <code className="inline-code">POST /v1/suggestions</code>. Tightly
          rate-limited — this is a demo surface, not a coaching product.
        </p>
        <ChatUI />
      </main>
      <SiteFooter />
    </>
  );
}
