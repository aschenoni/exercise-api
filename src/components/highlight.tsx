import type { ReactNode } from "react";

/**
 * Build-time syntax highlighting — the design treats JSON response blocks as
 * "the hero image of the page" (spec §5), so tokens get the full brand palette.
 * Server-only: emits plain spans, no client JS.
 */

export function JsonView({ value }: { value: unknown }) {
  const out: ReactNode[] = [];
  let k = 0;
  const push = (text: string, cls: string) =>
    out.push(
      <span key={k++} className={cls}>
        {text}
      </span>,
    );
  const walk = (v: unknown, indent: number): void => {
    const pad = "  ".repeat(indent);
    const padIn = "  ".repeat(indent + 1);
    if (Array.isArray(v)) {
      if (v.length === 0) {
        push("[]", "tok-punc");
        return;
      }
      push("[", "tok-punc");
      v.forEach((item, i) => {
        push(`\n${padIn}`, "tok-punc");
        walk(item, indent + 1);
        if (i < v.length - 1) push(",", "tok-punc");
      });
      push(`\n${pad}]`, "tok-punc");
    } else if (v !== null && typeof v === "object") {
      const keys = Object.keys(v);
      push("{", "tok-punc");
      keys.forEach((key, i) => {
        push(`\n${padIn}`, "tok-punc");
        push(`"${key}"`, "tok-key");
        push(": ", "tok-punc");
        walk((v as Record<string, unknown>)[key], indent + 1);
        if (i < keys.length - 1) push(",", "tok-punc");
      });
      push(`\n${pad}}`, "tok-punc");
    } else if (typeof v === "string") push(`"${v}"`, "tok-str");
    else if (typeof v === "number") push(String(v), "tok-num");
    else if (typeof v === "boolean") push(String(v), "tok-bool");
    else push("null", "tok-null");
  };
  walk(value, 0);
  return <code style={{ whiteSpace: "pre", display: "block" }}>{out}</code>;
}

const KEYWORDS =
  /^(const|let|var|await|async|new|import|from|print|def|return|for|in|require|None|True|False)$/;

export function CodeView({ code }: { code: string }) {
  const out: ReactNode[] = [];
  let k = 0;
  const push = (text: string, cls?: string) =>
    out.push(
      cls ? (
        <span key={k++} className={cls}>
          {text}
        </span>
      ) : (
        <span key={k++}>{text}</span>
      ),
    );
  const lines = code.split("\n");
  lines.forEach((line, li) => {
    const commentMatch = line.match(/(^|\s)(\/\/|#).*/);
    let body = line;
    let comment = "";
    if (commentMatch) {
      const idx = line.indexOf(commentMatch[0]);
      body = line.slice(0, idx);
      comment = line.slice(idx);
    }
    const re = /("[^"]*"|'[^']*'|[A-Za-z_$][A-Za-z0-9_$]*|\d+|[^A-Za-z0-9_$"']+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
      const t = m[0];
      if (/^["']/.test(t)) push(t, "tok-str");
      else if (KEYWORDS.test(t)) push(t, "tok-kw");
      else if (/^\d+$/.test(t)) push(t, "tok-num");
      else if (/^[A-Za-z_$]/.test(t)) push(t, "tok-ident");
      else push(t, "tok-punc");
    }
    if (comment) push(comment, "tok-comment");
    if (li < lines.length - 1) push("\n");
  });
  return <code style={{ whiteSpace: "pre", display: "block" }}>{out}</code>;
}
