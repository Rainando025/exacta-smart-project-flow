import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Presentation, Plus, Eraser, MousePointer2, Type, Square, Circle,
  Diamond, Minus, Download, Share2, Trash2, Pencil, ArrowRight, Wifi, WifiOff
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/whiteboards")({
  component: () => <AppShell><WhiteboardsPage /></AppShell>,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolType = "select" | "pen" | "line" | "arrow" | "rect" | "circle" | "diamond" | "text" | "eraser";

interface Point { x: number; y: number; }

interface WBElement {
  id: string;
  type: ToolType;
  points?: Point[];
  x?: number; y?: number; w?: number; h?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

interface Whiteboard { id: string; title: string; data: any; updated_at: string; }

const COLORS = ["#e2e8f0", "#f472b6", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#a78bfa", "#f87171"];
const STROKE_WIDTHS = [2, 4, 8, 14];

// ─── Main component ───────────────────────────────────────────────────────────
function WhiteboardsPage() {
  const { user } = useAuth();
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [activeBoard, setActiveBoard] = useState<Whiteboard | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [connected, setConnected] = useState(false);

  // Canvas state
  const canvasRef = useRef<SVGSVGElement>(null);
  const [elements, setElements] = useState<WBElement[]>([]);
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#e2e8f0");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Camera (pan & zoom)
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPan = useRef<Point>({ x: 0, y: 0 });

  // Drawing state
  const drawing = useRef(false);
  const currentEl = useRef<WBElement | null>(null);
  const realtimeChannel = useRef<any>(null);

  // ── Load boards ──────────────────────────────────────────────────────────────
  const loadBoards = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("id,title,data,updated_at")
      .eq("type", "whiteboard")
      .order("updated_at", { ascending: false });
    if (data) setBoards(data as Whiteboard[]);
  }, []);

  useEffect(() => { loadBoards(); }, [loadBoards]);

  // ── Open board ───────────────────────────────────────────────────────────────
  const openBoard = useCallback(async (board: Whiteboard) => {
    // Disconnect previous
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }
    setActiveBoard(board);
    const els = board.data?.elements || [];
    setElements(els);
    setListOpen(false);
    setConnected(false);

    // Subscribe to realtime
    const ch = supabase.channel(`whiteboard:${board.id}`)
      .on("broadcast", { event: "elements" }, ({ payload }) => {
        if (payload.sender !== user?.id) {
          setElements(payload.elements);
        }
      })
      .on("broadcast", { event: "cursor" }, () => {
        // future: show remote cursors
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });
    realtimeChannel.current = ch;
  }, [user?.id]);

  // ── Save board ───────────────────────────────────────────────────────────────
  const saveBoard = useCallback(async (els: WBElement[], boardId: string) => {
    await supabase.from("documents")
      .update({ data: { elements: els } as any, updated_at: new Date().toISOString() })
      .eq("id", boardId);
  }, []);

  // Broadcast + save after each meaningful change
  const commitElements = useCallback((els: WBElement[]) => {
    setElements(els);
    if (activeBoard) {
      saveBoard(els, activeBoard.id);
      realtimeChannel.current?.send({
        type: "broadcast",
        event: "elements",
        payload: { elements: els, sender: user?.id },
      });
    }
  }, [activeBoard, saveBoard, user?.id]);

  // ── Create new board ─────────────────────────────────────────────────────────
  const createBoard = async () => {
    if (!newBoardName.trim() || !user) return;
    setCreating(true);
    const { data, error } = await supabase.from("documents").insert({
      title: newBoardName.trim(),
      type: "whiteboard",
      content: "",
      data: { elements: [] },
      owner_id: user.id,
    }).select("id,title,data,updated_at").single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setNewBoardName("");
    await loadBoards();
    if (data) openBoard(data as Whiteboard);
  };

  // ── Coordinate helpers ───────────────────────────────────────────────────────
  const svgCoords = (e: React.PointerEvent): Point => {
    const svg = canvasRef.current!;
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - cam.x) / cam.scale,
      y: (e.clientY - rect.top - cam.y) / cam.scale,
    };
  };

  // ── Pan handlers ─────────────────────────────────────────────────────────────
  const onPanStart = (e: React.PointerEvent) => {
    if (tool !== "select" || e.button !== 0) return;
    // only pan if clicking empty space (not an element)
    const target = e.target as SVGElement;
    if (target.dataset.elId) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };

  const onPanMove = (e: React.PointerEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      setCam((c) => ({ ...c, x: c.x + dx, y: c.y + dy }));
      lastPan.current = { x: e.clientX, y: e.clientY };
    }
  };

  const onPanEnd = () => { isPanning.current = false; };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.93;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setCam((c) => {
      const ns = Math.max(0.15, Math.min(5, c.scale * factor));
      return {
        x: mx - ((mx - c.x) / c.scale) * ns,
        y: my - ((my - c.y) / c.scale) * ns,
        scale: ns,
      };
    });
  };

  // ── Drawing handlers ─────────────────────────────────────────────────────────
  const onDrawStart = (e: React.PointerEvent) => {
    if (tool === "select") { onPanStart(e); return; }
    if (tool === "eraser") return;
    if (tool === "text") {
      const p = svgCoords(e);
      const text = prompt("Texto:");
      if (!text) return;
      const el: WBElement = { id: crypto.randomUUID(), type: "text", x: p.x, y: p.y, text, color, strokeWidth: 1, opacity: 1 };
      commitElements([...elements, el]);
      return;
    }
    drawing.current = true;
    const p = svgCoords(e);
    const el: WBElement = {
      id: crypto.randomUUID(),
      type: tool,
      color,
      strokeWidth,
      opacity: 0.9,
      points: [p],
      x: p.x, y: p.y, w: 0, h: 0,
    };
    currentEl.current = el;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };

  const onDrawMove = (e: React.PointerEvent) => {
    onPanMove(e);
    if (!drawing.current || !currentEl.current) return;
    const p = svgCoords(e);
    const el = currentEl.current;
    if (tool === "pen" || tool === "line" || tool === "arrow") {
      el.points = [...(el.points || []), p];
    } else {
      el.w = p.x - (el.x || 0);
      el.h = p.y - (el.y || 0);
    }
    currentEl.current = { ...el };
    setElements((prev) => {
      const filtered = prev.filter((e) => e.id !== el.id);
      return [...filtered, { ...el }];
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

  const onEraserClick = (id: string) => {
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
    const clone = svg.cloneNode(true) as SVGSVGElement;
    // Remove transform group to export at 1:1
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(clone);
    const blob = new Blob([src], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeBoard?.title || "whiteboard"}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG exportado!");
  };

  // ── Render element ───────────────────────────────────────────────────────────
  const renderEl = (el: WBElement) => {
    const isSelected = selectedId === el.id;
    const sel = isSelected ? { filter: "drop-shadow(0 0 4px #6366f1)" } : {};
    const clickProps = {
      "data-el-id": el.id,
      onClick: () => { if (tool === "select") setSelectedId(el.id); if (tool === "eraser") onEraserClick(el.id); },
      style: sel,
    };

    if (el.type === "pen" && el.points && el.points.length > 1) {
      const d = el.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return <path key={el.id} d={d} stroke={el.color} strokeWidth={el.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} {...clickProps} />;
    }
    if ((el.type === "line" || el.type === "arrow") && el.points && el.points.length >= 2) {
      const p1 = el.points[0];
      const p2 = el.points[el.points.length - 1];
      return (
        <g key={el.id} {...clickProps}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={el.color} strokeWidth={el.strokeWidth} opacity={el.opacity} strokeLinecap="round" />
          {el.type === "arrow" && (() => {
            const dx = p2.x - p1.x; const dy = p2.y - p1.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const ux = dx / len; const uy = dy / len;
            const px = -uy; const py = ux;
            const hs = el.strokeWidth * 4;
            const tip = p2;
            const b1 = { x: tip.x - ux * hs + px * hs * 0.5, y: tip.y - uy * hs + py * hs * 0.5 };
            const b2 = { x: tip.x - ux * hs - px * hs * 0.5, y: tip.y - uy * hs - py * hs * 0.5 };
            return <polygon points={`${tip.x},${tip.y} ${b1.x},${b1.y} ${b2.x},${b2.y}`} fill={el.color} opacity={el.opacity} />;
          })()}
        </g>
      );
    }
    if (el.type === "rect") {
      const x = el.w! < 0 ? (el.x || 0) + el.w! : el.x;
      const y = el.h! < 0 ? (el.y || 0) + el.h! : el.y;
      return <rect key={el.id} x={x} y={y} width={Math.abs(el.w || 0)} height={Math.abs(el.h || 0)} rx={6} stroke={el.color} strokeWidth={el.strokeWidth} fill={el.color + "22"} opacity={el.opacity} {...clickProps} />;
    }
    if (el.type === "circle") {
      const cx = (el.x || 0) + (el.w || 0) / 2;
      const cy = (el.y || 0) + (el.h || 0) / 2;
      const rx = Math.abs((el.w || 0) / 2);
      const ry = Math.abs((el.h || 0) / 2);
      return <ellipse key={el.id} cx={cx} cy={cy} rx={rx} ry={ry} stroke={el.color} strokeWidth={el.strokeWidth} fill={el.color + "22"} opacity={el.opacity} {...clickProps} />;
    }
    if (el.type === "diamond") {
      const cx = (el.x || 0) + (el.w || 0) / 2;
      const cy = (el.y || 0) + (el.h || 0) / 2;
      const hw = Math.abs((el.w || 0) / 2);
      const hh = Math.abs((el.h || 0) / 2);
      const pts = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
      return <polygon key={el.id} points={pts} stroke={el.color} strokeWidth={el.strokeWidth} fill={el.color + "22"} opacity={el.opacity} {...clickProps} />;
    }
    if (el.type === "text") {
      return (
        <text key={el.id} x={el.x} y={el.y} fill={el.color} fontSize={16 + el.strokeWidth * 2} fontFamily="Inter, sans-serif" opacity={el.opacity} {...clickProps}>
          {el.text}
        </text>
      );
    }
    return null;
  };

  // ── Toolbar tools config ─────────────────────────────────────────────────────
  const tools: { id: ToolType; icon: any; label: string }[] = [
    { id: "select", icon: MousePointer2, label: "Selecionar / Mover (V)" },
    { id: "pen", icon: Pencil, label: "Caneta livre (P)" },
    { id: "line", icon: Minus, label: "Linha reta (L)" },
    { id: "arrow", icon: ArrowRight, label: "Seta (A)" },
    { id: "rect", icon: Square, label: "Retângulo (R)" },
    { id: "circle", icon: Circle, label: "Elipse / Círculo (C)" },
    { id: "diamond", icon: Diamond, label: "Losango / Decisão (D)" },
    { id: "text", icon: Type, label: "Texto (T)" },
    { id: "eraser", icon: Eraser, label: "Borracha (E)" },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const map: Record<string, ToolType> = { v: "select", p: "pen", l: "line", a: "arrow", r: "rect", c: "circle", d: "diamond", t: "text", e: "eraser" };
    const handler = (ev: KeyboardEvent) => {
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

  // ── Board list screen ────────────────────────────────────────────────────────
  if (!activeBoard) {
    return (
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-accent font-medium uppercase tracking-wider">Colaboração</p>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Quadros Brancos</h1>
            <p className="text-muted-foreground mt-2">Crie e edite quadros colaborativos em tempo real.</p>
          </div>
          <Button onClick={() => setListOpen(true)} className="bg-gradient-primary text-primary-foreground shadow-elegant gap-2">
            <Plus className="h-4 w-4" /> Novo Quadro
          </Button>
        </header>

        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="h-20 w-20 rounded-2xl bg-accent/10 flex items-center justify-center">
              <Presentation className="h-10 w-10 text-accent" />
            </div>
            <h2 className="text-xl font-display font-bold">Nenhum quadro ainda</h2>
            <p className="text-muted-foreground max-w-xs">Crie seu primeiro quadro branco para brainstorming visual e colaboração em equipe.</p>
            <Button onClick={() => setListOpen(true)} className="bg-gradient-primary text-primary-foreground gap-2 mt-2">
              <Plus className="h-4 w-4" /> Criar Quadro
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((b) => (
              <button
                key={b.id}
                onClick={() => openBoard(b)}
                className="group text-left p-5 rounded-2xl border border-white/5 bg-card hover:border-accent/30 hover:shadow-elegant transition-all duration-200 space-y-3"
              >
                <div className="h-28 rounded-xl bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] border border-white/5 flex items-center justify-center overflow-hidden">
                  {(b.data?.elements?.length || 0) > 0 ? (
                    <svg viewBox="-200 -200 400 400" className="w-full h-full opacity-50 group-hover:opacity-70 transition">
                      {(b.data.elements as WBElement[]).slice(0, 20).map(renderEl)}
                    </svg>
                  ) : (
                    <Presentation className="h-10 w-10 text-muted-foreground/20" />
                  )}
                </div>
                <div>
                  <p className="font-display font-bold group-hover:text-accent transition">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {b.data?.elements?.length || 0} elemento(s) • {new Date(b.updated_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        <Dialog open={listOpen} onOpenChange={setListOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Presentation className="h-5 w-5 text-accent" />Novo Quadro Branco</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Nome do quadro, ex: Brainstorming Sprint 4"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createBoard()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setListOpen(false)}>Cancelar</Button>
              <Button onClick={createBoard} disabled={creating || !newBoardName.trim()} className="bg-gradient-primary text-primary-foreground">
                {creating ? "Criando…" : "Criar Quadro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ── Active whiteboard canvas ─────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-background/90 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveBoard(null)}
            className="text-muted-foreground hover:text-foreground transition text-xs underline underline-offset-2"
          >
            ← Quadros
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
            <Presentation className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">{activeBoard.title}</h1>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              {connected ? <><Wifi className="h-3 w-3 text-success" /><span className="text-success">Ao vivo</span></> : <><WifiOff className="h-3 w-3" />Conectando…</>}
              {" · "}{elements.length} elemento(s)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearAll} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" /> Limpar
          </Button>
          <Button variant="outline" size="sm" onClick={exportSVG} className="gap-1">
            <Download className="h-3.5 w-3.5" /> Exportar
          </Button>
          <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
            {Math.round(cam.scale * 100)}%
          </span>
          <Button size="sm" onClick={() => setCam({ x: 0, y: 0, scale: 1 })} variant="ghost" className="text-xs">Reset</Button>
        </div>
      </header>

      {/* Canvas area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Side toolbar */}
        <aside className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 p-2 rounded-2xl border border-white/10 bg-card/85 backdrop-blur-xl shadow-elegant">
          {tools.map((t) => (
            <button
              key={t.id}
              title={t.label}
              onClick={() => setTool(t.id)}
              className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                tool === t.id
                  ? "bg-accent/20 text-accent shadow-inner"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}

          <div className="h-px bg-white/10 my-1 w-8 mx-auto" />

          {/* Colors */}
          <div className="flex flex-col gap-1.5 items-center">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "h-5 w-5 rounded-full transition-transform hover:scale-110",
                  color === c ? "ring-2 ring-offset-1 ring-foreground scale-110" : ""
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="h-px bg-white/10 my-1 w-8 mx-auto" />

          {/* Stroke widths */}
          {STROKE_WIDTHS.map((sw) => (
            <button
              key={sw}
              onClick={() => setStrokeWidth(sw)}
              title={`Espessura ${sw}px`}
              className={cn(
                "h-8 w-10 flex items-center justify-center rounded-lg transition",
                strokeWidth === sw ? "bg-accent/20 text-accent" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <div className="rounded-full bg-current" style={{ width: "80%", height: Math.max(1, sw / 2) }} />
            </button>
          ))}
        </aside>

        {/* SVG canvas */}
        <svg
          ref={canvasRef}
          className={cn(
            "flex-1 w-full h-full",
            tool === "pen" || tool === "line" || tool === "arrow" ? "cursor-crosshair" :
            tool === "rect" || tool === "circle" || tool === "diamond" ? "cursor-crosshair" :
            tool === "eraser" ? "cursor-cell" :
            tool === "text" ? "cursor-text" :
            "cursor-grab active:cursor-grabbing"
          )}
          style={{
            background: "radial-gradient(circle, hsl(var(--muted) / 0.3) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          onPointerDown={onDrawStart}
          onPointerMove={onDrawMove}
          onPointerUp={onDrawEnd}
          onPointerLeave={onDrawEnd}
          onWheel={onWheel}
        >
          <defs>
            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="0.5" fill="hsl(var(--muted-foreground) / 0.2)" />
            </pattern>
          </defs>
          <g transform={`translate(${cam.x}, ${cam.y}) scale(${cam.scale})`}>
            {elements.map(renderEl)}
          </g>
        </svg>

        {/* Zoom controls */}
        <div className="absolute bottom-5 right-5 flex items-center gap-1 p-1.5 rounded-xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant z-20">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-sm" onClick={() => setCam((c) => ({ ...c, scale: Math.max(0.15, c.scale * 0.85) }))}>−</Button>
          <button onClick={() => setCam({ x: 0, y: 0, scale: 1 })} className="text-xs font-mono px-2 py-1 hover:bg-muted rounded transition">{Math.round(cam.scale * 100)}%</button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-sm" onClick={() => setCam((c) => ({ ...c, scale: Math.min(5, c.scale * 1.15) }))}>+</Button>
        </div>
      </div>
    </div>
  );
}
