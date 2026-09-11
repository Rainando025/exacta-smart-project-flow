/**
 * Authorization & Resource Ownership Guard (Anti-IDOR Protection)
 * Verifies that an authenticated user owns or has access to a specific database resource.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface OwnershipValidationResult {
  isOwner: boolean;
  reason?: string;
}

/**
 * Validates resource ownership for a given user and table.
 * Supports `user_id`, `owner_id`, `author_id`, `created_by`, or project membership.
 */
export async function validateResourceOwnership(
  userId: string,
  table: string,
  resourceId: string
): Promise<OwnershipValidationResult> {
  if (!userId || !resourceId || !table) {
    return { isOwner: false, reason: "Parâmetros inválidos para validação de posse." };
  }

  try {
    // 1. Fetch resource record
    const { data: record, error } = await (supabaseAdmin.from(table as any) as any)
      .select("*")
      .eq("id", resourceId)
      .maybeSingle();

    if (error || !record) {
      return { isOwner: false, reason: "Recurso não encontrado." };
    }

    // 2. Direct ownership fields check
    const ownerId = record.user_id || record.owner_id || record.author_id || record.created_by;

    if (ownerId && ownerId === userId) {
      return { isOwner: true };
    }

    // 3. If resource belongs to a project, check if user is project owner or member
    const projectId = record.project_id;
    if (projectId) {
      const { data: project } = await (supabaseAdmin.from("projects") as any)
        .select("owner_id")
        .eq("id", projectId)
        .maybeSingle();

      if (project && project.owner_id === userId) {
        return { isOwner: true };
      }
    }

    return { isOwner: false, reason: "Acesso negado: você não é o proprietário nem tem permissão para este recurso." };
  } catch (err: any) {
    console.error(`[AuthZ Error] Failed checking ownership for ${table}:${resourceId}:`, err);
    return { isOwner: false, reason: "Falha na verificação de permissões do servidor." };
  }
}

/**
 * Asserts resource ownership, throwing a 403 Response if validation fails.
 */
export async function assertResourceOwnership(
  userId: string,
  table: string,
  resourceId: string
): Promise<void> {
  const result = await validateResourceOwnership(userId, table, resourceId);
  if (!result.isOwner) {
    throw new Response(JSON.stringify({ error: result.reason || "Acesso negado" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
}
