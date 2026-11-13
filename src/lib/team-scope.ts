import { supabase } from "@/integrations/supabase/client";

export interface TeamScope {
  myDeptId: string | null;
  deptByUser: Map<string, string | null>;
  deptMemberIds: string[];
  visibleProjectIds: Set<string>;
}

export function canSeeProject(
  project: { owner_id?: string | null; department_id?: string | null; shared_department_ids?: string[] | null },
  userId: string,
  myDeptId: string | null,
  deptByUser: Map<string, string | null>
): boolean {
  if (project.owner_id === userId) return true;
  if (!myDeptId) return false;
  const projDept = project.department_id ?? (project.owner_id ? deptByUser.get(project.owner_id) ?? null : null);
  if (projDept === myDeptId) return true;
  if (Array.isArray(project.shared_department_ids) && project.shared_department_ids.includes(myDeptId)) {
    return true;
  }
  return false;
}

export function canSeeTeamTask(
  task: { creator_id?: string | null; assignee_id?: string | null; project_id?: string | null },
  userId: string,
  scope: TeamScope
): boolean {
  if (task.creator_id === userId || task.assignee_id === userId) return true;
  if (scope.myDeptId) {
    if (task.creator_id && scope.deptByUser.get(task.creator_id) === scope.myDeptId) return true;
    if (task.assignee_id && scope.deptByUser.get(task.assignee_id) === scope.myDeptId) return true;
  }
  if (task.project_id && scope.visibleProjectIds.has(task.project_id)) return true;
  return false;
}

export async function fetchTeamScope(userId: string): Promise<TeamScope> {
  const [{ data: profiles }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("id, department_id"),
    supabase.from("projects").select("id, owner_id, department_id, shared_department_ids"),
  ]);

  const deptByUser = new Map<string, string | null>(
    (profiles || []).map((p: any) => [p.id, p.department_id ?? null])
  );
  const myDeptId = deptByUser.get(userId) ?? null;

  const deptMemberIds = myDeptId
    ? (profiles || []).filter((p: any) => p.department_id === myDeptId).map((p: any) => p.id)
    : [];

  const visibleProjectIds = new Set<string>(
    (projects || [])
      .filter((p: any) => canSeeProject(p, userId, myDeptId, deptByUser))
      .map((p: any) => p.id)
  );

  return { myDeptId, deptByUser, deptMemberIds, visibleProjectIds };
}

