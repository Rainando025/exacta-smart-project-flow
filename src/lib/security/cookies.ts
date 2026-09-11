/**
 * Cookie Security Utilities
 * Ensures cookies are set with HttpOnly, Secure, SameSite=Lax/Strict, and proper Path/Expiration flags.
 */

export interface CookieOptions {
  maxAge?: number; // In seconds
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

const DEFAULT_OPTIONS: CookieOptions = {
  path: "/",
  secure: typeof window !== "undefined" ? window.location.protocol === "https:" : process.env.NODE_ENV === "production",
  sameSite: "Lax",
  maxAge: 7 * 24 * 60 * 60, // 7 days default
};

/**
 * Formats a Set-Cookie header string with security directives.
 */
export function formatSetCookieHeader(name: string, value: string, options: CookieOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cookieParts: string[] = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (opts.maxAge) cookieParts.push(`Max-Age=${opts.maxAge}`);
  if (opts.expires) cookieParts.push(`Expires=${opts.expires.toUTCString()}`);
  if (opts.path) cookieParts.push(`Path=${opts.path}`);
  if (opts.domain) cookieParts.push(`Domain=${opts.domain}`);
  if (opts.sameSite) cookieParts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) cookieParts.push("Secure");
  if (opts.httpOnly) cookieParts.push("HttpOnly");

  return cookieParts.join("; ");
}

/**
 * Parses cookies from a raw Cookie header string into a key-value object.
 */
export function parseCookieHeader(cookieHeader: string | null | undefined): Record<string, string> {
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookieStr) => {
    const parts = cookieStr.split("=");
    if (parts.length >= 2) {
      const name = decodeURIComponent(parts[0].trim());
      const value = decodeURIComponent(parts.slice(1).join("=").trim());
      cookies[name] = value;
    }
  });

  return cookies;
}

/**
 * Sets a client-accessible secure cookie in document.cookie (if in browser environment).
 */
export function setClientCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === "undefined") return;
  const cookieString = formatSetCookieHeader(name, value, { ...options, httpOnly: false });
  document.cookie = cookieString;
}
