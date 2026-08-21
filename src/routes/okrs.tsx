import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, Target, TrendingUp, CheckCircle2, BarChart3, 
  ArrowUpRight, ArrowDownRight, Activity, Percent, DollarSign, Users, Pencil, Trash2 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { BottleneckAnalysis } from "@/components/BottleneckAnalysis";

export const Route = createFileRoute("/okrs")({
  component: () => <AppShell><OKRsPage /></AppShell>,
});

function OKRsPage() {
  const { user } = useAuth();
  const { isGestor } = useRole();
  const [kpis, setKpis] = useState<any[]>([]);
  const [okrs, setOkrs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [openKpi, setOpenKpi] = useState(false);
  const [newKpi, setNewKpi] = useState({
    name: "",
    goal: "",
    current_value: "",
    unit: "%",
    department_id: "",
    project_id: "",
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear()
  });
  const [editingKpi, setEditingKpi] = useState<any | null>(null);

  const [openOkr, setOpenOkr] = useState(false);
  const [newOkr, setNewOkr] = useState({
    title: "",
    description: "",
    project_id: "",
  });

  const loadData = async () => {
    setLoading(true);
    const { data: kpiData } = await (supabase
      .from("kpis" as any))
      .select("*, departments(name), projects(name)");
      
    const { data: okrData } = await (supabase
      .from("okrs" as any))
      .select("*, projects(name)");
    
    const { data: deptData } = await (supabase
      .from("departments" as any))
      .select("*");
      
    const { data: projData } = await (supabase
      .from("projects" as any))
      .select("*");

    if (kpiData) setKpis(kpiData);
    if (okrData) setOkrs(okrData);
    if (deptData) setDepartments(deptData);
    if (projData) setProjects(projData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateKpi = async () => {
    if (!newKpi.name || !newKpi.department_id) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    const { error } = await (supabase.from("kpis" as any)).insert({
      ...newKpi,
      department_id: newKpi.department_id || null,
      project_id: newKpi.project_id || null,
      goal: Number(newKpi.goal),
      current_value: Number(newKpi.current_value),
      created_by: user?.id
    } as any);

    if (error) {
      toast.error("Erro ao criar KPI");
    } else {
      toast.success("KPI criado com sucesso!");
      setOpenKpi(false);
      setNewKpi({ name: "", goal: "", current_value: "", unit: "%", department_id: "", project_id: "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });
      loadData();
    }
  };

  const handleUpdateKpi = async () => {
    if (!editingKpi) return;
    const { error } = await (supabase.from("kpis" as any)).update({
      name: editingKpi.name,
      goal: Number(editingKpi.goal),
      current_value: Number(editingKpi.current_value),
      unit: editingKpi.unit,
      department_id: editingKpi.department_id || null,
      project_id: editingKpi.project_id || null
    } as any).eq("id", editingKpi.id);

    if (error) {
      toast.error("Erro ao atualizar KPI");
    } else {
      toast.success("KPI atualizado!");
      setEditingKpi(null);
      loadData();
    }
  };

  const handleDeleteKpi = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este indicador permanentemente?")) return;
    const { error } = await (supabase.from("kpis" as any)).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir KPI");
    } else {
      toast.success("KPI excluído!");
      loadData();
    }
  };

  const getProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    const p = (current / goal) * 100;
    return Math.min(Math.round(p), 100);
  };

  const handleCreateOkr = async () => {
    if (!newOkr.title) {
      toast.error("Preencha o título do OKR");
      return;
    }

    const { error } = await (supabase.from("okrs" as any)).insert({
      title: newOkr.title,
      description: newOkr.description,
      project_id: newOkr.project_id || null,
      owner_id: user?.id,
      status: 'em_andamento',
      progress: 0
    } as any);

    if (error) {
      toast.error("Erro ao criar OKR");
    } else {
      toast.success("OKR criado com sucesso!");
      setOpenOkr(false);
      setNewOkr({ title: "", description: "", project_id: "" });
      loadData();
    }
  };

  const handleDeleteOkr = async (id: string) => {
    if (!confirm("Excluir este OKR permanentemente? Todas as sub-metas serão perdidas.")) return;
    const { error } = await (supabase.from("okrs" as any)).delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir OKR");
    } else {
      toast.success("OKR excluído!");
      loadData();
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Estratégia & Performance</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Metas, OKRs e KPIs</h1>
          <p className="text-muted-foreground mt-2">Acompanhe o desempenho estratégico e indicadores de cada setor.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openOkr} onOpenChange={setOpenOkr}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Novo OKR
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo OKR</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Título / Objetivo</Label>
                  <Input 
                    placeholder="Ex: Aumentar faturamento..." 
                    value={newOkr.title}
                    onChange={e => setNewOkr({...newOkr, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    placeholder="Detalhes..." 
                    value={newOkr.description}
                    onChange={e => setNewOkr({...newOkr, description: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Projeto (Opcional)</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={newOkr.project_id}
                    onChange={e => setNewOkr({...newOkr, project_id: e.target.value})}
                  >
                    <option value="">Selecione um projeto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateOkr} className="bg-gradient-primary">Criar OKR</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {isGestor && (
            <Dialog open={openKpi} onOpenChange={setOpenKpi}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary text-primary-foreground gap-2">
                  <Activity className="h-4 w-4" /> Novo KPI
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Indicador (KPI)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Nome do Indicador</Label>
                    <Input 
                      placeholder="Ex: NPS, Faturamento, Taxa de Conversão" 
                      value={newKpi.name}
                      onChange={e => setNewKpi({...newKpi, name: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Meta Mensal</Label>
                      <Input 
                        type="number" 
                        value={newKpi.goal}
                        onChange={e => setNewKpi({...newKpi, goal: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Unidade</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={newKpi.unit}
                        onChange={e => setNewKpi({...newKpi, unit: e.target.value})}
                      >
                        <option value="%">%</option>
                        <option value="R$">R$</option>
                        <option value="UN">Unidades</option>
                        <option value="H">Horas</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Setor / Departamento</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={newKpi.department_id}
                        onChange={e => setNewKpi({...newKpi, department_id: e.target.value})}
                      >
                        <option value="">Selecione um setor</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Projeto</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={newKpi.project_id}
                        onChange={e => setNewKpi({...newKpi, project_id: e.target.value})}
                      >
                        <option value="">Selecione um projeto</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateKpi} className="bg-gradient-primary">Criar KPI</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      {/* KPI Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          <h2 className="font-display font-bold text-xl">Indicadores de Setores (KPIs)</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="p-6 h-32 animate-pulse bg-muted/50" />
            ))
          ) : kpis.length > 0 ? (
            kpis.map((kpi) => {
              const progress = getProgress(kpi.current_value, kpi.goal);
              const isMeetingGoal = progress >= 100;

              return (
                <Card key={kpi.id} className="p-5 shadow-card hover:shadow-elegant transition-all border-l-4 border-l-accent overflow-hidden group">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{kpi.departments?.name || "Geral"}</p>
                      <h3 className="font-bold text-sm leading-tight mt-1 group-hover:text-accent transition-colors">{kpi.name}</h3>
                    </div>
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      isMeetingGoal ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )}>
                      {isMeetingGoal ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                    </div>
                  </div>

                  {isGestor && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingKpi(kpi)} className="p-1 rounded bg-background border hover:bg-muted text-muted-foreground"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => handleDeleteKpi(kpi.id)} className="p-1 rounded bg-background border hover:bg-destructive hover:text-destructive-foreground text-muted-foreground"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-display">
                        {kpi.unit === "R$" && "R$ "}
                        {kpi.current_value.toLocaleString()}
                        {kpi.unit !== "R$" && kpi.unit}
                      </span>
                      <span className="text-xs text-muted-foreground">/ meta {kpi.goal}{kpi.unit}</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase">
                        <span>Atingimento</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className={cn("h-1.5", isMeetingGoal ? "bg-success/20 [&>div]:bg-success" : "")} />
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full p-10 flex flex-col items-center justify-center text-muted-foreground border-dashed">
              <Activity className="h-10 w-10 mb-2 opacity-20" />
              <p>Nenhum KPI cadastrado para este período.</p>
            </Card>
          )}
        </div>
      </section>

      {/* OKRs Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-accent" />
          <h2 className="font-display font-bold text-xl">Objetivos Estratégicos (OKRs)</h2>
        </div>

        <div className="grid gap-6">
          {loading ? (
            Array(2).fill(0).map((_, i) => (
              <Card key={i} className="p-6 h-40 animate-pulse bg-muted/50" />
            ))
          ) : okrs.length > 0 ? (
            okrs.map((okr) => (
            <Card key={okr.id} className="p-6 shadow-card hover:border-accent/40 transition-all border-l-4 border-l-accent relative">
               <Badge variant="outline" className="absolute top-6 right-6 capitalize bg-accent/5 text-accent border-accent/20">
                {okr.projects?.name || "Geral"}
              </Badge>
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Target className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-2xl tracking-tight">{okr.title}</h3>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Progresso Atual: <span className="text-foreground font-medium">{okr.progress}%</span></span>
                  </p>
                  {okr.description && <p className="text-sm mt-2 text-muted-foreground">{okr.description}</p>}
                </div>
                {isGestor && (
                  <div className="flex gap-1">
                    <button onClick={() => toast.info("Editar OKR (Em breve)")} className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteOkr(okr.id)} className="p-2 rounded-lg bg-muted/50 hover:bg-destructive hover:text-destructive-foreground transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 items-center pt-6 border-t">
                <div className="space-y-2 col-span-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Progresso do Objetivo</span>
                    <span className="font-bold">{okr.progress}%</span>
                  </div>
                  <Progress value={okr.progress} className="h-2.5" />
                </div>

                <div className="flex items-center gap-6 justify-end">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status</p>
                    <p className="text-sm font-bold capitalize text-accent">{okr.status.replace("_", " ")}</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Tendência</p>
                    <div className="flex items-center gap-1 justify-end text-success font-bold text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>-</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))) : (
            <Card className="col-span-full p-10 flex flex-col items-center justify-center text-muted-foreground border-dashed">
              <Target className="h-10 w-10 mb-2 opacity-20" />
              <p>Nenhum OKR cadastrado.</p>
            </Card>
          )}
        </div>
      </section>

      {/* Bottleneck Analysis Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-destructive" />
          <h2 className="font-display font-bold text-xl text-destructive">Gargalos e Soluções (IA)</h2>
        </div>
        <BottleneckAnalysis data={{ kpis }} />
      </section>

      {/* Edit KPI Dialog */}
      <Dialog open={!!editingKpi} onOpenChange={(o) => !o && setEditingKpi(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Indicador (KPI)</DialogTitle></DialogHeader>
          {editingKpi && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Indicador</Label>
                <Input value={editingKpi.name} onChange={e => setEditingKpi({...editingKpi, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Meta</Label>
                  <Input type="number" value={editingKpi.goal} onChange={e => setEditingKpi({...editingKpi, goal: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Valor Atual</Label>
                  <Input type="number" value={editingKpi.current_value} onChange={e => setEditingKpi({...editingKpi, current_value: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Setor</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={editingKpi.department_id || ""}
                    onChange={e => setEditingKpi({...editingKpi, department_id: e.target.value})}
                  >
                    <option value="">Selecione um setor</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label>Projeto</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={editingKpi.project_id || ""}
                    onChange={e => setEditingKpi({...editingKpi, project_id: e.target.value})}
                  >
                    <option value="">Selecione um projeto</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateKpi} className="bg-gradient-primary">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
