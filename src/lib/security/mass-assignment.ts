/**
 * Mass Assignment Protection Helper
 * Prevents unauthorized property injection (such as `role`, `is_admin`, `owner_id`, `created_at`)
 * by filtering payload keys against a strict whitelist.
 */

import { z } from "zod";

/**
 * List of sensitive fields that should never be set directly via standard client updates/creates.
 */
export const RESTRICTED_FIELDS = [
  "role",
  "roles",
  "is_admin",
  "admin",
  "owner_id",
  "user_id",
  "author_id",
  "created_at",
  "updated_at",
  "id",
  "token",
] as const;

/**
 * Filters an input object, keeping only allowed fields specified in the whitelist.
 */
export function filterAllowedFields<T extends Record<string, any>>(
  payload: Record<string, any>,
  allowedFields: (keyof T | string)[]
): Partial<T> {
  if (!payload || typeof payload !== "object") return {};

  const cleanPayload: Record<string, any> = {};
  const allowedSet = new Set(allowedFields.map(String));

  for (const [key, value] of Object.entries(payload)) {
    // Explicitly reject restricted fields unless explicitly listed in allowedFields AND not in RESTRICTED_FIELDS
    if (allowedSet.has(key) && !RESTRICTED_FIELDS.includes(key as any)) {
      cleanPayload[key] = value;
    }
  }

  return cleanPayload as Partial<T>;
}

/**
 * Creates a strict Zod schema that rejects unexpected extra keys (mass assignment attempt).
 */
export function strictSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).strict();
}
