import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  Target, AlertTriangle, ListChecks, BarChart3, Star, Workflow, 
  Plus, Trash2, Info, ArrowRight, Save, LayoutGrid, Brain, 
  HelpCircle, MoreHorizontal, MousePointer2, Square, Diamond, 
  Circle, Database, MoveRight, Type, Download, Share2, Sparkles, Loader2,
  CalendarRange, Users, FolderKanban
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { askGroq, askGemini } from "@/lib/ai";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/visual-management")({
  component: VisualManagementPage,
});

// --- SWOT Matrix Component ---
function SwotMatrix({ data, setData }: { data: any, setData: any }) {
  const addItem = (category: string) => {
    const item = prompt(`Adicionar em ${category}:`);
    if (item) setData({ ...data, [category]: [...data[category], item] });
  };

  const removeItem = (category: string, index: number) => {
    const newData = { ...data };
    newData[category].splice(index, 1);
    setData(newData);
  };

  const categories = [
    { key: "strengths", label: "Forças (Strengths)", color: "text-green-500", bg: "bg-green-500/5", border: "border-green-500/20" },
    { key: "weaknesses", label: "Fraquezas (Weaknesses)", color: "text-red-500", bg: "bg-red-500/5", border: "border-red-500/20" },
    { key: "opportunities", label: "Oportunidades (Opportunities)", color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
    { key: "threats", label: "Ameaças (Threats)", color: "text-orange-500", bg: "bg-orange-500/5", border: "border-orange-500/20" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {categories.map((cat) => (
        <Card key={cat.key} className={cn("p-6 flex flex-col h-full shadow-card border-2", cat.bg, cat.border)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn("font-bold text-lg", cat.color)}>{cat.label}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => addItem(cat.key)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2 flex-1">
            {data[cat.key].map((item: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border group">
                <span className="text-sm flex-1">{item}</span>
                <button onClick={() => removeItem(cat.key, i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// --- Eisenhower Matrix Component ---
function EisenhowerMatrix({ tasks, setTasks }: { tasks: any[], setTasks: any }) {
  const quadrants = [
    { key: "do", label: "Fazer Agora (Urgente & Importante)", color: "border-destructive", icon: AlertTriangle },
    { key: "schedule", label: "Agendar (Importante, não Urgente)", color: "border-primary", icon: CalendarRange },
    { key: "delegate", label: "Delegar (Urgente, não Importante)", color: "border-secondary", icon: Users },
    { key: "delete", label: "Eliminar (Não Urgente nem Importante)", color: "border-muted-foreground/30", icon: Trash2 },
  ];

  const addTask = (q: string) => {
    const text = prompt("Tarefa:");
    if (text) setTasks([...tasks, { id: Date.now().toString(), text, quadrant: q, priority: "medium" }]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {quadrants.map((q) => (
        <Card key={q.key} className={cn("p-6 flex flex-col border-t-4 shadow-card", q.color)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <q.icon className="h-4 w-4 text-accent" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-tight">{q.label}</h3>
          </div>
          <div className="space-y-2 flex-1">
            {tasks.filter(t => t.quadrant === q.key).map(task => (
              <div key={task.id} className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between group">
                <span className="text-sm font-medium">{task.text}</span>
                <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <Button onClick={() => addTask(q.key)} variant="ghost" className="w-full justify-start text-xs text-muted-foreground hover:text-accent gap-2 h-8 border-dashed border">
              <Plus className="h-3 w-3" /> Adicionar tarefa
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

// --- 5W2H Component ---
function FiveWTwoH({ rows, setRows }: { rows: any[], setRows: any }) {
  const updateRow = (index: number, field: string, val: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: val };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, { what: "", why: "", where: "", when: "", who: "", how: "", howMuch: "" }]);
  };

  return (
    <div className="overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b">
            {["O Que?", "Por Que?", "Onde?", "Quando?", "Quem?", "Como?", "Quanto?"].map(h => (
              <th key={h} className="text-left p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
            <th className="w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/10 transition-colors">
              {Object.keys(row).map((field) => (
                <td key={field} className="p-4">
                  <Input 
                    value={row[field]} 
                    onChange={e => updateRow(i, field, e.target.value)}
                    className="h-9 border-transparent hover:border-border focus:border-accent bg-transparent" 
                  />
                </td>
              ))}
              <td className="p-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 border-t border-dashed">
        <Button variant="outline" size="sm" className="gap-2" onClick={addRow}>
          <Plus className="h-4 w-4" /> Adicionar Linha de Planejamento
        </Button>
      </div>
    </div>
  );
}

// --- Pareto Diagram Component ---
function ParetoDiagram({ data, setData }: { data: any[], setData: any }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-xl">Análise de Pareto (80/20)</h3>
          <p className="text-sm text-muted-foreground">Identifique as causas que geram 80% dos problemas.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar Causa
        </Button>
      </div>

      <div className="grid gap-4">
        {data.map((item, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.cause}</span>
              <span className="text-muted-foreground">{item.occurrences} ocorrências ({item.percentage}%)</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
              <div 
                className={cn("h-full transition-all duration-1000", i === 0 ? "bg-accent" : i < 3 ? "bg-primary" : "bg-muted-foreground/30")} 
                style={{ width: `${item.percentage}%` }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- SMART Matrix Component ---
function SmartMatrix({ goal, setGoal }: { goal: any, setGoal: any }) {
  const criteria = [
    { key: "specific", label: "Específica (Specific)", desc: "O que exatamente você quer alcançar?" },
    { key: "measurable", label: "Mensurável (Measurable)", desc: "Como você medirá o progresso?" },
    { key: "achievable", label: "Atingível (Achievable)", desc: "É realista com seus recursos atuais?" },
    { key: "relevant", label: "Relevante (Relevant)", desc: "Por que isso é importante agora?" },
    { key: "timeBound", label: "Temporal (Time-bound)", desc: "Qual o prazo final?" }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {criteria.map((c) => (
        <Card key={c.key} className="p-5 shadow-card hover:border-accent/30 transition-all border-2">
          <h4 className="font-bold text-accent mb-1">{c.label}</h4>
          <p className="text-xs text-muted-foreground mb-3">{c.desc}</p>
          <Textarea 
            value={goal[c.key]} 
            onChange={(e) => setGoal({...goal, [c.key]: e.target.value})}
            className="text-sm min-h-[100px] bg-muted/20 border-transparent focus:border-accent"
          />
        </Card>
      ))}
    </div>
  );
}

// --- GUT Matrix Component ---
function GutMatrix({ issues, setIssues }: { issues: any[], setIssues: any }) {
  const updateVal = (id: string, field: string, val: number) => {
    setIssues(issues.map(i => i.id === id ? { ...i, [field]: val } : i));
  };

  const calculateGut = (issue: any) => issue.gravity * issue.urgency * issue.tendency;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xl">Matriz GUT</h3>
        <Button size="sm" className="bg-accent text-accent-foreground" onClick={() => {
          const issue = prompt("Nome do problema:");
          if (issue) setIssues([...issues, { id: Date.now().toString(), issue, gravity: 3, urgency: 3, tendency: 3 }]);
        }}><Plus className="h-4 w-4 mr-2" /> Novo Problema</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-4 text-xs font-bold uppercase text-muted-foreground">Problema</th>
              <th className="text-center p-4 text-xs font-bold uppercase text-muted-foreground">G</th>
              <th className="text-center p-4 text-xs font-bold uppercase text-muted-foreground">U</th>
              <th className="text-center p-4 text-xs font-bold uppercase text-muted-foreground">T</th>
              <th className="text-center p-4 text-xs font-bold uppercase text-muted-foreground">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {issues.sort((a, b) => calculateGut(b) - calculateGut(a)).map((item) => (
              <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                <td className="p-4 font-medium">{item.issue}</td>
                {["gravity", "urgency", "tendency"].map(field => (
                  <td key={field} className="p-4 text-center">
                    <select 
                      value={item[field]} 
                      onChange={(e) => updateVal(item.id, field, parseInt(e.target.value))}
                      className="h-8 w-12 rounded border bg-background text-xs text-center"
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                ))}
                <td className="p-4 text-center font-bold text-accent">{calculateGut(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Flowchart Tool ---
function FlowchartTool({ nodes, setNodes }: { nodes: any[], setNodes: any }) {
  const addNode = (type: string) => {
    const id = (nodes.length + 1).toString();
    setNodes([...nodes, { id, type, x: 100, y: 100, label: "Novo " + type }]);
  };

  const tools = [
    { type: "start", icon: Circle, label: "Início/Fim" },
    { type: "process", icon: Square, label: "Processo" },
    { type: "decision", icon: Diamond, label: "Decisão" },
    { type: "data", icon: Database, label: "Dados" },
  ];

  return (
    <div className="flex h-[calc(100vh-350px)] min-h-[500px] border rounded-2xl overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] relative animate-in fade-in duration-700">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant z-10">
        {tools.map(t => (
          <Button key={t.type} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent" title={t.label} onClick={() => addNode(t.type)}>
            <t.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>
      <div className="flex-1 relative">
        {nodes.map(node => (
          <div key={node.id} className={cn("absolute p-4 flex items-center justify-center text-xs font-bold shadow-lg border-2 bg-card", node.type === "start" ? "rounded-full w-24 h-24" : node.type === "decision" ? "rotate-45 w-24 h-24" : "rounded-lg w-32 h-20")} style={{ left: node.x, top: node.y }}>
            <div className={node.type === "decision" ? "-rotate-45" : ""}>{node.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page Component ---
function VisualManagementPage() {
  const [swot, setSwot] = useState({ strengths: ["Equipe qualificada"], weaknesses: ["Baixo orçamento"], opportunities: ["Novos mercados"], threats: ["Concorrência"] });
  const [eisenhower, setEisenhower] = useState([{ id: "1", text: "Finalizar código", quadrant: "do", priority: "high" }]);
  const [fiveW, setFiveW] = useState([{ what: "Projeto X", why: "Expansão", where: "Brasil", when: "Janeiro", who: "Time A", how: "Manual", howMuch: "R$ 0" }]);
  const [pareto, setPareto] = useState([{ cause: "Erros de login", occurrences: 45, percentage: 45 }]);
  const [smart, setSmart] = useState({ specific: "", measurable: "", achievable: "", relevant: "", timeBound: "" });
  const [gut, setGut] = useState([{ id: "1", issue: "Servidor", gravity: 5, urgency: 5, tendency: 5 }]);
  const [nodes, setNodes] = useState([{ id: "1", type: "start", x: 400, y: 50, label: "Início" }]);

  const [aiResult, setAiResult] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [suggestedProject, setSuggestedProject] = useState<any>(null);
  const [suggestedOKR, setSuggestedOKR] = useState<any>(null);

  const handleCreateProject = async () => {
    if (!suggestedProject) return;
    const { user } = (await supabase.auth.getUser()).data;
    if (!user) return;

    const { error } = await supabase.from("projects").insert({
      name: suggestedProject.name,
      description: suggestedProject.description,
      status: "planning",
      user_id: user.id
    });

    if (error) toast.error("Erro ao criar projeto: " + error.message);
    else toast.success("Projeto sugerido criado com sucesso!");
  };

  const handleCreateOKR = async () => {
    if (!suggestedOKR) return;
    const { user } = (await supabase.auth.getUser()).data;
    if (!user) return;

    const { error } = await supabase.from("okrs").insert({
      title: suggestedOKR.title,
      description: suggestedOKR.description,
      target_value: 100,
      current_value: 0,
      user_id: user.id
    });

    if (error) toast.error("Erro ao criar OKR: " + error.message);
    else toast.success("OKR sugerido criado com sucesso!");
  };

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    const dataToAnalyze = { swot, eisenhower, fiveW, pareto, smart, gut };
    const prompt = `
      Analise os seguintes dados estratégicos da plataforma EXACTA e forneça insights acionáveis.
      
      Dados: ${JSON.stringify(dataToAnalyze)}
      
      IMPORTANTE: No final da sua resposta, inclua obrigatoriamente um bloco JSON estruturado como este (não use blocos de código, apenas o JSON bruto após o texto):
      ---JSON_SUGGESTION---
      {
        "project": { "name": "Nome Sugerido", "description": "Descrição detalhada" },
        "okr": { "title": "Título do OKR", "description": "O que deve ser medido" }
      }
      
      Responda em Markdown, com tom profissional e executivo, em português do Brasil.
    `;

    try {
      let result: string | null = null;
      try {
        result = await askGroq(prompt);
      } catch {
        result = await askGemini(prompt);
      }
      
      if (result) {
        const parts = result.split("---JSON_SUGGESTION---");
        setAiResult(parts[0]);
        if (parts[1]) {
          try {
            const suggestion = JSON.parse(parts[1].trim());
            setSuggestedProject(suggestion.project);
            setSuggestedOKR(suggestion.okr);
          } catch (e) { console.error("JSON parse error", e); }
        }
      }
      setOpenDialog(true);
    } catch (error) {
      toast.error("Erro ao gerar análise de IA.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Metodologias</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Gestão Visual</h1>
          <p className="text-muted-foreground mt-2">Ferramentas estratégicas para análise de alta performance.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleAIAnalysis} 
            disabled={loadingAI}
            variant="outline" 
            className="gap-2 border-accent/20 text-accent hover:bg-accent/10 shadow-glow-accent"
          >
            {loadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Sugerir Análise com IA
          </Button>
          <Button className="bg-gradient-primary gap-2 shadow-glow">
            <Save className="h-4 w-4" /> Salvar Projeto
          </Button>
        </div>
      </header>

      <Tabs defaultValue="swot" className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="bg-card/50 border border-white/5 p-1 rounded-xl w-fit">
            <TabsTrigger value="swot" className="rounded-lg gap-2">SWOT</TabsTrigger>
            <TabsTrigger value="eisenhower" className="rounded-lg gap-2">Eisenhower</TabsTrigger>
            <TabsTrigger value="5w2h" className="rounded-lg gap-2">5W2H</TabsTrigger>
            <TabsTrigger value="pareto" className="rounded-lg gap-2">Pareto</TabsTrigger>
            <TabsTrigger value="smart" className="rounded-lg gap-2">SMART</TabsTrigger>
            <TabsTrigger value="gut" className="rounded-lg gap-2">GUT</TabsTrigger>
            <TabsTrigger value="flowchart" className="rounded-lg gap-2">Fluxograma</TabsTrigger>
          </TabsList>
        </div>

        <Card className="mt-6 p-6 border-white/5 bg-card/30 backdrop-blur-sm min-h-[500px] shadow-elegant relative">
          <TabsContent value="swot" className="mt-0"><SwotMatrix data={swot} setData={setSwot} /></TabsContent>
          <TabsContent value="eisenhower" className="mt-0"><EisenhowerMatrix tasks={eisenhower} setTasks={setEisenhower} /></TabsContent>
          <TabsContent value="5w2h" className="mt-0"><FiveWTwoH rows={fiveW} setRows={setFiveW} /></TabsContent>
          <TabsContent value="pareto" className="mt-0"><ParetoDiagram data={pareto} setData={setPareto} /></TabsContent>
          <TabsContent value="smart" className="mt-0"><SmartMatrix goal={smart} setGoal={setSmart} /></TabsContent>
          <TabsContent value="gut" className="mt-0"><GutMatrix issues={gut} setIssues={setGut} /></TabsContent>
          <TabsContent value="flowchart" className="mt-0"><FlowchartTool nodes={nodes} setNodes={setNodes} /></TabsContent>
        </Card>
      </Tabs>

      {/* AI Insights Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-sidebar/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl font-display font-bold">
              <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              Insights Estratégicos (IA)
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 prose prose-invert prose-accent max-w-none">
            {aiResult && <ReactMarkdown>{aiResult}</ReactMarkdown>}
          </div>

          {(suggestedProject || suggestedOKR) && (
            <div className="mt-8 space-y-4 pt-6 border-t border-white/10">
                <h4 className="text-sm font-bold uppercase tracking-widest text-accent">Ações Recomendadas pela IA</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestedProject && (
                        <Card className="p-4 bg-accent/5 border-accent/20 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-accent">
                                <FolderKanban className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase">Novo Projeto</span>
                            </div>
                            <p className="text-sm font-bold">{suggestedProject.name}</p>
                            <Button size="sm" onClick={handleCreateProject} className="mt-2 bg-accent text-accent-foreground font-bold">Criar Projeto</Button>
                        </Card>
                    )}
                    {suggestedOKR && (
                        <Card className="p-4 bg-primary/5 border-primary/20 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-primary">
                                <Target className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase">Nova Meta / OKR</span>
                            </div>
                            <p className="text-sm font-bold">{suggestedOKR.title}</p>
                            <Button size="sm" onClick={handleCreateOKR} className="mt-2 bg-primary text-primary-foreground font-bold">Adicionar OKR</Button>
                        </Card>
                    )}
                </div>
            </div>
          )}

          <DialogFooter className="mt-8 border-t border-white/10 pt-4">
            <Button onClick={() => setOpenDialog(false)} className="bg-muted hover:bg-muted/80 text-foreground font-bold">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
