import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Plus, FolderKanban, Calendar, Trash2, Pencil, Filter, Paperclip, FileDown } from "lucide-react";
import { formatDate } from "@/lib/exacta";
import { toast } from "sonner";
import { addBrandedHeader, addBrandedFooter } from "@/lib/pdf";
import { AttachmentsPanel } from "@/components/AttachmentsPanel";

const COLORS = ["#1e3a8a", "#0891b2", "#7c3aed", "#059669", "#dc2626", "#d97706"];
const STATUSES = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "concluido", label: "Concluído" },
];

export const Route = createFileRoute("/projects")({
  component: () => <AppShell><ProjectsPage /></AppShell>,
});

function ProjectsPage() {
  const { user } = useAuth();
  const { isAdmin, canCreateProject } = useRole();
  const [projects, setProjects] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [filesProject, setFilesProject] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ name: "", description: "", due_date: "", color: COLORS[0] });

  const load = async () => {
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (data) setProjects(data);
  };
  useEffect(() => { load(); }, []);

  const [creating, setCreating] = useState(false);
  const create = async () => {
    if (!form.name.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from("projects").insert({
      name: form.name, description: form.description || null,
      due_date: form.due_date || null, color: form.color, owner_id: user.id,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Projeto criado");
    setOpen(false);
    setForm({ name: "", description: "", due_date: "", color: COLORS[0] });
    load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    const { error } = await supabase.from("projects").update({
      name: editing.name,
      description: editing.description || null,
      due_date: editing.due_date || null,
      color: editing.color,
      status: editing.status,
      progress: editing.progress,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Projeto atualizado");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este projeto?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Projeto excluído");
    load();
  };

  const exportProjectPDF = async (project: any) => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    let y = await addBrandedHeader(
      doc, 
      "Relatório de Projeto", 
      `Projeto: ${project.name}`, 
      `Data: ${new Date().toLocaleDateString("pt-BR")}`
    );
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.text("Informações Gerais", 14, y);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Campo", "Valor"]],
      body: [
        ["Nome", project.name],
        ["Status", project.status.toUpperCase()],
        ["Progresso", `${project.progress}%`],
        ["Prazo", project.due_date ? new Date(project.due_date).toLocaleDateString("pt-BR") : "Sem prazo"],
        ["Proprietário", project.owner_id === user?.id ? "Você" : "Outro"],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    if (project.description) {
      doc.setFontSize(14);
      doc.text("Descrição", 14, y);
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const splitDesc = doc.splitTextToSize(project.description, pw - 28);
      doc.text(splitDesc, 14, y);
      y += splitDesc.length * 5 + 10;
    }

    // Task Summary
    const { data: projectTasks } = await supabase.from("tasks").select("*").eq("project_id", project.id);
    if (projectTasks && projectTasks.length > 0) {
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(14);
      doc.text("Tarefas Associadas", 14, y);
      y += 8;
      
      autoTable(doc, {
        startY: y,
        head: [["Tarefa", "Prioridade", "Status", "Prazo"]],
        body: projectTasks.map((t: any) => [
          t.title,
          t.priority.toUpperCase(),
          t.status.toUpperCase(),
          t.due_date ? new Date(t.due_date).toLocaleDateString("pt-BR") : "-"
        ]),
        theme: "striped",
        headStyles: { fillColor: [8, 145, 178] },
      });
    }

    addBrandedFooter(doc);

    doc.save(`exacta-projeto-${project.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
    toast.success("PDF gerado!");
  };

  const filtered = projects.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Projetos</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Central de projetos</h1>
          <p className="text-muted-foreground mt-2">Acompanhe iniciativas, prazos e progresso.</p>
        </div>
        {canCreateProject && (
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
              <DialogFooter>
                <Button onClick={create} disabled={creating} className="bg-gradient-primary text-primary-foreground">
                  {creating ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar projeto…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <Card className="col-span-full p-12 text-center text-muted-foreground border-dashed">
            <FolderKanban className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Nenhum projeto encontrado.
          </Card>
        )}
        {filtered.map((p) => (
          <Card key={p.id} className="p-5 shadow-card hover:shadow-elegant transition relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: p.color }} />
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: p.color }}>
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setFilesProject(p)} aria-label="Arquivos" className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button onClick={() => exportProjectPDF(p)} aria-label="Relatório PDF" className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition">
                  <FileDown className="h-4 w-4" />
                </button>
                {(isAdmin || p.owner_id === user?.id) && (
                  <>
                    <button onClick={() => setEditing({ ...p, due_date: p.due_date || "" })} aria-label="Editar" className="p-1.5 rounded text-muted-foreground hover:text-accent hover:bg-muted transition">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => remove(p.id)} aria-label="Excluir" className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-muted transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <h3 className="font-display font-bold text-lg">{p.name}</h3>
            {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{p.description}</p>}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="capitalize">{p.status}</span><span className="font-semibold">{p.progress}%</span>
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

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar projeto</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Prazo</Label><Input type="date" value={editing.due_date ? editing.due_date.slice(0, 10) : ""} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} /></div>
                <div>
                  <Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2"><Label>Progresso</Label><span className="text-sm font-semibold">{editing.progress}%</span></div>
                <Slider value={[editing.progress]} max={100} step={5} onValueChange={([v]) => setEditing({ ...editing, progress: v })} />
              </div>
              <div>
                <Label>Cor</Label>
                <div className="flex gap-2 mt-2">
                  {COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setEditing({ ...editing, color: c })}
                      className={`h-8 w-8 rounded-lg border-2 ${editing.color === c ? "border-foreground scale-110" : "border-transparent"} transition`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={saveEdit} className="bg-gradient-primary text-primary-foreground">Salvar alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Files dialog */}
      <Dialog open={!!filesProject} onOpenChange={(o) => !o && setFilesProject(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-accent" />
              Arquivos · {filesProject?.name}
            </DialogTitle>
          </DialogHeader>
          {filesProject && <AttachmentsPanel projectId={filesProject.id} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

