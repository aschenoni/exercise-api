/** Canonical public origin — used in copyable snippets and OG metadata. */
export const SITE_URL = "https://exercise-api.com";

/**
 * Chat kill switch (decided 2026-07-03: off until AI Gateway billing is set
 * up). Gates the endpoint, the /chat page, the header link, and every doc
 * surface together so they can't disagree. Re-enable: CHAT_ENABLED=true.
 * A function (not a module const) so it reads env at call time.
 */
export function isChatEnabled(): boolean {
  return process.env.CHAT_ENABLED === "true";
}
