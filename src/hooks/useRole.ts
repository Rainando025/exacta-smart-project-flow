import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "gestor" | "colaborador";

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("colaborador");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setRole((data?.role as AppRole) || "colaborador");
        setLoading(false);
      });
  }, [user]);

  const isAdmin = role === "admin";
  const isGestor = role === "gestor" || role === "admin";
  const canManageTeam = isGestor;
  const canExportDashboard = isGestor;
  const canCreateProject = isGestor;
  const canDeleteAnything = isGestor; // "so gestor e admin que pode excluir"
  const canDeleteTask = (creatorId?: string) => isGestor || creatorId === user?.id;
  const canEditTask = (creatorId?: string, assigneeId?: string) =>
    isGestor || creatorId === user?.id || assigneeId === user?.id;

  return { role, loading, isAdmin, isGestor, canManageTeam, canExportDashboard, canCreateProject, canDeleteTask, canEditTask, canDeleteAnything };
}
