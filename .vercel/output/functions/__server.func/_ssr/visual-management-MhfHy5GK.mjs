import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, d as LoaderCircle, M as Markdown, m as askGroq, l as askGemini, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, b as Button, C as Card, D as Dialog, o as DialogContent, r as DialogHeader, s as DialogTitle, q as DialogFooter, ai as supabase, aj as toast, a3 as cn, j as Circle, L as Label$1, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { T as Tabs, b as TabsList, c as TabsTrigger, a as TabsContent } from "./tabs-DVtr1KIk.mjs";
import { S as Sparkles, I as Input } from "./input-nTKCBTY6.mjs";
import { T as Textarea } from "./textarea-CGvy_XFp.mjs";
import { h as html2canvas, j as jsPDF } from "./jspdf.node.min-C8q54cDs.mjs";
import { S as Save } from "./save-CDG45ltg.mjs";
import { a as Brain, F as FolderKanban, C as CalendarRange, U as Users } from "./users-C5uEgJff.mjs";
import { T as Target } from "./target-BBkqu7Bi.mjs";
import { T as TriangleAlert } from "./triangle-alert-BLaYDMdg.mjs";
import { S as Square } from "./square-iGDjZ9I9.mjs";
import { D as Diamond, T as Type, M as Minus } from "./type-BFTQMOAW.mjs";
import { D as Download } from "./download-DABr9rdP.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "node:path";
import "node:url";
import "fs";
import "path";
const __iconNode = [
  ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
  ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
  ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }]
];
const Database = createLucideIcon("database", __iconNode);
function SwotMatrix({
  data,
  setData
}) {
  const addItem = (category) => {
    const item = prompt(`Adicionar em ${category}:`);
    if (item) setData({
      ...data,
      [category]: [...data[category], item]
    });
  };
  const removeItem = (category, index) => {
    const newData = {
      ...data
    };
    newData[category].splice(index, 1);
    setData(newData);
  };
  const categories = [{
    key: "strengths",
    label: "Forças (Strengths)",
    color: "text-green-500",
    bg: "bg-green-500/5",
    border: "border-green-500/20"
  }, {
    key: "weaknesses",
    label: "Fraquezas (Weaknesses)",
    color: "text-red-500",
    bg: "bg-red-500/5",
    border: "border-red-500/20"
  }, {
    key: "opportunities",
    label: "Oportunidades (Opportunities)",
    color: "text-blue-500",
    bg: "bg-blue-500/5",
    border: "border-blue-500/20"
  }, {
    key: "threats",
    label: "Ameaças (Threats)",
    color: "text-orange-500",
    bg: "bg-orange-500/5",
    border: "border-orange-500/20"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500", children: categories.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: cn("p-6 flex flex-col h-full shadow-card border-2", cat.bg, cat.border), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: cn("font-bold text-lg", cat.color), children: cat.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 rounded-full", onClick: () => addItem(cat.key), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 flex-1", children: data[cat.key].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2 rounded-lg bg-background/50 border border-border group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm flex-1", children: item }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeItem(cat.key, i), className: "opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
    ] }, i)) })
  ] }, cat.key)) });
}
function EisenhowerMatrix({
  tasks,
  setTasks
}) {
  const quadrants = [{
    key: "do",
    label: "Fazer Agora (Urgente & Importante)",
    color: "border-destructive",
    icon: TriangleAlert
  }, {
    key: "schedule",
    label: "Agendar (Importante, não Urgente)",
    color: "border-primary",
    icon: CalendarRange
  }, {
    key: "delegate",
    label: "Delegar (Urgente, não Importante)",
    color: "border-secondary",
    icon: Users
  }, {
    key: "delete",
    label: "Eliminar (Não Urgente nem Importante)",
    color: "border-muted-foreground/30",
    icon: Trash2
  }];
  const addTask = (q) => {
    const text = prompt("Tarefa:");
    if (text) setTasks([...tasks, {
      id: Date.now().toString(),
      text,
      quadrant: q,
      priority: "medium"
    }]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 h-full animate-in fade-in slide-in-from-bottom-4 duration-500", children: quadrants.map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: cn("p-6 flex flex-col border-t-4 shadow-card", q.color), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(q.icon, { className: "h-4 w-4 text-accent" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-sm uppercase tracking-tight", children: q.label })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 flex-1", children: [
      tasks.filter((t) => t.quadrant === q.key).map((task) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: task.text }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTasks(tasks.filter((t) => t.id !== task.id)), className: "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
      ] }, task.id)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => addTask(q.key), variant: "ghost", className: "w-full justify-start text-xs text-muted-foreground hover:text-accent gap-2 h-8 border-dashed border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3" }),
        " Adicionar tarefa"
      ] })
    ] })
  ] }, q.key)) });
}
function FiveWTwoH({
  rows,
  setRows
}) {
  const updateRow = (index, field, val) => {
    const newRows = [...rows];
    newRows[index] = {
      ...newRows[index],
      [field]: val
    };
    setRows(newRows);
  };
  const addRow = () => {
    setRows([...rows, {
      what: "",
      why: "",
      where: "",
      when: "",
      who: "",
      how: "",
      howMuch: ""
    }]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-x-auto animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-muted/50 border-b", children: [
        ["O Que?", "Por Que?", "Onde?", "Quando?", "Quem?", "Como?", "Quanto?"].map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-4 text-xs font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap", children: h }, h)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "w-10" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y", children: rows.map((row, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
        Object.keys(row).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: row[field], onChange: (e) => updateRow(i, field, e.target.value), className: "h-9 border-transparent hover:border-border focus:border-accent bg-transparent" }) }, field)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-destructive", onClick: () => setRows(rows.filter((_, idx) => idx !== i)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) }) })
      ] }, i)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-4 border-t border-dashed", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", onClick: addRow, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
      " Adicionar Linha de Planejamento"
    ] }) })
  ] });
}
function ParetoDiagram({
  data,
  setData
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-xl", children: "Análise de Pareto (80/20)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Identifique as causas que geram 80% dos problemas." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " Adicionar Causa"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: data.map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: item.cause }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
          item.occurrences,
          " ocorrências (",
          item.percentage,
          "%)"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-full bg-muted rounded-full overflow-hidden flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("h-full transition-all duration-1000", i === 0 ? "bg-accent" : i < 3 ? "bg-primary" : "bg-muted-foreground/30"), style: {
        width: `${item.percentage}%`
      } }) })
    ] }, i)) })
  ] });
}
function SmartMatrix({
  goal,
  setGoal
}) {
  const criteria = [{
    key: "specific",
    label: "Específica (Specific)",
    desc: "O que exatamente você quer alcançar?"
  }, {
    key: "measurable",
    label: "Mensurável (Measurable)",
    desc: "Como você medirá o progresso?"
  }, {
    key: "achievable",
    label: "Atingível (Achievable)",
    desc: "É realista com seus recursos atuais?"
  }, {
    key: "relevant",
    label: "Relevante (Relevant)",
    desc: "Por que isso é importante agora?"
  }, {
    key: "timeBound",
    label: "Temporal (Time-bound)",
    desc: "Qual o prazo final?"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500", children: criteria.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5 shadow-card hover:border-accent/30 transition-all border-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-accent mb-1", children: c.label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-3", children: c.desc }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: goal[c.key], onChange: (e) => setGoal({
      ...goal,
      [c.key]: e.target.value
    }), className: "text-sm min-h-[100px] bg-muted/20 border-transparent focus:border-accent" })
  ] }, c.key)) });
}
function GutMatrix({
  issues,
  setIssues
}) {
  const updateVal = (id, field, val) => {
    setIssues(issues.map((i) => i.id === id ? {
      ...i,
      [field]: val
    } : i));
  };
  const calculateGut = (issue) => issue.gravity * issue.urgency * issue.tendency;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-xl", children: "Matriz GUT" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "bg-accent text-accent-foreground", onClick: () => {
        const issue = prompt("Nome do problema:");
        if (issue) setIssues([...issues, {
          id: Date.now().toString(),
          issue,
          gravity: 3,
          urgency: 3,
          tendency: 3
        }]);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
        " Novo Problema"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full border-collapse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-muted/50 border-b", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left p-4 text-xs font-bold uppercase text-muted-foreground", children: "Problema" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center p-4 text-xs font-bold uppercase text-muted-foreground", children: "G" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center p-4 text-xs font-bold uppercase text-muted-foreground", children: "U" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center p-4 text-xs font-bold uppercase text-muted-foreground", children: "T" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center p-4 text-xs font-bold uppercase text-muted-foreground", children: "Score" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y", children: issues.sort((a, b) => calculateGut(b) - calculateGut(a)).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 font-medium", children: item.issue }),
        ["gravity", "urgency", "tendency"].map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: item[field], onChange: (e) => updateVal(item.id, field, parseInt(e.target.value)), className: "h-8 w-12 rounded border bg-background text-xs text-center", children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: n, children: n }, n)) }) }, field)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-center font-bold text-accent", children: calculateGut(item) })
      ] }, item.id)) })
    ] }) })
  ] });
}
function FlowchartTool({
  nodes,
  setNodes,
  edges,
  setEdges
}) {
  const [draggingNode, setDraggingNode] = reactExports.useState(null);
  const [connectingNode, setConnectingNode] = reactExports.useState(null);
  const [offset, setOffset] = reactExports.useState({
    x: 0,
    y: 0
  });
  const [viewTransform, setViewTransform] = reactExports.useState({
    x: 0,
    y: 0,
    zoom: 1
  });
  const [selectedElement, setSelectedElement] = reactExports.useState(null);
  const svgRef = reactExports.useRef(null);
  const exportToImage = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgSize = svg.getBoundingClientRect();
    canvas.width = svgSize.width * 2;
    canvas.height = svgSize.height * 2;
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#f9fafb";
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
  const addNode = (type) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNode = {
      id,
      type,
      x: (200 - viewTransform.x) / viewTransform.zoom,
      y: (200 - viewTransform.y) / viewTransform.zoom,
      label: type === "text" ? "Novo Texto" : "Novo " + type,
      color: "#3b82f6"
    };
    setNodes([...nodes, newNode]);
  };
  const handleMouseDown = (id, e) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setConnectingNode(id);
    } else {
      const node = nodes.find((n) => n.id === id);
      if (node) {
        setDraggingNode(id);
        setOffset({
          x: e.clientX - node.x * viewTransform.zoom,
          y: e.clientY - node.y * viewTransform.zoom
        });
      }
    }
    setSelectedElement({
      type: "node",
      id
    });
  };
  const handleMouseMove = (e) => {
    if (draggingNode) {
      setNodes(nodes.map((n) => n.id === draggingNode ? {
        ...n,
        x: (e.clientX - offset.x) / viewTransform.zoom,
        y: (e.clientY - offset.y) / viewTransform.zoom
      } : n));
    }
  };
  const handleMouseUp = (id) => {
    if (connectingNode && id && connectingNode !== id) {
      const sourceNode = nodes.find((n) => n.id === connectingNode);
      let edgeLabel = "";
      if (sourceNode?.type === "decision") {
        const existingEdges = edges.filter((e) => e.source === connectingNode);
        edgeLabel = existingEdges.length === 0 ? "Sim" : "Não";
      }
      setEdges([...edges, {
        id: Math.random().toString(36).substr(2, 9),
        source: connectingNode,
        target: id,
        label: edgeLabel
      }]);
    }
    setDraggingNode(null);
    setConnectingNode(null);
  };
  const deleteElement = () => {
    if (!selectedElement) return;
    if (selectedElement.type === "node") {
      setNodes(nodes.filter((n) => n.id !== selectedElement.id));
      setEdges(edges.filter((e) => e.source !== selectedElement.id && e.target !== selectedElement.id));
    } else {
      setEdges(edges.filter((e) => e.id !== selectedElement.id));
    }
    setSelectedElement(null);
  };
  const updateSelectedNode = (updates) => {
    if (selectedElement?.type === "node") {
      setNodes(nodes.map((n) => n.id === selectedElement.id ? {
        ...n,
        ...updates
      } : n));
    }
  };
  const tools = [{
    type: "start",
    icon: Circle,
    label: "Início/Fim"
  }, {
    type: "process",
    icon: Square,
    label: "Processo"
  }, {
    type: "decision",
    icon: Diamond,
    label: "Decisão"
  }, {
    type: "data",
    icon: Database,
    label: "Dados"
  }, {
    type: "text",
    icon: Type,
    label: "Texto"
  }];
  const colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#ffffff"];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-[calc(100vh-250px)] min-h-[600px] border rounded-2xl overflow-hidden bg-muted/5 relative", onMouseMove: handleMouseMove, onMouseUp: () => handleMouseUp(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute left-4 top-4 flex flex-col gap-2 p-2 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant z-20", children: [
      tools.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent", title: t.label, onClick: () => addNode(t.type), children: /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "h-5 w-5" }) }, t.type)),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-white/10 mx-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent", title: "Exportar PNG", onClick: exportToImage, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10", title: "Excluir Selecionado", onClick: deleteElement, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-4 top-4 flex items-center gap-2 p-1 rounded-xl border border-white/10 bg-card/80 backdrop-blur-xl z-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setViewTransform((t) => ({
        ...t,
        zoom: t.zoom * 1.1
      })), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold min-w-[30px] text-center", children: [
        Math.round(viewTransform.zoom * 100),
        "%"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => setViewTransform((t) => ({
        ...t,
        zoom: t.zoom / 1.1
      })), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" }) })
    ] }),
    selectedElement?.type === "node" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-4 bottom-4 w-64 p-4 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant z-20 animate-in slide-in-from-right-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3", children: "Propriedades" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-[10px] uppercase font-bold text-muted-foreground/60 mb-1 block", children: "Tipo de Forma" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: nodes.find((n) => n.id === selectedElement.id)?.type || "", onChange: (e) => updateSelectedNode({
            type: e.target.value
          }), className: "w-full h-8 text-xs bg-muted/20 rounded-md border border-white/10 px-2", children: tools.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: t.type, children: t.label }, t.type)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-[10px] uppercase font-bold text-muted-foreground/60 mb-1 block", children: "Rótulo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: nodes.find((n) => n.id === selectedElement.id)?.label || "", onChange: (e) => updateSelectedNode({
            label: e.target.value
          }), className: "h-8 text-xs bg-muted/20" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { className: "text-[10px] uppercase font-bold text-muted-foreground/60 mb-1 block", children: "Cor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: colors.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => updateSelectedNode({
            color: c
          }), className: cn("h-5 w-5 rounded-full border border-white/20", nodes.find((n) => n.id === selectedElement.id)?.color === c && "ring-2 ring-accent ring-offset-2 ring-offset-background"), style: {
            backgroundColor: c
          } }, c)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { ref: svgRef, className: "w-full h-full cursor-crosshair outline-none", onMouseDown: (e) => {
      if (e.button === 0 && e.target === e.currentTarget) {
        setSelectedElement(null);
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${viewTransform.x}, ${viewTransform.y}) scale(${viewTransform.zoom})`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("pattern", { id: "grid", width: "40", height: "40", patternUnits: "userSpaceOnUse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M 40 0 L 0 0 0 40", fill: "none", stroke: "currentColor", strokeOpacity: "0.05", strokeWidth: "1" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "5000", height: "5000", x: "-2500", y: "-2500", fill: "url(#grid)" }),
      edges.map((edge) => {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);
        if (!source || !target) return null;
        const d = `M ${source.x + (source.type === "process" ? 64 : 48)} ${source.y + (source.type === "process" ? 40 : 48)} L ${target.x + (target.type === "process" ? 64 : 48)} ${target.y + (target.type === "process" ? 40 : 48)}`;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { onClick: () => setSelectedElement({
          type: "edge",
          id: edge.id
        }), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d, stroke: selectedElement?.id === edge.id ? "#3b82f6" : "#94a3b8", strokeWidth: "2", fill: "none", markerEnd: "url(#arrowhead)" }),
          edge.label && /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: (source.x + target.x) / 2 + 60, y: (source.y + target.y) / 2 + 50, className: "text-[10px] font-bold fill-muted-foreground bg-background", children: edge.label })
        ] }, edge.id);
      }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("marker", { id: "arrowhead", markerWidth: "10", markerHeight: "7", refX: "9", refY: "3.5", orient: "auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "0 0, 10 3.5, 0 7", fill: "#94a3b8" }) }) }),
      nodes.map((node) => /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { transform: `translate(${node.x}, ${node.y})`, onMouseDown: (e) => handleMouseDown(node.id, e), onMouseUp: () => handleMouseUp(node.id), className: cn("cursor-move group", selectedElement?.id === node.id && "filter drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"), children: [
        node.type === "start" && /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { r: "48", cx: "48", cy: "48", fill: node.color, fillOpacity: "0.1", stroke: node.color, strokeWidth: "2" }),
        node.type === "process" && /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { width: "128", height: "80", rx: "8", fill: node.color, fillOpacity: "0.1", stroke: node.color, strokeWidth: "2" }),
        node.type === "decision" && /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "64,0 128,64 64,128 0,64", transform: "scale(0.75)", fill: node.color, fillOpacity: "0.1", stroke: node.color, strokeWidth: "2" }),
        node.type === "data" && /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "20,0 128,0 108,80 0,80", fill: node.color, fillOpacity: "0.1", stroke: node.color, strokeWidth: "2" }),
        node.type === "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("text", { dy: "1em", className: "text-sm font-medium fill-foreground", children: node.label }),
        node.type !== "text" && /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: node.type === "process" ? 64 : node.type === "decision" ? 48 : 48, y: node.type === "process" ? 40 : node.type === "decision" ? 48 : 48, textAnchor: "middle", dominantBaseline: "middle", className: "text-[10px] font-black uppercase tracking-tight fill-foreground", children: node.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "48", cy: "48", r: "4", className: "opacity-0 group-hover:opacity-100 fill-accent" })
      ] }, node.id))
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute left-4 bottom-4 p-3 rounded-xl border border-white/5 bg-black/20 backdrop-blur-md text-[10px] text-muted-foreground space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Arraste para mover as formas" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• SHIFT + Arraste entre formas para conectar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Clique em uma forma para editar propriedades" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "• Decisões criam 'Sim'/'Não' automaticamente" })
    ] })
  ] });
}
function VisualManagementPage() {
  const {
    user
  } = useAuth();
  const [swot, setSwot] = reactExports.useState({
    strengths: ["Equipe qualificada"],
    weaknesses: ["Baixo orçamento"],
    opportunities: ["Novos mercados"],
    threats: ["Concorrência"]
  });
  const [eisenhower, setEisenhower] = reactExports.useState([{
    id: "1",
    text: "Finalizar código",
    quadrant: "do",
    priority: "high"
  }]);
  const [fiveW, setFiveW] = reactExports.useState([{
    what: "Projeto X",
    why: "Expansão",
    where: "Brasil",
    when: "Janeiro",
    who: "Time A",
    how: "Manual",
    howMuch: "R$ 0"
  }]);
  const [pareto, setPareto] = reactExports.useState([{
    cause: "Erros de login",
    occurrences: 45,
    percentage: 45
  }]);
  const [smart, setSmart] = reactExports.useState({
    specific: "",
    measurable: "",
    achievable: "",
    relevant: "",
    timeBound: ""
  });
  const [gut, setGut] = reactExports.useState([{
    id: "1",
    issue: "Servidor",
    gravity: 5,
    urgency: 5,
    tendency: 5
  }]);
  const [nodes, setNodes] = reactExports.useState([{
    id: "1",
    type: "start",
    x: 400,
    y: 50,
    label: "Início"
  }]);
  const [edges, setEdges] = reactExports.useState([]);
  const [activeTab, setActiveTab] = reactExports.useState("swot");
  const [projects, setProjects] = reactExports.useState([]);
  const [selectedProjectId, setSelectedProjectId] = reactExports.useState("");
  reactExports.useEffect(() => {
    const loadProjects = async () => {
      const {
        data
      } = await supabase.from("projects").select("*").order("name");
      if (data) setProjects(data);
    };
    loadProjects();
  }, []);
  const printRef = reactExports.useRef(null);
  const [exportingPDF, setExportingPDF] = reactExports.useState(false);
  const handleSaveBoard = async () => {
    if (!selectedProjectId) {
      toast.error("Selecione um projeto para salvar.");
      return;
    }
    if (!user) return;
    let dataToSave;
    let name = "";
    switch (activeTab) {
      case "swot":
        dataToSave = swot;
        name = "Matriz SWOT";
        break;
      case "eisenhower":
        dataToSave = eisenhower;
        name = "Matriz Eisenhower";
        break;
      case "5w2h":
        dataToSave = fiveW;
        name = "5W2H";
        break;
      case "pareto":
        dataToSave = pareto;
        name = "Diagrama de Pareto";
        break;
      case "smart":
        dataToSave = smart;
        name = "Metas SMART";
        break;
      case "gut":
        dataToSave = gut;
        name = "Matriz GUT";
        break;
      case "flowchart":
        dataToSave = {
          nodes,
          edges
        };
        name = "Fluxograma";
        break;
    }
    const {
      error
    } = await supabase.from("visual_boards").insert({
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
    const {
      data,
      error
    } = await supabase.from("visual_boards").select("*").eq("project_id", selectedProjectId).eq("tool_type", activeTab).order("created_at", {
      ascending: false
    }).limit(1);
    if (error || !data || data.length === 0) {
      toast.error("Nenhum painel salvo encontrado para este projeto e ferramenta.");
      return;
    }
    const savedData = data[0].data;
    switch (activeTab) {
      case "swot":
        setSwot(savedData);
        break;
      case "eisenhower":
        setEisenhower(savedData);
        break;
      case "5w2h":
        setFiveW(savedData);
        break;
      case "pareto":
        setPareto(savedData);
        break;
      case "smart":
        setSmart(savedData);
        break;
      case "gut":
        setGut(savedData);
        break;
      case "flowchart":
        setNodes(savedData.nodes || []);
        setEdges(savedData.edges || []);
        break;
    }
    toast.success("Painel carregado com sucesso!");
  };
  const [aiResult, setAiResult] = reactExports.useState(null);
  const [loadingAI, setLoadingAI] = reactExports.useState(false);
  const [openDialog, setOpenDialog] = reactExports.useState(false);
  const [suggestedProject, setSuggestedProject] = reactExports.useState(null);
  const [suggestedOKR, setSuggestedOKR] = reactExports.useState(null);
  const handleCreateProject = async () => {
    if (!suggestedProject) return;
    const {
      user: user2
    } = (await supabase.auth.getUser()).data;
    if (!user2) return;
    const {
      error
    } = await supabase.from("projects").insert({
      name: suggestedProject.name,
      description: suggestedProject.description,
      status: "planning",
      owner_id: user2.id
    });
    if (error) toast.error("Erro ao criar projeto: " + error.message);
    else toast.success("Projeto sugerido criado com sucesso!");
  };
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setExportingPDF(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true
      });
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
    const {
      user: user2
    } = (await supabase.auth.getUser()).data;
    if (!user2) return;
    const table = supabase.from("okrs");
    const {
      error
    } = await table.insert({
      title: suggestedOKR.title,
      description: suggestedOKR.description,
      target_value: 100,
      current_value: 0,
      owner_id: user2.id
    });
    if (error) toast.error("Erro ao criar OKR: " + error.message);
    else toast.success("OKR sugerido criado com sucesso!");
  };
  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    const prompt2 = `
      Analise os seguintes dados estratégicos e o fluxo de processo da plataforma EXACTA e forneça insights acionáveis, incluindo otimizações para o fluxograma.
      
      Dados Estratégicos: ${JSON.stringify({
      swot,
      eisenhower,
      fiveW,
      pareto,
      smart,
      gut
    })}
      Fluxograma (Nós e Conexões): ${JSON.stringify({
      nodes,
      edges
    })}
      
      IMPORTANTE: No final da sua resposta, inclua obrigatoriamente um bloco JSON estruturado como este (não use blocos de código, apenas o JSON bruto após o texto):
      ---JSON_SUGGESTION---
      {
        "project": { "name": "Nome Sugerido", "description": "Descrição detalhada" },
        "okr": { "title": "Título do OKR", "description": "O que deve ser medido" }
      }
      
      Responda em Markdown, com tom profissional e executivo, em português do Brasil.
    `;
    try {
      let result = null;
      try {
        result = await askGroq(prompt2);
      } catch {
        result = await askGemini(prompt2);
      }
      if (result) {
        const parts = result.split("---JSON_SUGGESTION---");
        setAiResult(parts[0]);
        if (parts[1]) {
          try {
            const suggestion = JSON.parse(parts[1].trim());
            setSuggestedProject(suggestion.project);
            setSuggestedOKR(suggestion.okr);
          } catch (e) {
            console.error("JSON parse error", e);
          }
        }
      }
      setOpenDialog(true);
    } catch (error) {
      toast.error("Erro ao gerar análise de IA.");
    } finally {
      setLoadingAI(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-[1400px] mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Metodologias" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Gestão Visual" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Ferramentas estratégicas para análise de alta performance." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 w-full md:w-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { className: "flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", value: selectedProjectId, onChange: (e) => setSelectedProjectId(e.target.value), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Nenhum Projeto (Rascunho)" }),
            projects.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p.id, children: p.name }, p.id))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: handleLoadBoard, variant: "outline", className: "gap-2", title: "Carregar painel salvo deste projeto", children: "Carregar" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleSaveBoard, className: "bg-primary gap-2 text-primary-foreground", title: "Salvar painel neste projeto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
            " Salvar"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 self-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleAIAnalysis, disabled: loadingAI, variant: "outline", className: "gap-2 border-accent/20 text-accent hover:bg-accent/10 shadow-glow-accent", children: [
            loadingAI ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Brain, { className: "h-4 w-4" }),
            "Sugerir Análise com IA"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleExportPDF, disabled: exportingPDF, className: "bg-gradient-primary gap-2 shadow-glow", children: [
            exportingPDF ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
            exportingPDF ? "Exportando..." : "Exportar para PDF"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "bg-card/50 border border-white/5 p-1 rounded-xl w-fit", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "swot", className: "rounded-lg gap-2", children: "SWOT" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "eisenhower", className: "rounded-lg gap-2", children: "Eisenhower" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "5w2h", className: "rounded-lg gap-2", children: "5W2H" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "pareto", className: "rounded-lg gap-2", children: "Pareto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "smart", className: "rounded-lg gap-2", children: "SMART" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "gut", className: "rounded-lg gap-2", children: "GUT" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "flowchart", className: "rounded-lg gap-2", children: "Fluxograma" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { ref: printRef, className: "mt-6 p-6 border-white/5 bg-card/30 backdrop-blur-sm min-h-[500px] shadow-elegant relative overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "swot", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SwotMatrix, { data: swot, setData: setSwot }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "eisenhower", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EisenhowerMatrix, { tasks: eisenhower, setTasks: setEisenhower }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "5w2h", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FiveWTwoH, { rows: fiveW, setRows: setFiveW }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "pareto", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ParetoDiagram, { data: pareto, setData: setPareto }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "smart", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SmartMatrix, { goal: smart, setGoal: setSmart }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "gut", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(GutMatrix, { issues: gut, setIssues: setGut }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "flowchart", className: "mt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FlowchartTool, { nodes, setNodes, edges, setEdges }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: openDialog, onOpenChange: setOpenDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh] overflow-y-auto bg-sidebar/95 backdrop-blur-xl border-white/10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-3 text-2xl font-display font-bold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-6 w-6 text-accent" }) }),
        "Insights Estratégicos (IA)"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 prose prose-invert prose-accent max-w-none", children: aiResult && /* @__PURE__ */ jsxRuntimeExports.jsx(Markdown, { children: aiResult }) }),
      (suggestedProject || suggestedOKR) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 space-y-4 pt-6 border-t border-white/10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-bold uppercase tracking-widest text-accent", children: "Ações Recomendadas pela IA" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          suggestedProject && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 bg-accent/5 border-accent/20 flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-accent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(FolderKanban, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase", children: "Novo Projeto" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: suggestedProject.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleCreateProject, className: "mt-2 bg-accent text-accent-foreground font-bold", children: "Criar Projeto" })
          ] }),
          suggestedOKR && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-4 bg-primary/5 border-primary/20 flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-primary", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase", children: "Nova Meta / OKR" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: suggestedOKR.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleCreateOKR, className: "mt-2 bg-primary text-primary-foreground font-bold", children: "Adicionar OKR" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { className: "mt-8 border-t border-white/10 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setOpenDialog(false), className: "bg-muted hover:bg-muted/80 text-foreground font-bold", children: "Fechar" }) })
    ] }) })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(VisualManagementPage, {}) });
export {
  SplitComponent as component
};
