import { I as jsxRuntimeExports, S as reactExports } from "./index.mjs";
import { A as AppShell, P as Plus, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { ak as useAuth, ai as supabase, b as Button, D as Dialog, o as DialogContent, r as DialogHeader, s as DialogTitle, q as DialogFooter, j as Circle, a3 as cn, aj as toast, a8 as createLucideIcon } from "./router-Bktayy9l.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { P as Presentation } from "./users-C5uEgJff.mjs";
import { W as Wifi } from "./wifi-DYien79u.mjs";
import { D as Download } from "./download-DABr9rdP.mjs";
import { P as Pencil } from "./pencil-BPpfGdWw.mjs";
import { M as Minus, D as Diamond, T as Type } from "./type-BFTQMOAW.mjs";
import { A as ArrowRight } from "./arrow-right-DEuSowZh.mjs";
import { S as Square } from "./square-iGDjZ9I9.mjs";
import "node:events";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
import "node:path";
import "node:url";
import "./target-BBkqu7Bi.mjs";
const __iconNode$2 = [
  [
    "path",
    {
      d: "M21 21H8a2 2 0 0 1-1.42-.587l-3.994-3.999a2 2 0 0 1 0-2.828l10-10a2 2 0 0 1 2.829 0l5.999 6a2 2 0 0 1 0 2.828L12.834 21",
      key: "g5wo59"
    }
  ],
  ["path", { d: "m5.082 11.09 8.828 8.828", key: "1wx5vj" }]
];
const Eraser = createLucideIcon("eraser", __iconNode$2);
const __iconNode$1 = [
  [
    "path",
    {
      d: "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",
      key: "edeuup"
    }
  ]
];
const MousePointer2 = createLucideIcon("mouse-pointer-2", __iconNode$1);
const __iconNode = [
  ["path", { d: "M12 20h.01", key: "zekei9" }],
  ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }],
  ["path", { d: "M5 12.859a10 10 0 0 1 5.17-2.69", key: "1dl1wf" }],
  ["path", { d: "M19 12.859a10 10 0 0 0-2.007-1.523", key: "4k23kn" }],
  ["path", { d: "M2 8.82a15 15 0 0 1 4.177-2.643", key: "1grhjp" }],
  ["path", { d: "M22 8.82a15 15 0 0 0-11.288-3.764", key: "z3jwby" }],
  ["path", { d: "m2 2 20 20", key: "1ooewy" }]
];
const WifiOff = createLucideIcon("wifi-off", __iconNode);
const COLORS = ["#e2e8f0", "#f472b6", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#a78bfa", "#f87171"];
const STROKE_WIDTHS = [2, 4, 8, 14];
function WhiteboardsPage() {
  const {
    user
  } = useAuth();
  const [boards, setBoards] = reactExports.useState([]);
  const [activeBoard, setActiveBoard] = reactExports.useState(null);
  const [listOpen, setListOpen] = reactExports.useState(false);
  const [newBoardName, setNewBoardName] = reactExports.useState("");
  const [creating, setCreating] = reactExports.useState(false);
  const [connected, setConnected] = reactExports.useState(false);
  const canvasRef = reactExports.useRef(null);
  const [elements, setElements] = reactExports.useState([]);
  const [tool, setTool] = reactExports.useState("pen");
  const [color, setColor] = reactExports.useState("#e2e8f0");
  const [strokeWidth, setStrokeWidth] = reactExports.useState(3);
  const [selectedId, setSelectedId] = reactExports.useState(null);
  const [cam, setCam] = reactExports.useState({
    x: 0,
    y: 0,
    scale: 1
  });
  const isPanning = reactExports.useRef(false);
  const lastPan = reactExports.useRef({
    x: 0,
    y: 0
  });
  const drawing = reactExports.useRef(false);
  const currentEl = reactExports.useRef(null);
  const realtimeChannel = reactExports.useRef(null);
  const loadBoards = reactExports.useCallback(async () => {
    const {
      data
    } = await supabase.from("documents").select("id,title,data,updated_at").eq("type", "whiteboard").order("updated_at", {
      ascending: false
    });
    if (data) setBoards(data);
  }, []);
  reactExports.useEffect(() => {
    loadBoards();
  }, [loadBoards]);
  const openBoard = reactExports.useCallback(async (board) => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }
    setActiveBoard(board);
    const els = board.data?.elements || [];
    setElements(els);
    setListOpen(false);
    setConnected(false);
    const ch = supabase.channel(`whiteboard:${board.id}`).on("broadcast", {
      event: "elements"
    }, ({
      payload
    }) => {
      if (payload.sender !== user?.id) {
        setElements(payload.elements);
      }
    }).on("broadcast", {
      event: "cursor"
    }, () => {
    }).subscribe((status) => {
      setConnected(status === "SUBSCRIBED");
    });
    realtimeChannel.current = ch;
  }, [user?.id]);
  const saveBoard = reactExports.useCallback(async (els, boardId) => {
    await supabase.from("documents").update({
      data: {
        elements: els
      },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", boardId);
  }, []);
  const commitElements = reactExports.useCallback((els) => {
    setElements(els);
    if (activeBoard) {
      saveBoard(els, activeBoard.id);
      realtimeChannel.current?.send({
        type: "broadcast",
        event: "elements",
        payload: {
          elements: els,
          sender: user?.id
        }
      });
    }
  }, [activeBoard, saveBoard, user?.id]);
  const createBoard = async () => {
    if (!newBoardName.trim() || !user) return;
    setCreating(true);
    const {
      data,
      error
    } = await supabase.from("documents").insert({
      title: newBoardName.trim(),
      type: "whiteboard",
      content: "",
      data: {
        elements: []
      },
      owner_id: user.id
    }).select("id,title,data,updated_at").single();
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewBoardName("");
    await loadBoards();
    if (data) openBoard(data);
  };
  const svgCoords = (e) => {
    const svg = canvasRef.current;
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - cam.x) / cam.scale,
      y: (e.clientY - rect.top - cam.y) / cam.scale
    };
  };
  const onPanStart = (e) => {
    if (tool !== "select" || e.button !== 0) return;
    const target = e.target;
    if (target.dataset.elId) return;
    isPanning.current = true;
    lastPan.current = {
      x: e.clientX,
      y: e.clientY
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPanMove = (e) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      setCam((c) => ({
        ...c,
        x: c.x + dx,
        y: c.y + dy
      }));
      lastPan.current = {
        x: e.clientX,
        y: e.clientY
      };
    }
  };
  const onPanEnd = () => {
    isPanning.current = false;
  };
  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.93;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setCam((c) => {
      const ns = Math.max(0.15, Math.min(5, c.scale * factor));
      return {
        x: mx - (mx - c.x) / c.scale * ns,
        y: my - (my - c.y) / c.scale * ns,
        scale: ns
      };
    });
  };
  const onDrawStart = (e) => {
    if (tool === "select") {
      onPanStart(e);
      return;
    }
    if (tool === "eraser") return;
    if (tool === "text") {
      const p2 = svgCoords(e);
      const text = prompt("Texto:");
      if (!text) return;
      const el2 = {
        id: crypto.randomUUID(),
        type: "text",
        x: p2.x,
        y: p2.y,
        text,
        color,
        strokeWidth: 1,
        opacity: 1
      };
      commitElements([...elements, el2]);
      return;
    }
    drawing.current = true;
    const p = svgCoords(e);
    const el = {
      id: crypto.randomUUID(),
      type: tool,
      color,
      strokeWidth,
      opacity: 0.9,
      points: [p],
      x: p.x,
      y: p.y,
      w: 0,
      h: 0
    };
    currentEl.current = el;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDrawMove = (e) => {
    onPanMove(e);
    if (!drawing.current || !currentEl.current) return;
    const p = svgCoords(e);
    const el = currentEl.current;
    if (tool === "pen" || tool === "line" || tool === "arrow") {
      el.points = [...el.points || [], p];
    } else {
      el.w = p.x - (el.x || 0);
      el.h = p.y - (el.y || 0);
    }
    currentEl.current = {
      ...el
    };
    setElements((prev) => {
      const filtered = prev.filter((e2) => e2.id !== el.id);
      return [...filtered, {
        ...el
      }];
    });
  };
  const onDrawEnd = () => {
    onPanEnd();
    if (!drawing.current || !currentEl.current) return;
    drawing.current = false;
    const el = currentEl.current;
    currentEl.current = null;
    commitElements([...elements.filter((e) => e.id !== el.id), el]);
  };
  const onEraserClick = (id) => {
    if (tool === "eraser") {
      commitElements(elements.filter((e) => e.id !== id));
    }
  };
  const clearAll = () => {
    if (!confirm("Apagar todos os elementos do quadro?")) return;
    commitElements([]);
  };
  const exportSVG = () => {
    const svg = canvasRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true);
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(clone);
    const blob = new Blob([src], {
      type: "image/svg+xml"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeBoard?.title || "whiteboard"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG exportado!");
  };
  const renderEl = (el) => {
    const isSelected = selectedId === el.id;
    const sel = isSelected ? {
      filter: "drop-shadow(0 0 4px #6366f1)"
    } : {};
    const clickProps = {
      "data-el-id": el.id,
      onClick: () => {
        if (tool === "select") setSelectedId(el.id);
        if (tool === "eraser") onEraserClick(el.id);
      },
      style: sel
    };
    if (el.type === "pen" && el.points && el.points.length > 1) {
      const d = el.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d, stroke: el.color, strokeWidth: el.strokeWidth, fill: "none", strokeLinecap: "round", strokeLinejoin: "round", opacity: el.opacity, ...clickProps }, el.id);
    }
    if ((el.type === "line" || el.type === "arrow") && el.points && el.points.length >= 2) {
      const p1 = el.points[0];
      const p2 = el.points[el.points.length - 1];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("g", { ...clickProps, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: el.color, strokeWidth: el.strokeWidth, opacity: el.opacity, strokeLinecap: "round" }),
        el.type === "arrow" && (() => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const px = -uy;
          const py = ux;
          const hs = el.strokeWidth * 4;
          const tip = p2;
          const b1 = {
            x: tip.x - ux * hs + px * hs * 0.5,
            y: tip.y - uy * hs + py * hs * 0.5
          };
          const b2 = {
            x: tip.x - ux * hs - px * hs * 0.5,
            y: tip.y - uy * hs - py * hs * 0.5
          };
          return /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: `${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`, fill: el.color, opacity: el.opacity });
        })()
      ] }, el.id);
    }
    if (el.type === "rect") {
      const x = el.w < 0 ? (el.x || 0) + el.w : el.x;
      const y = el.h < 0 ? (el.y || 0) + el.h : el.y;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x, y, width: Math.abs(el.w || 0), height: Math.abs(el.h || 0), rx: 6, stroke: el.color, strokeWidth: el.strokeWidth, fill: el.color + "22", opacity: el.opacity, ...clickProps }, el.id);
    }
    if (el.type === "circle") {
      const cx = (el.x || 0) + (el.w || 0) / 2;
      const cy = (el.y || 0) + (el.h || 0) / 2;
      const rx = Math.abs((el.w || 0) / 2);
      const ry = Math.abs((el.h || 0) / 2);
      return /* @__PURE__ */ jsxRuntimeExports.jsx("ellipse", { cx, cy, rx, ry, stroke: el.color, strokeWidth: el.strokeWidth, fill: el.color + "22", opacity: el.opacity, ...clickProps }, el.id);
    }
    if (el.type === "diamond") {
      const cx = (el.x || 0) + (el.w || 0) / 2;
      const cy = (el.y || 0) + (el.h || 0) / 2;
      const hw = Math.abs((el.w || 0) / 2);
      const hh = Math.abs((el.h || 0) / 2);
      const pts = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: pts, stroke: el.color, strokeWidth: el.strokeWidth, fill: el.color + "22", opacity: el.opacity, ...clickProps }, el.id);
    }
    if (el.type === "text") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("text", { x: el.x, y: el.y, fill: el.color, fontSize: 16 + el.strokeWidth * 2, fontFamily: "Inter, sans-serif", opacity: el.opacity, ...clickProps, children: el.text }, el.id);
    }
    return null;
  };
  const tools = [{
    id: "select",
    icon: MousePointer2,
    label: "Selecionar / Mover (V)"
  }, {
    id: "pen",
    icon: Pencil,
    label: "Caneta livre (P)"
  }, {
    id: "line",
    icon: Minus,
    label: "Linha reta (L)"
  }, {
    id: "arrow",
    icon: ArrowRight,
    label: "Seta (A)"
  }, {
    id: "rect",
    icon: Square,
    label: "Retângulo (R)"
  }, {
    id: "circle",
    icon: Circle,
    label: "Elipse / Círculo (C)"
  }, {
    id: "diamond",
    icon: Diamond,
    label: "Losango / Decisão (D)"
  }, {
    id: "text",
    icon: Type,
    label: "Texto (T)"
  }, {
    id: "eraser",
    icon: Eraser,
    label: "Borracha (E)"
  }];
  reactExports.useEffect(() => {
    const map = {
      v: "select",
      p: "pen",
      l: "line",
      a: "arrow",
      r: "rect",
      c: "circle",
      d: "diamond",
      t: "text",
      e: "eraser"
    };
    const handler = (ev) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      if (map[ev.key.toLowerCase()]) setTool(map[ev.key.toLowerCase()]);
      if (ev.key === "Delete" || ev.key === "Backspace") {
        if (selectedId) {
          commitElements(elements.filter((e) => e.id !== selectedId));
          setSelectedId(null);
        }
      }
      if ((ev.ctrlKey || ev.metaKey) && ev.key === "z") {
        commitElements(elements.slice(0, -1));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [elements, selectedId, commitElements]);
  if (!activeBoard) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-wrap items-end justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-accent font-medium uppercase tracking-wider", children: "Colaboração" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl lg:text-4xl font-bold mt-1", children: "Quadros Brancos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mt-2", children: "Crie e edite quadros colaborativos em tempo real." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setListOpen(true), className: "bg-gradient-primary text-primary-foreground shadow-elegant gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Novo Quadro"
        ] })
      ] }),
      boards.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-24 text-center space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Presentation, { className: "h-10 w-10 text-accent" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-display font-bold", children: "Nenhum quadro ainda" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground max-w-xs", children: "Crie seu primeiro quadro branco para brainstorming visual e colaboração em equipe." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setListOpen(true), className: "bg-gradient-primary text-primary-foreground gap-2 mt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
          " Criar Quadro"
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-4", children: boards.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => openBoard(b), className: "group text-left p-5 rounded-2xl border border-white/5 bg-card hover:border-accent/30 hover:shadow-elegant transition-all duration-200 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-28 rounded-xl bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] border border-white/5 flex items-center justify-center overflow-hidden", children: (b.data?.elements?.length || 0) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "-200 -200 400 400", className: "w-full h-full opacity-50 group-hover:opacity-70 transition", children: b.data.elements.slice(0, 20).map(renderEl) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Presentation, { className: "h-10 w-10 text-muted-foreground/20" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-display font-bold group-hover:text-accent transition", children: b.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [
            b.data?.elements?.length || 0,
            " elemento(s) • ",
            new Date(b.updated_at).toLocaleDateString("pt-BR")
          ] })
        ] })
      ] }, b.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: listOpen, onOpenChange: setListOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Presentation, { className: "h-5 w-5 text-accent" }),
          "Novo Quadro Branco"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Nome do quadro, ex: Brainstorming Sprint 4", value: newBoardName, onChange: (e) => setNewBoardName(e.target.value), onKeyDown: (e) => e.key === "Enter" && createBoard() }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: () => setListOpen(false), children: "Cancelar" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: createBoard, disabled: creating || !newBoardName.trim(), className: "bg-gradient-primary text-primary-foreground", children: creating ? "Criando…" : "Criar Quadro" })
        ] })
      ] }) })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-[calc(100vh-theme(spacing.16))] flex flex-col overflow-hidden select-none", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between px-5 py-3 border-b border-white/5 bg-background/90 backdrop-blur-md z-20 shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setActiveBoard(null), className: "text-muted-foreground hover:text-foreground transition text-xs underline underline-offset-2", children: "← Quadros" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-px bg-border" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-1.5 rounded-lg bg-purple-500/10 text-purple-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Presentation, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-base font-bold leading-tight", children: activeBoard.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-muted-foreground flex items-center gap-1", children: [
            connected ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-3 w-3 text-success" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-success", children: "Ao vivo" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "h-3 w-3" }),
              "Conectando…"
            ] }),
            " · ",
            elements.length,
            " elemento(s)"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: clearAll, className: "gap-1 text-destructive border-destructive/30 hover:bg-destructive/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }),
          " Limpar"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportSVG, className: "gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-3.5 w-3.5" }),
          " Exportar"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded", children: [
          Math.round(cam.scale * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => setCam({
          x: 0,
          y: 0,
          scale: 1
        }), variant: "ghost", className: "text-xs", children: "Reset" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-hidden relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 p-2 rounded-2xl border border-white/10 bg-card/85 backdrop-blur-xl shadow-elegant", children: [
        tools.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { title: t.label, onClick: () => setTool(t.id), className: cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", tool === t.id ? "bg-accent/20 text-accent shadow-inner" : "text-muted-foreground hover:text-foreground hover:bg-muted"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(t.icon, { className: "h-4 w-4" }) }, t.id)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-white/10 my-1 w-8 mx-auto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1.5 items-center", children: COLORS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setColor(c), className: cn("h-5 w-5 rounded-full transition-transform hover:scale-110", color === c ? "ring-2 ring-offset-1 ring-foreground scale-110" : ""), style: {
          backgroundColor: c
        } }, c)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-white/10 my-1 w-8 mx-auto" }),
        STROKE_WIDTHS.map((sw) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setStrokeWidth(sw), title: `Espessura ${sw}px`, className: cn("h-8 w-10 flex items-center justify-center rounded-lg transition", strokeWidth === sw ? "bg-accent/20 text-accent" : "text-muted-foreground hover:bg-muted"), children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-current", style: {
          width: "80%",
          height: Math.max(1, sw / 2)
        } }) }, sw))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { ref: canvasRef, className: cn("flex-1 w-full h-full", tool === "pen" || tool === "line" || tool === "arrow" ? "cursor-crosshair" : tool === "rect" || tool === "circle" || tool === "diamond" ? "cursor-crosshair" : tool === "eraser" ? "cursor-cell" : tool === "text" ? "cursor-text" : "cursor-grab active:cursor-grabbing"), style: {
        background: "radial-gradient(circle, hsl(var(--muted) / 0.3) 1px, transparent 1px)",
        backgroundSize: "24px 24px"
      }, onPointerDown: onDrawStart, onPointerMove: onDrawMove, onPointerUp: onDrawEnd, onPointerLeave: onDrawEnd, onWheel, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("pattern", { id: "grid", width: "24", height: "24", patternUnits: "userSpaceOnUse", children: /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "0", cy: "0", r: "0.5", fill: "hsl(var(--muted-foreground) / 0.2)" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("g", { transform: `translate(${cam.x}, ${cam.y}) scale(${cam.scale})`, children: elements.map(renderEl) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-5 right-5 flex items-center gap-1 p-1.5 rounded-xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant z-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-sm", onClick: () => setCam((c) => ({
          ...c,
          scale: Math.max(0.15, c.scale * 0.85)
        })), children: "−" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setCam({
          x: 0,
          y: 0,
          scale: 1
        }), className: "text-xs font-mono px-2 py-1 hover:bg-muted rounded transition", children: [
          Math.round(cam.scale * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-sm", onClick: () => setCam((c) => ({
          ...c,
          scale: Math.min(5, c.scale * 1.15)
        })), children: "+" })
      ] })
    ] })
  ] });
}
const SplitComponent = () => /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(WhiteboardsPage, {}) });
export {
  SplitComponent as component
};
