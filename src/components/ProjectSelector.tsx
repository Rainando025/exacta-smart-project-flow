import { useProject } from "@/contexts/ProjectContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Layers, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  className?: string;
  size?: "sm" | "default";
}

export function ProjectSelector({ className, size = "sm" }: ProjectSelectorProps) {
  const { selectedProjectId, setSelectedProjectId, projects, selectedProject } = useProject();

  return (
    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
      <SelectTrigger
        className={cn(
          "h-8 gap-2 bg-card/60 border-accent/20 hover:border-accent/50 text-xs font-semibold shadow-sm transition-all rounded-lg",
          size === "sm" ? "w-[180px] lg:w-[220px]" : "w-[240px]",
          className
        )}
      >
        <div className="flex items-center gap-1.5 truncate">
          {selectedProject ? (
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: selectedProject.color || "#6366f1" }}
            />
          ) : (
            <FolderOpen className="h-3.5 w-3.5 text-accent shrink-0" />
          )}
          <span className="truncate">
            {selectedProject ? selectedProject.name : "Todos os Projetos"}
          </span>
        </div>
      </SelectTrigger>
      <SelectContent align="start" className="w-[240px] p-1 shadow-xl border-accent/20">
        <SelectItem value="all" className="cursor-pointer text-xs font-semibold py-2">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Todos os Projetos</span>
          </div>
        </SelectItem>
        {projects.length > 0 && <div className="h-px bg-border my-1" />}
        {projects.map((p) => (
          <SelectItem key={p.id} value={p.id} className="cursor-pointer text-xs py-2">
            <div className="flex items-center gap-2 truncate">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.color || "#6366f1" }}
              />
              <span className="truncate font-medium">{p.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
