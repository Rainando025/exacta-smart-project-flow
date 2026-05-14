import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Filter, Network, BrainCircuit, PenSquare, Calendar as CalendarIcon } from "lucide-react";
import { NeuralMap } from "@/components/NeuralMap";
import { CalendarScheduler } from "@/components/CalendarScheduler";
import { useRole } from "@/hooks/useRole";

export const Route = createFileRoute("/team")({
  component: () => <AppShell><TeamPage /></AppShell>,
});

function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [skills, setSkills] = useState<Record<string, { soft: string[], hard: string[] }>>({
    "1": { soft: ["Comunicação", "Liderança"], hard: ["React", "TypeScript"] }
  }); // Mock initial state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const { isAdmin, isGestor } = useRole();
  const canEditSkills = isAdmin || isGestor;

  const [editSkillsModal, setEditSkillsModal] = useState<string | null>(null);
  const [tempSoft, setTempSoft] = useState("");
  const [tempHard, setTempHard] = useState("");

  const handleSaveSkills = () => {
    if (!editSkillsModal) return;
    setSkills({
      ...skills,
      [editSkillsModal]: {
        soft: tempSoft.split(",").map(s => s.trim()).filter(Boolean),
        hard: tempHard.split(",").map(s => s.trim()).filter(Boolean)
      }
    });
    setEditSkillsModal(null);
  };

  useEffect(() => {
    (async () => {
      const [p, t, r] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("tasks").select("assignee_id,status"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (p.data) setMembers(p.data);
      if (t.data) setTasks(t.data);
      if (r.data) setRoles(Object.fromEntries(r.data.map((x) => [x.user_id, x.role])));
    })();
  }, []);

  const filtered = members.filter((m) => {
    const role = roles[m.id] || "colaborador";
    if (roleFilter !== "all" && role !== roleFilter) return false;
    if (search.trim() && !(m.full_name || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Equipe</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Colaboração e Membros</h1>
        <p className="text-muted-foreground mt-2">Veja quem está fazendo o quê e conecte ideias em equipe.</p>
      </header>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-6 bg-card/50 border border-white/5 p-1 rounded-xl">
          <TabsTrigger value="members" className="rounded-lg">Membros da Equipe</TabsTrigger>
          <TabsTrigger value="ideas" className="rounded-lg gap-2"><Network className="h-4 w-4" /> Ideias (Mapa Neural)</TabsTrigger>
          <TabsTrigger value="calendar" className="rounded-lg gap-2"><CalendarIcon className="h-4 w-4" /> Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6 animate-in fade-in duration-500">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar membro…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos cargos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="gestor">Gestor</SelectItem>
                <SelectItem value="colaborador">Colaborador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed">
            Nenhum membro encontrado.
          </Card>
        )}
        {filtered.map((m) => {
          const mine = tasks.filter((t) => t.assignee_id === m.id);
          const done = mine.filter((t) => t.status === "done").length;
          const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
          return (
            <Card key={m.id} className="p-5 shadow-card hover:shadow-elegant transition">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold text-lg">
                  {(m.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold truncate">{m.full_name || "Sem nome"}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{roles[m.id] || "colaborador"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Conclusão</span>
                  <span className="font-bold">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>{done} concluídas</span>
                  <span>{mine.length} totais</span>
                </div>
              </div>

              {/* Skills Section */}
              <div className="mt-4 pt-4 border-t border-white/5 relative">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                    <BrainCircuit className="h-3 w-3" /> Competências
                  </span>
                  {canEditSkills && (
                    <button onClick={() => {
                       const mSkills = skills[m.id] || { soft: [], hard: [] };
                       setTempSoft(mSkills.soft.join(", "));
                       setTempHard(mSkills.hard.join(", "));
                       setEditSkillsModal(m.id);
                    }} className="text-accent hover:text-accent/80 p-1">
                      <PenSquare className="h-3 w-3" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Hard Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {(skills[m.id]?.hard || ["Nenhuma cadastrada"]).map((s, i) => (
                        <span key={i} className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block mb-1">Soft Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {(skills[m.id]?.soft || ["Nenhuma cadastrada"]).map((s, i) => (
                        <span key={i} className="text-[9px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded border border-purple-500/20">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
          </div>
        </TabsContent>

        <TabsContent value="ideas" className="animate-in fade-in duration-500">
          <NeuralMap />
        </TabsContent>

        <TabsContent value="calendar" className="animate-in fade-in duration-500">
          <CalendarScheduler isTeam={true} />
        </TabsContent>
      </Tabs>

      {/* Edit Skills Modal */}
      <Dialog open={!!editSkillsModal} onOpenChange={(v) => !v && setEditSkillsModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Competências</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hard Skills (separadas por vírgula)</Label>
              <Input value={tempHard} onChange={e => setTempHard(e.target.value)} placeholder="Ex: React, Node, Python" />
            </div>
            <div className="space-y-2">
              <Label>Soft Skills (separadas por vírgula)</Label>
              <Input value={tempSoft} onChange={e => setTempSoft(e.target.value)} placeholder="Ex: Comunicação, Liderança" />
            </div>
            <Button onClick={handleSaveSkills} className="w-full bg-gradient-primary">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
