import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, Zap, Loader2, BarChart3, RefreshCw, Plus, 
  Trash2, CheckCircle2, Info, ArrowRight, ShieldAlert 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { askGroq, askGemini } from "@/lib/ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export function BottleneckAnalysis({ data }: { data: any }) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualBottlenecks, setManualBottlenecks] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [openManual, setOpenManual] = useState(false);
  const [newB, setNewB] = useState({
    title: "",
    description: "",
    department_id: "",
    impact_level: "medio" as "baixo" | "medio" | "alto" | "critico",
    suggested_solution: ""
  });

  const loadManual = async () => {
    const { data: bData } = await supabase
      .from("bottlenecks" as any)
      .select("*, departments(name)")
      .order("created_at", { ascending: false });
    
    if (bData) setManualBottlenecks(bData);

    const { data: dData } = await (supabase.from("departments" as any)).select("*");
    if (dData) setDepartments(dData);
  };

  useEffect(() => {
    loadManual();
  }, []);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `
        Analise os seguintes dados do sistema de gestão EXACTA e identifique GARGALOS (problemas de produtividade, atrasos, sobrecarga).
        Dados: ${JSON.stringify(data)}
        Gargalos Manuais já reportados: ${JSON.stringify(manualBottlenecks)}
        
        Para cada gargalo encontrado:
        1. Descreva o problema.
        2. Explique o impacto.
        3. Sugira como solucionar/selecionar a melhor abordagem.
        
        Use um tom profissional, direto e executivo. Responda em Markdown com emojis.
      `;
      
      let response;
      try {
        response = await askGroq(prompt);
      } catch {
        response = await askGemini(prompt);
      }
      setAnalysis(response || "Não foi possível gerar a análise.");
    } catch (error) {
      toast.error("Erro ao analisar gargalos.");
    } finally {
      setLoading(false);
    }
  };

  const createManualBottleneck = async () => {
    if (!newB.title || !newB.description || !newB.department_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await (supabase.from("bottlenecks" as any)).insert({
      ...newB,
      created_by: user?.id
    } as any);

    if (error) {
      toast.error("Erro ao registrar gargalo");
    } else {
      toast.success("Gargalo registrado com sucesso!");
      setOpenManual(false);
      setNewB({ title: "", description: "", department_id: "", impact_level: "medio", suggested_solution: "" });
      loadManual();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from("bottlenecks" as any)).update({ status } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
    else loadManual();
  };

  return (
    <div className="space-y-6">
      {/* AI Analysis Card */}
      <Card className="p-6 shadow-card border-destructive/20 relative overflow-hidden group bg-gradient-to-br from-card to-destructive/5">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <AlertTriangle className="h-32 w-32 text-destructive" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl">Diagnóstico de Gargalos (IA)</h3>
                <p className="text-sm text-muted-foreground">O JARVIS analisa dados e gargalos manuais para sugerir melhorias.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={openManual} onOpenChange={setOpenManual}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2 border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                    <Plus className="h-4 w-4" /> Reportar Gargalo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Reportar Novo Gargalo</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Título do Problema</Label>
                      <Input value={newB.title} onChange={e => setNewB({...newB, title: e.target.value})} placeholder="Ex: Lentidão no setor de compras" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Descrição Detalhada</Label>
                      <Textarea value={newB.description} onChange={e => setNewB({...newB, description: e.target.value})} placeholder="Explique o que está travando o processo..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Setor Afetado</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-destructive"
                          value={newB.department_id}
                          onChange={e => setNewB({...newB, department_id: e.target.value})}
                        >
                          <option value="">Selecione...</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Nível de Impacto</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-destructive"
                          value={newB.impact_level}
                          onChange={e => setNewB({...newB, impact_level: e.target.value as any})}
                        >
                          <option value="baixo">Baixo</option>
                          <option value="medio">Médio</option>
                          <option value="alto">Alto</option>
                          <option value="critico">Crítico</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Sugestão de Solução (Opcional)</Label>
                      <Input value={newB.suggested_solution} onChange={e => setNewB({...newB, suggested_solution: e.target.value})} placeholder="Como podemos resolver?" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={createManualBottleneck} className="bg-destructive text-white hover:bg-destructive/90">Registrar Problema</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={runAnalysis} 
                disabled={loading}
                className="bg-destructive text-white hover:bg-destructive/90 gap-2 shadow-lg shadow-destructive/20"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                IA Diagnosticar
              </Button>
            </div>
          </div>

          {analysis ? (
            <div className="mt-6 p-5 rounded-2xl bg-card border border-destructive/10 prose prose-sm max-w-none dark:prose-invert shadow-inner">
              <ReactMarkdown>{analysis}</ReactMarkdown>
              <div className="mt-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)} className="text-[10px] uppercase tracking-widest font-bold">Limpar Diagnóstico</Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 py-8 border-2 border-dashed border-destructive/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-destructive/5">
              <RefreshCw className="h-10 w-10 mb-3 opacity-20 animate-spin-slow" />
              <p className="text-sm font-medium">Pronto para diagnóstico inteligente.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Manual Bottlenecks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {manualBottlenecks.map((b) => (
          <Card key={b.id} className={cn(
            "p-5 shadow-card border-l-4 transition-all hover:scale-[1.01]",
            b.impact_level === "critico" ? "border-l-destructive" : 
            b.impact_level === "alto" ? "border-l-orange-500" : "border-l-warning"
          )}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Badge className={cn(
                  "uppercase text-[10px] tracking-tighter",
                  b.impact_level === "critico" ? "bg-destructive" : 
                  b.impact_level === "alto" ? "bg-orange-500" : "bg-warning"
                )}>
                  {b.impact_level}
                </Badge>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{b.departments?.name}</span>
              </div>
              <div className="flex gap-1">
                {b.status !== 'resolvido' && (
                  <button onClick={() => updateStatus(b.id, 'resolvido')} className="p-1 hover:bg-success/10 text-success rounded">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                )}
                <button className="p-1 hover:bg-muted text-muted-foreground rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h4 className="font-bold text-lg mb-1">{b.title}</h4>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{b.description}</p>
            
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">{b.status}</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
