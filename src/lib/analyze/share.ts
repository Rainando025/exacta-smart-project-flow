import type { ViewState } from "./types";

/** Codifica/decodifica o estado da visão no hash da URL (unicode-safe). */
export function encodeState(state: ViewState): string {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState(token: string): ViewState | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as ViewState;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...(parsed.pageName ? { pageName: parsed.pageName } : {}),
      hiddenCols: Array.isArray(parsed.hiddenCols) ? parsed.hiddenCols : [],
      filters: parsed.filters ?? {},
      cross: parsed.cross ?? null,
      orientation: parsed.orientation === "portrait" ? "portrait" : "landscape",
    };

  } catch {
    return null;
  }
}

export function buildShareUrl(state: ViewState): string {
  const url = new URL(window.location.href);
  url.hash = `v=${encodeState(state)}`;
  return url.toString();
}

export function readStateFromUrl(): ViewState | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const token = new URLSearchParams(hash).get("v");
  return token ? decodeState(token) : null;
}
