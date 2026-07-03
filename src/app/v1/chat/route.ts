import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { DATASET_VERSION, getMeta } from "@/lib/dataset";
import { isChatEnabled } from "@/lib/site";
import { retrieveContext } from "@/lib/retrieval";
import { bumpDailyCounter } from "@/lib/ratelimit";
import { errorResponse, handleOptions } from "@/lib/http";

/**
 * Catalog-grounded assistant (PRODUCT.md §6.4). Keyless but tightly limited:
 * per-IP buckets live in middleware; a global daily message cap bounds spend.
 * Degrades to 503 when no AI Gateway credentials are available so the rest
 * of the API runs key-free.
 */

// Model via Vercel AI Gateway (the AI SDK's default global provider).
const CHAT_MODEL = process.env.CHAT_MODEL ?? "anthropic/claude-haiku-4.5";
const GLOBAL_DAILY_CAP = Number(process.env.CHAT_GLOBAL_DAILY_CAP ?? 300);
const MAX_MESSAGE_CHARS = 2000;

function hasGatewayCredentials(): boolean {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY ??
      process.env.VERCEL_OIDC_TOKEN ??
      process.env.VERCEL,
  );
}

function systemPrompt(userQuery: string): string {
  const meta = getMeta();
  const context = retrieveContext(userQuery);
  return `You are the ExerciseAPI assistant on exercise-api.com — a free, public REST API
serving a hand-curated, hypertrophy-focused exercise catalog (dataset v${DATASET_VERSION},
${meta.counts.total} exercises: ${meta.counts.by_tier.core} core / ${meta.counts.by_tier.extended} extended).

Ground rules:
- Answer ONLY from the catalog data provided below and general knowledge of how to
  query the API. Never invent exercises, fields, or values that are not in the catalog.
- If the user asks about an exercise or data the catalog doesn't have, say so plainly
  and point them to POST /v1/suggestions (or the docs at /docs) to suggest it.
- When referencing exercises, use their exact id slugs so answers are copy-paste
  queryable (e.g. /v1/exercises/barbell_bench_press).
- Questions about the API itself: endpoints are GET /v1/exercises (filters like muscle,
  pattern, equipment, available_equipment subset match, modality, sfr_class),
  GET /v1/exercises/{id}, GET /v1/meta; docs at /docs; OpenAPI at /openapi.json.
- Be concise. Plain text or minimal markdown. You are not a personal trainer — you can
  explain what the data says (SFR ratings, substitution groups, progressions, cues) but
  do not prescribe medical or individualized training advice.

Catalog records most relevant to the user's message (JSON, may be empty):
${JSON.stringify(context)}`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isChatEnabled()) {
    return errorResponse(
      "service_unavailable",
      "Chat is currently disabled. The read API and POST /v1/suggestions are unaffected — see /docs.",
    );
  }
  if (!hasGatewayCredentials()) {
    return errorResponse(
      "service_unavailable",
      "Chat is not configured on this deployment. Everything else works key-free — see /docs.",
    );
  }

  let messages: UIMessage[];
  try {
    const body = (await request.json()) as { messages?: UIMessage[] };
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return errorResponse("invalid_parameter", `Body must be { messages: UIMessage[] }.`);
    }
    // Sanitize untrusted history: the client controls this array wholesale, so
    // (a) only user/assistant roles survive — no injected system/tool turns,
    // (b) only text parts survive, (c) every message is length-capped so a fat
    // history can't inflate input-token spend, (d) at most the last 10 turns.
    messages = body.messages
      .filter((m) => m?.role === "user" || m?.role === "assistant")
      .map((m, i) => ({
        id: typeof m.id === "string" ? m.id.slice(0, 64) : String(i),
        role: m.role,
        parts: (Array.isArray(m.parts) ? m.parts : [])
          .filter(
            (p): p is { type: "text"; text: string } =>
              p?.type === "text" && typeof (p as { text?: unknown }).text === "string",
          )
          .map((p) => ({ type: "text" as const, text: p.text.slice(0, MAX_MESSAGE_CHARS) })),
      }))
      .filter((m) => m.parts.length > 0)
      .slice(-10);
  } catch {
    return errorResponse("invalid_parameter", "Body must be valid JSON.");
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const userText = (lastUser?.parts ?? [])
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .slice(0, MAX_MESSAGE_CHARS);
  if (!userText.trim()) {
    return errorResponse("invalid_parameter", "The last user message has no text.");
  }

  // Spend cap fails CLOSED: if the counter store is unreachable we cannot
  // meter the shared budget, so paid inference is refused (the read API is
  // untouched — only chat degrades).
  const used = await bumpDailyCounter("chat");
  if (used === null) {
    return errorResponse(
      "service_unavailable",
      "The assistant is temporarily unavailable. The read API is unaffected.",
    );
  }
  if (used > GLOBAL_DAILY_CAP) {
    return errorResponse(
      "rate_limited",
      "The chat's shared daily budget is exhausted. It resets at UTC midnight — the read API is unaffected.",
    );
  }

  try {
    const result = streamText({
      model: CHAT_MODEL,
      system: systemPrompt(userText),
      messages: await convertToModelMessages(messages),
      maxOutputTokens: 600,
    });
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch {
    return errorResponse(
      "service_unavailable",
      "The assistant is temporarily unavailable. The read API is unaffected.",
    );
  }
}

export const OPTIONS = handleOptions;
