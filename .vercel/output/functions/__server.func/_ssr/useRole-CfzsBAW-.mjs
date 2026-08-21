import { S as reactExports } from "./index.mjs";
import { ak as useAuth, ai as supabase } from "./router-Bktayy9l.mjs";
function useRole() {
  const { user } = useAuth();
  const [role, setRole] = reactExports.useState("colaborador");
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setRole(data?.role || "colaborador");
      setLoading(false);
    });
  }, [user]);
  const isAdmin = role === "admin";
  const isGestor = role === "gestor" || role === "admin";
  const canManageTeam = isGestor;
  const canExportDashboard = isGestor;
  const canCreateProject = isGestor;
  const canDeleteAnything = isGestor;
  const canDeleteTask = (creatorId) => isGestor || creatorId === user?.id;
  const canEditTask = (creatorId, assigneeId) => isGestor || creatorId === user?.id || assigneeId === user?.id;
  return { role, loading, isAdmin, isGestor, canManageTeam, canExportDashboard, canCreateProject, canDeleteTask, canEditTask, canDeleteAnything };
}
export {
  useRole as u
};
