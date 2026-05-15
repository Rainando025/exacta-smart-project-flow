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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, Target, TrendingUp, CheckCircle2, BarChart3, 
  ArrowUpRight, ArrowDownRight, Activity, Percent, DollarSign, Users, Pencil, Trash2 
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/okrs")({
  component: () => <AppShell><OKRsPage /></AppShell>,
});

function OKRsPage() {
  const { user } = useAuth();
  const { isGestor } = useRole();
  const [kpis, setKpis] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [openKpi, setOpenKpi] = useState(false);
  const [newKpi, setNewKpi] = useState({
    name: "",
    goal: "",
    current_value: "",
    unit: "%",
    department_id: "",
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear()
  });
  const [editingKpi, setEditingKpi] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    const { data: kpiData } = await (supabase
      .from("kpis" as any))
      .select("*, departments(name)");
    
    const { data: deptData } = await (supabase
      .from("departments" as any))
      .select("*");

    if (kpiData) setKpis(kpiData);
    if (deptData) setDepartments(deptData);
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
      goal: Number(newKpi.goal),
      current_value: Number(newKpi.current_value),
      created_by: user?.id
    } as any);

    if (error) {
      toast.error("Erro ao criar KPI");
    } else {
      toast.success("KPI criado com sucesso!");
      setOpenKpi(false);
      setNewKpi({ name: "", goal: "", current_value: "", unit: "%", department_id: "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() });
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
      department_id: editingKpi.department_id
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

  const handleDeleteOkr = async (id: string) => {
    if (!confirm("Excluir este OKR permanentemente? Todas as sub-metas serão perdidas.")) return;
    toast.info("Função de exclusão de OKR acionada (mock)");
    // Aqui seria supabase.from("okrs").delete().eq("id", id)
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
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" /> Novo OKR
          </Button>
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
          {/* Using existing mock logic but with better styling */}
          {[
            { id: "1", objective: "Aumentar faturamento em 20%", progress: 65, status: "em_andamento", kr: "Atingir R$ 500k em vendas", dept: "Vendas" },
            { id: "2", objective: "Lançar novo módulo de IA", progress: 90, status: "quase_la", kr: "Integrar Gemini e Groq", dept: "TI/Inovação" },
          ].map((okr) => (
            <Card key={okr.id} className="p-6 shadow-card hover:border-accent/40 transition-all border-l-4 border-l-accent relative">
               <Badge variant="outline" className="absolute top-6 right-6 capitalize bg-accent/5 text-accent border-accent/20">
                {okr.dept}
              </Badge>
              <div className="flex items-start gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Target className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-2xl tracking-tight">{okr.objective}</h3>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span>Resultado Chave: <span className="text-foreground font-medium">{okr.kr}</span></span>
                  </p>
                </div>
                {isGestor && (
                  <div className="flex gap-1">
                    <button onClick={() => toast.info("Editar OKR")} className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"><Pencil className="h-4 w-4" /></button>
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
                      <span>+5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
              <div className="grid gap-2">
                <Label>Setor</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={editingKpi.department_id}
                  onChange={e => setEditingKpi({...editingKpi, department_id: e.target.value})}
                >
                  <option value="">Selecione um setor</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
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
