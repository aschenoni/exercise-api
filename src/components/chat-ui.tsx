"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

const SUGGESTED = [
  "What's the best chest exercise if I only have dumbbells?",
  "Explain SFR ratings",
  "Show me the front lever progression",
];

export function ChatUI() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: "/v1/chat" }),
  });
  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  return (
    <div className="chat-panel panel">
      <div className="chat-scroll">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>
              Ask about the catalog — exercises, SFR ratings, substitution groups,
              progressions, or how to query the API. Grounded in the dataset; it
              won&apos;t invent exercises.
            </p>
            <div className="chat-suggestions">
              {SUGGESTED.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`chat-msg chat-msg-${m.role}`}>
            <span className="chat-role">{m.role === "user" ? "you" : "api"}</span>
            <div className="chat-text">
              {m.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null,
              )}
            </div>
          </div>
        ))}
        {busy && messages[messages.length - 1]?.role === "user" && (
          <div className="chat-msg chat-msg-assistant">
            <span className="chat-role">api</span>
            <div className="chat-text chat-thinking">…</div>
          </div>
        )}
        {error && (
          <div className="chat-error">
            The assistant is unavailable right now (it may be rate-limited or not
            configured). The read API is unaffected.
          </div>
        )}
      </div>
      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="chat-input"
          value={input}
          placeholder="Ask the catalog…"
          maxLength={2000}
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <button type="submit" className="btn-hero chat-send" disabled={busy || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
