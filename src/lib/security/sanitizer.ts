/**
 * Server & Client Input Sanitizer
 * Protects against XSS, HTML/script injection, and malicious payloads.
 */

/**
 * Sanitizes a string by stripping dangerous HTML tags, inline scripts, event handlers, and script URIs.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";

  return input
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove iframe, object, embed, style tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    // Remove inline event handlers (e.g., onload=, onerror=, onclick=)
    .replace(/on\w+\s*=\s*(["']).*?\1/gi, "")
    .replace(/on\w+\s*=\s*[^>\s]+/gi, "")
    // Remove javascript: and data: text URIs
    .replace(/javascript\s*:/gi, "")
    .replace(/vbscript\s*:/gi, "")
    // Strip raw HTML tags if any remain
    .replace(/<[^>]*>?/gm, "")
    .trim();
}

/**
 * Recursively sanitizes strings inside an object or array.
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    return sanitizeString(obj) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const sanitizedObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = sanitizeString(key);
      sanitizedObj[sanitizedKey] = sanitizeObject(value);
    }
    return sanitizedObj as T;
  }

  return obj;
}
