import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status?: string;
  progress?: number;
  due_date?: string | null;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("exacta_active_project_id") || "all";
    }
    return "all";
  });

  const reloadProjects = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("projects")
        .select("id, name, description, color, status, progress, due_date, created_at")
        .order("name");
      if (data) {
        setProjects(data as Project[]);
      }
    } catch (err) {
      console.error("Error loading projects context:", err);
    } finally {
      setLoading(false);
    }
  }, []);

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
