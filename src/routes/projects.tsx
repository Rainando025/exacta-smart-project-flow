import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FolderKanban, Calendar, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/exacta";
import { toast } from "sonner";

const COLORS = ["#1e3a8a", "#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706"];

export const Route = createFileRoute("/projects")({
  component: () => <AppShell><ProjectsPage /></AppShell>,
});

function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", due_date: "", color: COLORS[0] });

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (data) setProjects(data);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim() || !user) return;
    const { error } = await supabase.from("projects").insert({
      name: form.name, description: form.description || null,
      due_date: form.due_date || null, color: form.color, owner_id: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Projeto criado");
    setOpen(false);
    setForm({ name: "", description: "", due_date: "", color: COLORS[0] });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este projeto e todas as tarefas?")) return;
    await supabase.from("projects").delete().eq("id", id);
    load();
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Projetos</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Central de projetos</h1>
          <p className="text-muted-foreground mt-2">Acompanhe iniciativas, prazos e progresso.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-primary text-primary-foreground shadow-elegant"><Plus className="h-4 w-4" /> Novo projeto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo projeto</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Prazo</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`h-8 w-8 rounded-lg border-2 ${form.color === c ? "border-foreground scale-110" : "border-transparent"} transition`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter><Button onClick={create} className="bg-gradient-primary text-primary-foreground">Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 && (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed">
            <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Nenhum projeto ainda. Crie o primeiro!
          </Card>
        )}
        {projects.map((p) => (
          <Card key={p.id} className="p-5 shadow-card hover:shadow-elegant transition group relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: p.color }} />
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: p.color }}>
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <button onClick={() => remove(p.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <h3 className="font-display font-bold text-lg">{p.name}</h3>
            {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progresso</span><span className="font-semibold">{p.progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-accent" style={{ width: `${p.progress}%` }} />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <Calendar className="h-3 w-3" /> {formatDate(p.due_date)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
