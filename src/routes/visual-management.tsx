import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useRef } from "react";
import {
  Target, AlertTriangle, ListChecks, BarChart3, Star, Workflow,
  Plus, Trash2, Info, ArrowRight, Save, LayoutGrid, Brain,
  HelpCircle, MoreHorizontal, MousePointer2, Square, Diamond,
  Circle, Database, MoveRight, Type, Download, Share2, Sparkles, Loader2,
  CalendarRange, Users, FolderKanban, Minus
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/contexts/AuthContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useEffect } from "react";

export const Route = createFileRoute("/visual-management")({
  component: () => <AppShell><VisualManagementPage /></AppShell>,
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
            onChange={(e) => setGoal({ ...goal, [c.key]: e.target.value })}
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
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
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
function FlowchartTool({ nodes, setNodes, edges, setEdges }: { nodes: any[], setNodes: any, edges: any[], setEdges: any }) {
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [connectingNode, setConnectingNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [viewTransform, setViewTransform] = useState({ x: 0, y: 0, zoom: 1 });
  const [selectedElement, setSelectedElement] = useState<{ type: 'node' | 'edge', id: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const exportToImage = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgSize = svg.getBoundingClientRect();

    canvas.width = svgSize.width * 2; // High resolution
    canvas.height = svgSize.height * 2;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#f9fafb"; // Background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "fluxograma-exacta.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const addNode = (type: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNode = {
      id,
      type,
      x: (200 - viewTransform.x) / viewTransform.zoom,
      y: (200 - viewTransform.y) / viewTransform.zoom,
      label: type === 'text' ? 'Novo Texto' : 'Novo ' + type,
      color: '#3b82f6'
    };
    setNodes([...nodes, newNode]);
  };

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setConnectingNode(id);
    } else {
      const node = nodes.find(n => n.id === id);
      if (node) {
        setDraggingNode(id);
        setOffset({ x: e.clientX - node.x * viewTransform.zoom, y: e.clientY - node.y * viewTransform.zoom });
      }
    }
    setSelectedElement({ type: 'node', id });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      setNodes(nodes.map(n =>
        n.id === draggingNode
          ? { ...n, x: (e.clientX - offset.x) / viewTransform.zoom, y: (e.clientY - offset.y) / viewTransform.zoom }
          : n
      ));
    }
  };

  const handleMouseUp = (id?: string) => {
    if (connectingNode && id && connectingNode !== id) {
      const sourceNode = nodes.find(n => n.id === connectingNode);
      let edgeLabel = "";
      if (sourceNode?.type === 'decision') {
        const existingEdges = edges.filter(e => e.source === connectingNode);
        edgeLabel = existingEdges.length === 0 ? "Sim" : "Não";
      }
      setEdges([...edges, { id: Math.random().toString(36).substr(2, 9), source: connectingNode, target: id, label: edgeLabel }]);
    }
    setDraggingNode(null);
    setConnectingNode(null);
  };

  const deleteElement = () => {
    if (!selectedElement) return;
    if (selectedElement.type === 'node') {
      setNodes(nodes.filter(n => n.id !== selectedElement.id));
      setEdges(edges.filter(e => e.source !== selectedElement.id && e.target !== selectedElement.id));
    } else {
      setEdges(edges.filter(e => e.id !== selectedElement.id));
    }
    setSelectedElement(null);
  };

  const updateSelectedNode = (updates: any) => {
    if (selectedElement?.type === 'node') {
      setNodes(nodes.map(n => n.id === selectedElement.id ? { ...n, ...updates } : n));
    }
  };

  const tools = [
    { type: "start", icon: Circle, label: "Início/Fim" },
    { type: "process", icon: Square, label: "Processo" },
    { type: "decision", icon: Diamond, label: "Decisão" },
    { type: "data", icon: Database, label: "Dados" },
    { type: "text", icon: Type, label: "Texto" },
  ];

  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#ffffff"];

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] min-h-[600px] border rounded-2xl overflow-hidden bg-muted/5 relative" onMouseMove={handleMouseMove} onMouseUp={() => handleMouseUp()}>
      {/* Toolbar */}
      <div className="absolute left-4 top-4 flex flex-col gap-2 p-2 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant z-20">
        {tools.map(t => (
          <Button key={t.type} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent" title={t.label} onClick={() => addNode(t.type)}>
            <t.icon className="h-5 w-5" />
          </Button>
        ))}
        <div className="h-px bg-white/10 mx-2" />
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent" title="Exportar PNG" onClick={exportToImage}>
          <Download className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10" title="Excluir Selecionado" onClick={deleteElement}>
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Viewport controls */}
      <div className="absolute right-4 top-4 flex items-center gap-2 p-1 rounded-xl border border-white/10 bg-card/80 backdrop-blur-xl z-20">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTransform(t => ({ ...t, zoom: t.zoom * 1.1 }))}><Plus className="h-4 w-4" /></Button>
        <span className="text-[10px] font-bold min-w-[30px] text-center">{Math.round(viewTransform.zoom * 100)}%</span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewTransform(t => ({ ...t, zoom: t.zoom / 1.1 }))}><Minus className="h-4 w-4" /></Button>
      </div>

      {/* Properties Panel */}
      {selectedElement?.type === 'node' && (
        <div className="absolute right-4 bottom-4 w-64 p-4 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant z-20 animate-in slide-in-from-right-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Propriedades</h4>
          <div className="space-y-4">
            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1 block">Tipo de Forma</Label>
              <select
                value={nodes.find(n => n.id === selectedElement.id)?.type || ""}
                onChange={(e) => updateSelectedNode({ type: e.target.value })}
                className="w-full h-8 text-xs bg-muted/20 rounded-md border border-white/10 px-2"
              >
                {tools.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1 block">Rótulo</Label>
              <Input
                value={nodes.find(n => n.id === selectedElement.id)?.label || ""}
                onChange={(e) => updateSelectedNode({ label: e.target.value })}
                className="h-8 text-xs bg-muted/20"
              />
            </div>
            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground/60 mb-1 block">Cor</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => updateSelectedNode({ color: c })}
                    className={cn("h-5 w-5 rounded-full border border-white/20", nodes.find(n => n.id === selectedElement.id)?.color === c && "ring-2 ring-accent ring-offset-2 ring-offset-background")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair outline-none"
        onMouseDown={(e) => {
          if (e.button === 0 && e.target === e.currentTarget) {
            setSelectedElement(null);
          }
        }}
      >
        <g transform={`translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.zoom})`}>
          {/* Grid lines for professional look */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.05" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="5000" height="5000" x="-2500" y="-2500" fill="url(#grid)" />

          {/* Edges */}
          {edges.map(edge => {
            const source = nodes.find(n => n.id === edge.source);
            const target = nodes.find(n => n.id === edge.target);
            if (!source || !target) return null;

            const d = `M ${source.x + (source.type === 'process' ? 64 : 48)} ${source.y + (source.type === 'process' ? 40 : 48)} L ${target.x + (target.type === 'process' ? 64 : 48)} ${target.y + (target.type === 'process' ? 40 : 48)}`;

            return (
              <g key={edge.id} onClick={() => setSelectedElement({ type: 'edge', id: edge.id })}>
                <path
                  d={d}
                  stroke={selectedElement?.id === edge.id ? "#3b82f6" : "#94a3b8"}
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(source.x + target.x) / 2 + 60}
                    y={(source.y + target.y) / 2 + 50}
                    className="text-[10px] font-bold fill-muted-foreground bg-background"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map(node => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              onMouseUp={() => handleMouseUp(node.id)}
              className={cn("cursor-move group", selectedElement?.id === node.id && "filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]")}
            >
              {node.type === 'start' && <circle r="48" cx="48" cy="48" fill={node.color} fillOpacity="0.1" stroke={node.color} strokeWidth="2" />}
              {node.type === 'process' && <rect width="128" height="80" rx="8" fill={node.color} fillOpacity="0.1" stroke={node.color} strokeWidth="2" />}
              {node.type === 'decision' && <polygon points="64,0 128,64 64,128 0,64" transform="scale(0.75)" fill={node.color} fillOpacity="0.1" stroke={node.color} strokeWidth="2" />}
              {node.type === 'data' && <polygon points="20,0 128,0 108,80 0,80" fill={node.color} fillOpacity="0.1" stroke={node.color} strokeWidth="2" />}
              {node.type === 'text' && <text dy="1em" className="text-sm font-medium fill-foreground">{node.label}</text>}

              {node.type !== 'text' && (
                <text
                  x={node.type === 'process' ? 64 : node.type === 'decision' ? 48 : 48}
                  y={node.type === 'process' ? 40 : node.type === 'decision' ? 48 : 48}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[10px] font-black uppercase tracking-tight fill-foreground"
                >
                  {node.label}
                </text>
              )}

              {/* Connecting ports */}
              <circle cx="48" cy="48" r="4" className="opacity-0 group-hover:opacity-100 fill-accent" />
            </g>
          ))}
        </g>
      </svg>

      {/* Help Overlay */}
      <div className="absolute left-4 bottom-4 p-3 rounded-xl border border-white/5 bg-black/20 backdrop-blur-md text-[10px] text-muted-foreground space-y-1">
        <p>• Arraste para mover as formas</p>
        <p>• SHIFT + Arraste entre formas para conectar</p>
        <p>• Clique em uma forma para editar propriedades</p>
        <p>• Decisões criam 'Sim'/'Não' automaticamente</p>
      </div>
    </div>
  );
}

// --- Main Page Component ---
function VisualManagementPage() {
  const { user } = useAuth();
  const [swot, setSwot] = useState({ strengths: ["Equipe qualificada"], weaknesses: ["Baixo orçamento"], opportunities: ["Novos mercados"], threats: ["Concorrência"] });
  const [eisenhower, setEisenhower] = useState([{ id: "1", text: "Finalizar código", quadrant: "do", priority: "high" }]);
  const [fiveW, setFiveW] = useState([{ what: "Projeto X", why: "Expansão", where: "Brasil", when: "Janeiro", who: "Time A", how: "Manual", howMuch: "R$ 0" }]);
  const [pareto, setPareto] = useState([{ cause: "Erros de login", occurrences: 45, percentage: 45 }]);
  const [smart, setSmart] = useState({ specific: "", measurable: "", achievable: "", relevant: "", timeBound: "" });
  const [gut, setGut] = useState([{ id: "1", issue: "Servidor", gravity: 5, urgency: 5, tendency: 5 }]);
  const [nodes, setNodes] = useState([{ id: "1", type: "start", x: 400, y: 50, label: "Início" }]);
  const [edges, setEdges] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("swot");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    const loadProjects = async () => {
      const { data } = await supabase.from("projects").select("*").order("name");
      if (data) setProjects(data);
    };
    loadProjects();
  }, []);

  const printRef = useRef<HTMLDivElement>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  const handleSaveBoard = async () => {
    if (!selectedProjectId) {
      toast.error("Selecione um projeto para salvar.");
      return;
    }
    if (!user) return;

    let dataToSave;
    let name = "";
    switch (activeTab) {
      case "swot": dataToSave = swot; name = "Matriz SWOT"; break;
      case "eisenhower": dataToSave = eisenhower; name = "Matriz Eisenhower"; break;
      case "5w2h": dataToSave = fiveW; name = "5W2H"; break;
      case "pareto": dataToSave = pareto; name = "Diagrama de Pareto"; break;
      case "smart": dataToSave = smart; name = "Metas SMART"; break;
      case "gut": dataToSave = gut; name = "Matriz GUT"; break;
      case "flowchart": dataToSave = { nodes, edges }; name = "Fluxograma"; break;
    }

    const { error } = await (supabase.from("visual_boards" as any)).insert({
      name,
      tool_type: activeTab,
      project_id: selectedProjectId,
      data: dataToSave,
      owner_id: user.id
    });

    if (error) {
      toast.error("Erro ao salvar o painel.");
    } else {
      toast.success(`${name} salvo com sucesso no projeto!`);
    }
  };

  const handleLoadBoard = async () => {
    if (!selectedProjectId) {
      toast.error("Selecione um projeto primeiro.");
      return;
    }
    const { data, error }: any = await (supabase.from("visual_boards" as any))
      .select("*")
      .eq("project_id", selectedProjectId)
      .eq("tool_type", activeTab)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      toast.error("Nenhum painel salvo encontrado para este projeto e ferramenta.");
      return;
    }

    const savedData = data[0].data;
    switch (activeTab) {
      case "swot": setSwot(savedData); break;
      case "eisenhower": setEisenhower(savedData); break;
      case "5w2h": setFiveW(savedData); break;
      case "pareto": setPareto(savedData); break;
      case "smart": setSmart(savedData); break;
      case "gut": setGut(savedData); break;
      case "flowchart": 
        setNodes(savedData.nodes || []); 
        setEdges(savedData.edges || []); 
        break;
    }
    toast.success("Painel carregado com sucesso!");
  };

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
      owner_id: user.id
    });

    if (error) toast.error("Erro ao criar projeto: " + error.message);
    else toast.success("Projeto sugerido criado com sucesso!");
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setExportingPDF(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("gestao-visual-exacta.pdf");
      toast.success("Projeto exportado em PDF com sucesso!");
    } catch (e) {
      toast.error("Erro ao exportar PDF.");
    } finally {
      setExportingPDF(false);
    }
  };

  const handleCreateOKR = async () => {
    if (!suggestedOKR) return;
    const { user } = (await supabase.auth.getUser()).data;
    if (!user) return;

    const table: any = supabase.from("okrs" as any);
    const { error } = await table.insert({
      title: suggestedOKR.title,
      description: suggestedOKR.description,
      target_value: 100,
      current_value: 0,
      owner_id: user.id
    });

    if (error) toast.error("Erro ao criar OKR: " + error.message);
    else toast.success("OKR sugerido criado com sucesso!");
  };

  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    const dataToAnalyze = { swot, eisenhower, fiveW, pareto, smart, gut, nodes, edges };
    const prompt = `
      Analise os seguintes dados estratégicos e o fluxo de processo da plataforma EXACTA e forneça insights acionáveis, incluindo otimizações para o fluxograma.
      
      Dados Estratégicos: ${JSON.stringify({ swot, eisenhower, fiveW, pareto, smart, gut })}
      Fluxograma (Nós e Conexões): ${JSON.stringify({ nodes, edges })}
      
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
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 w-full md:w-auto">
            <select
              className="flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              <option value="">Nenhum Projeto (Rascunho)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button onClick={handleLoadBoard} variant="outline" className="gap-2" title="Carregar painel salvo deste projeto">
              Carregar
            </Button>
            <Button onClick={handleSaveBoard} className="bg-primary gap-2 text-primary-foreground" title="Salvar painel neste projeto">
              <Save className="h-4 w-4" /> Salvar
            </Button>
          </div>
          <div className="flex gap-2 self-end">
            <Button
              onClick={handleAIAnalysis}
              disabled={loadingAI}
              variant="outline"
              className="gap-2 border-accent/20 text-accent hover:bg-accent/10 shadow-glow-accent"
            >
              {loadingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              Sugerir Análise com IA
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="bg-gradient-primary gap-2 shadow-glow"
            >
              {exportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
              {exportingPDF ? "Exportando..." : "Exportar para PDF"}
            </Button>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

        <Card ref={printRef} className="mt-6 p-6 border-white/5 bg-card/30 backdrop-blur-sm min-h-[500px] shadow-elegant relative overflow-hidden">
          <TabsContent value="swot" className="mt-0"><SwotMatrix data={swot} setData={setSwot} /></TabsContent>
          <TabsContent value="eisenhower" className="mt-0"><EisenhowerMatrix tasks={eisenhower} setTasks={setEisenhower} /></TabsContent>
          <TabsContent value="5w2h" className="mt-0"><FiveWTwoH rows={fiveW} setRows={setFiveW} /></TabsContent>
          <TabsContent value="pareto" className="mt-0"><ParetoDiagram data={pareto} setData={setPareto} /></TabsContent>
          <TabsContent value="smart" className="mt-0"><SmartMatrix goal={smart} setGoal={setSmart} /></TabsContent>
          <TabsContent value="gut" className="mt-0"><GutMatrix issues={gut} setIssues={setGut} /></TabsContent>
          <TabsContent value="flowchart" className="mt-0"><FlowchartTool nodes={nodes} setNodes={setNodes} edges={edges} setEdges={setEdges} /></TabsContent>
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
