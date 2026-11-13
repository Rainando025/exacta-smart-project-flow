import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { canSeeProject } from "@/lib/team-scope";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status?: string;
  progress?: number;
  due_date?: string | null;
  owner_id?: string;
  department_id?: string | null;
  shared_department_ids?: string[] | null;
  created_at?: string;
}

interface ProjectContextType {
  selectedProjectId: string; // "all" or project ID
  setSelectedProjectId: (id: string) => void;
  selectedProject: Project | null;
  projects: Project[];
  loading: boolean;
  reloadProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("exacta_active_project_id") || "all";
    }
    return "all";
  });

  const reloadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    try {
      const [{ data: projData }, { data: profData }] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, description, color, status, progress, due_date, owner_id, department_id, shared_department_ids, created_at")
          .order("name"),
        supabase.from("profiles").select("id, department_id"),
      ]);
      if (projData) {
        const deptByUser = new Map<string, string | null>(
          (profData || []).map((p: any) => [p.id, p.department_id ?? null])
        );
        const myDeptId = deptByUser.get(user.id) ?? null;
        const visible = (projData as any[]).filter((p) =>
          canSeeProject(p, user.id, myDeptId, deptByUser)
        );
        setProjects(visible as Project[]);
      }
    } catch (err) {
      console.error("Error loading projects context:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    reloadProjects();
  }, [reloadProjects]);

  const setSelectedProjectId = useCallback((id: string) => {
    setSelectedProjectIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("exacta_active_project_id", id);
    }
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        selectedProjectId,
        setSelectedProjectId,
        selectedProject,
        projects,
        loading,
        reloadProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
