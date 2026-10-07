import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Presentation, Plus, Eraser, MousePointer2, Type, Square, Circle,
  Diamond, Minus, Download, Share2, Trash2, Pencil, ArrowRight, Wifi, WifiOff,
  Paintbrush, PenTool, Sparkles, Feather, Layers, Check, X
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RichColorPicker } from "@/components/ui/color-picker";
import { ProjectSelector } from "@/components/ProjectSelector";

export const Route = createFileRoute("/whiteboards")({
  component: () => <AppShell><WhiteboardsPage /></AppShell>,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type ToolType = "select" | "pencil" | "pen" | "calligraphy" | "brush" | "spray" | "line" | "arrow" | "rect" | "circle" | "diamond" | "text" | "eraser";

interface Point { x: number; y: number; }

interface SprayDot { x: number; y: number; r: number; }

interface WBElement {
  id: string;
  type: ToolType;
  points?: Point[];
  sprayDots?: SprayDot[];
  x?: number; y?: number; w?: number; h?: number;
  text?: string;
  color: string;
  strokeWidth: number;
  opacity: number;
}

interface Whiteboard {
  id: string;
  title: string;
  data: any;
  project_id?: string | null;
  updated_at: string;
}

const STROKE_WIDTHS = [2, 4, 8, 14];

// ─── Main component ───────────────────────────────────────────────────────────
function WhiteboardsPage() {
  const { user } = useAuth();
  const { selectedProjectId, selectedProject } = useProject();
  const [boards, setBoards] = useState<Whiteboard[]>([]);
  const [activeBoard, setActiveBoard] = useState<Whiteboard | null>(null);
  const activeBoardRef = useRef<Whiteboard | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Canvas state
  const canvasRef = useRef<SVGSVGElement>(null);
  const [elements, setElements] = useState<WBElement[]>([]);
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("#e2e8f0");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Inline text editing state (no prompt window)
  const [inlineText, setInlineText] = useState<{
    id?: string;
    x: number;
    y: number;
    text: string;
    isNew: boolean;
  } | null>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);

  // Camera (pan & zoom)
  const [cam, setCam] = useState({ x: 0, y: 0, scale: 1 });
  const isPanning = useRef(false);
  const lastPan = useRef<Point>({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Dragging elements state
  const draggingRef = useRef<{
    id: string;
    startPoint: Point;
    initialX: number;
    initialY: number;
    initialPoints?: Point[];
    initialSprayDots?: SprayDot[];
  } | null>(null);

  const isEraserActive = tool === "eraser";
  const isEraserRubbing = useRef(false);

  // Wheel listener
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
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
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  // Drawing state
  const drawing = useRef(false);
  const currentEl = useRef<WBElement | null>(null);
  const realtimeChannel = useRef<any>(null);

  // ── Load boards ──────────────────────────────────────────────────────────────
  const loadBoards = useCallback(async () => {
    let query = supabase
      .from("documents")
      .select("id,title,data,project_id,updated_at")
      .eq("type", "whiteboard")
      .order("updated_at", { ascending: false });

    if (selectedProjectId !== "all") {
      query = query.eq("project_id", selectedProjectId);
    }

    const { data } = await query;
    if (data) setBoards(data as Whiteboard[]);
  }, [selectedProjectId]);

  useEffect(() => { loadBoards(); }, [loadBoards]);

  // Auto select first board if active is null or not in list
  useEffect(() => {
    if (boards.length > 0 && (!activeBoard || !boards.some(b => b.id === activeBoard.id))) {
      openBoard(boards[0]);
    }
  }, [boards]);

  // ── Open board ───────────────────────────────────────────────────────────────
  const openBoard = useCallback(async (board: Whiteboard) => {
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }
    setActiveBoard(board);
    activeBoardRef.current = board;
    const els = board.data?.elements || [];
    setElements(els);
    setListOpen(false);
    setConnected(false);
    setSaveStatus("saved");

    const ch = supabase.channel(`whiteboard:${board.id}`)
      .on("broadcast", { event: "elements" }, ({ payload }) => {
        if (payload.sender !== user?.id) {
          setElements(payload.elements);
        }
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });
    realtimeChannel.current = ch;
  }, [user?.id]);

  // ── Save board ───────────────────────────────────────────────────────────────
  const saveBoard = useCallback(async (els: WBElement[], boardId: string) => {
    setSaveStatus("saving");
    await supabase.from("documents")
      .update({ data: { elements: els } as any, updated_at: new Date().toISOString() })
      .eq("id", boardId);
    setSaveStatus("saved");
  }, []);

  // ── Auto-create board if none exists when user starts drawing ─────────────────
  const autoEnsureBoard = useCallback(async (): Promise<Whiteboard | null> => {
    if (activeBoardRef.current) return activeBoardRef.current;
    if (!user) return null;

    const projectId = selectedProjectId !== "all" ? selectedProjectId : null;
    const title = projectId
      ? `Quadro - ${new Date().toLocaleDateString("pt-BR")}`
      : `Rascunho - ${new Date().toLocaleDateString("pt-BR")}`;

    const { data, error } = await supabase.from("documents").insert({
      title,
      type: "whiteboard",
      content: "",
      data: { elements: [] },
      owner_id: user.id,
      project_id: projectId,
    }).select("id,title,data,project_id,updated_at").single();

    if (error || !data) return null;
    const board = data as Whiteboard;
    setBoards((prev) => [board, ...prev]);
    setActiveBoard(board);
    activeBoardRef.current = board;
    setSaveStatus("saved");
    toast.success(projectId ? `Quadro criado e vinculado ao projeto!` : `Quadro criado como rascunho.`);
    return board;
  }, [user, selectedProjectId]);

  const commitElements = useCallback((els: WBElement[]) => {
    setElements(els);
    const board = activeBoardRef.current;
    if (board) {
      saveBoard(els, board.id);
      realtimeChannel.current?.send({
        type: "broadcast",
        event: "elements",
        payload: { elements: els, sender: user?.id },
      });
    }
  }, [saveBoard, user?.id]);

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
      project_id: selectedProjectId !== "all" ? selectedProjectId : null,
    }).select("id,title,data,project_id,updated_at").single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    setNewBoardName("");
    await loadBoards();
    if (data) openBoard(data as Whiteboard);
  };

  // ── Delete board ─────────────────────────────────────────────────────────────
  const deleteBoard = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Excluir este quadro permanentemente? Todo o conteúdo será perdido.")) return;
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir quadro: " + error.message); return; }
    toast.success("Quadro excluído!");
    if (activeBoard?.id === id) setActiveBoard(null);
    await loadBoards();
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

  // ── Erase element helper ─────────────────────────────────────────────────────
  const eraseElement = (id: string) => {
    commitElements(elements.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // ── Pan handlers ─────────────────────────────────────────────────────────────
  const onPanStart = (e: React.PointerEvent) => {
    if (tool !== "select" || e.button !== 0) return;
    const target = e.target as SVGElement;
    if (target.dataset.elId) return; // Clicking an element starts dragging element instead of pan
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

  // ── Element Dragging Handlers ────────────────────────────────────────────────
  const onElementPointerDown = (el: WBElement, e: React.PointerEvent) => {
    e.stopPropagation();
    
    // If Eraser tool is active -> erase immediately
    if (tool === "eraser") {
      eraseElement(el.id);
      isEraserRubbing.current = true;
      return;
    }

    // If Text tool active and clicked text -> edit text directly inline
    if (tool === "text" || (tool === "select" && e.detail === 2 && el.type === "text")) {
      startInlineTextEdit(el);
      return;
    }

    if (tool === "select") {
      setSelectedId(el.id);
      const p = svgCoords(e);
      draggingRef.current = {
        id: el.id,
        startPoint: p,
        initialX: el.x || 0,
        initialY: el.y || 0,
        initialPoints: el.points ? [...el.points.map(pt => ({ ...pt }))] : undefined,
        initialSprayDots: el.sprayDots ? [...el.sprayDots.map(s => ({ ...s }))] : undefined,
      };
      (e.currentTarget as SVGElement).setPointerCapture(e.pointerId);
    }
  };

  const onElementPointerMove = (el: WBElement, e: React.PointerEvent) => {
    if (tool === "eraser" && isEraserRubbing.current) {
      eraseElement(el.id);
    }
  };

  // ── Inline Text Editor Helper ────────────────────────────────────────────────
  const startInlineTextEdit = (el?: WBElement, point?: Point) => {
    if (el) {
      setInlineText({
        id: el.id,
        x: el.x || 0,
        y: el.y || 0,
        text: el.text || "",
        isNew: false,
      });
    } else if (point) {
      setInlineText({
        x: point.x,
        y: point.y,
        text: "",
        isNew: true,
      });
    }
    setTimeout(() => {
      inlineInputRef.current?.focus();
    }, 50);
  };

  const commitInlineText = () => {
    if (!inlineText) return;
    const trimmed = inlineText.text.trim();

    if (inlineText.isNew) {
      if (trimmed) {
        const newEl: WBElement = {
          id: crypto.randomUUID(),
          type: "text",
          x: inlineText.x,
          y: inlineText.y,
          text: trimmed,
          color,
          strokeWidth,
          opacity: 1,
        };
        commitElements([...elements, newEl]);
      }
    } else if (inlineText.id) {
      if (!trimmed) {
        // Empty text -> delete element
        commitElements(elements.filter((e) => e.id !== inlineText.id));
      } else {
        // Update text
        commitElements(
          elements.map((e) => (e.id === inlineText.id ? { ...e, text: trimmed } : e))
        );
      }
    }
    setInlineText(null);
  };

  // ── Drawing handlers ─────────────────────────────────────────────────────────
  const onDrawStart = async (e: React.PointerEvent) => {
    if (tool === "select") {
      const target = e.target as SVGElement;
      if (!target.dataset.elId) {
        setSelectedId(null);
        onPanStart(e);
      }
      return;
    }

    if (tool === "eraser") {
      isEraserRubbing.current = true;
      return;
    }

    // Auto-create board if none exists
    if (!activeBoardRef.current) {
      await autoEnsureBoard();
    }

    if (tool === "text") {
      const p = svgCoords(e);
      startInlineTextEdit(undefined, p);
      return;
    }

    drawing.current = true;
    const p = svgCoords(e);
    let initialDots: SprayDot[] = [];
    if (tool === "spray") {
      for (let i = 0; i < 14; i++) {
        const offsetR = Math.random() * strokeWidth * 3.5;
        const angle = Math.random() * Math.PI * 2;
        initialDots.push({
          x: p.x + Math.cos(angle) * offsetR,
          y: p.y + Math.sin(angle) * offsetR,
          r: Math.random() * 1.5 + 0.5,
        });
      }
    }
    const el: WBElement = {
      id: crypto.randomUUID(),
      type: tool,
      color,
      strokeWidth,
      opacity: tool === "brush" ? 0.65 : tool === "pencil" ? 0.85 : 0.95,
      points: [p],
      sprayDots: tool === "spray" ? initialDots : undefined,
      x: p.x, y: p.y, w: 0, h: 0,
    };
    currentEl.current = el;
    (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
  };

  const onDrawMove = (e: React.PointerEvent) => {
    onPanMove(e);

    // Handle element dragging in Select mode
    if (tool === "select" && draggingRef.current) {
      const p = svgCoords(e);
      const drag = draggingRef.current;
      const dx = p.x - drag.startPoint.x;
      const dy = p.y - drag.startPoint.y;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== drag.id) return el;

          if (["text", "rect", "circle", "diamond"].includes(el.type)) {
            return { ...el, x: drag.initialX + dx, y: drag.initialY + dy };
          }
          if (drag.initialPoints && el.points) {
            const newPts = drag.initialPoints.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }));
            return { ...el, points: newPts };
          }
          if (drag.initialSprayDots && el.sprayDots) {
            const newDots = drag.initialSprayDots.map((d) => ({ ...d, x: d.x + dx, y: d.y + dy }));
            return { ...el, sprayDots: newDots };
          }
          return el;
        })
      );
      return;
    }

    if (!drawing.current || !currentEl.current) return;
    const p = svgCoords(e);
    const el = currentEl.current;
    if (["pencil", "pen", "calligraphy", "brush", "line", "arrow"].includes(tool)) {
      el.points = [...(el.points || []), p];
    } else if (tool === "spray") {
      el.points = [...(el.points || []), p];
      const newDots: SprayDot[] = [];
      const count = Math.max(8, Math.min(30, Math.round(strokeWidth * 3.5)));
      for (let i = 0; i < count; i++) {
        const offsetR = Math.random() * strokeWidth * 4;
        const angle = Math.random() * Math.PI * 2;
        newDots.push({
          x: p.x + Math.cos(angle) * offsetR,
          y: p.y + Math.sin(angle) * offsetR,
          r: Math.random() * 1.6 + 0.4,
        });
      }
      el.sprayDots = [...(el.sprayDots || []), ...newDots];
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
    isEraserRubbing.current = false;

    if (draggingRef.current) {
      draggingRef.current = null;
      commitElements([...elements]);
      return;
    }

    if (!drawing.current || !currentEl.current) return;
    drawing.current = false;
    const el = currentEl.current;
    currentEl.current = null;
    commitElements([...elements.filter((e) => e.id !== el.id), el]);
  };

  const clearAll = () => {
    if (!confirm("Apagar todos os elementos do quadro?")) return;
    commitElements([]);
  };

  const exportSVG = () => {
    const svg = canvasRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
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

  // ── Render SVG Element ───────────────────────────────────────────────────────
  const renderEl = (el: WBElement) => {
    const isSelected = selectedId === el.id;
    const isEraserHover = tool === "eraser";

    const baseStyle: React.CSSProperties = {
      cursor: tool === "eraser" ? "crosshair" : tool === "select" ? "move" : "crosshair",
      filter: isSelected
        ? "drop-shadow(0 0 8px #6366f1)"
        : isEraserHover
        ? "drop-shadow(0 0 6px #ef4444)"
        : undefined,
    };

    const clickProps = {
      "data-el-id": el.id,
      onPointerDown: (e: React.PointerEvent) => onElementPointerDown(el, e),
      onPointerOver: (e: React.PointerEvent) => onElementPointerMove(el, e),
      style: baseStyle,
    };

    const { style: clickStyle, ...otherClickProps } = clickProps;

    if (el.type === "pencil" && el.points && el.points.length > 1) {
      const d = el.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return (
        <g key={el.id} {...clickProps}>
          {/* Invisible padding stroke for easy clicking/erasing */}
          <path d={d} stroke="transparent" strokeWidth={Math.max(16, el.strokeWidth * 3)} fill="none" strokeLinecap="round" />
          <path d={d} stroke={el.color} strokeWidth={Math.max(1, Math.round(el.strokeWidth / 2))} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 0.5" opacity={el.opacity || 0.85} />
        </g>
      );
    }
    if (el.type === "pen" && el.points && el.points.length > 1) {
      const d = el.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return (
        <g key={el.id} {...clickProps}>
          <path d={d} stroke="transparent" strokeWidth={Math.max(16, el.strokeWidth * 3)} fill="none" strokeLinecap="round" />
          <path d={d} stroke={el.color} strokeWidth={el.strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity || 0.9} />
        </g>
      );
    }
    if (el.type === "calligraphy" && el.points && el.points.length > 1) {
      const d1 = el.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      const dx = el.strokeWidth * 1.2;
      const dy = -el.strokeWidth * 0.8;
      const d2 = el.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x + dx} ${p.y + dy}`).join(" ");
      return (
        <g key={el.id} {...clickProps}>
          <path d={d1} stroke="transparent" strokeWidth={Math.max(16, el.strokeWidth * 3)} fill="none" />
          <path d={d1} stroke={el.color} strokeWidth={el.strokeWidth} fill="none" strokeLinecap="square" strokeLinejoin="miter" opacity={el.opacity || 0.9} />
          <path d={d2} stroke={el.color} strokeWidth={Math.max(1, el.strokeWidth * 0.5)} fill="none" strokeLinecap="square" strokeLinejoin="miter" opacity={(el.opacity || 0.9) * 0.7} />
        </g>
      );
    }
    if (el.type === "brush" && el.points && el.points.length > 1) {
      const d = el.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
      return (
        <g key={el.id} {...otherClickProps} style={clickStyle}>
          <path d={d} stroke="transparent" strokeWidth={Math.max(20, el.strokeWidth * 3)} fill="none" />
          <path d={d} stroke={el.color} strokeWidth={el.strokeWidth * 2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity || 0.65} />
        </g>
      );
    }
    if (el.type === "spray" && el.sprayDots && el.sprayDots.length > 0) {
      return (
        <g key={el.id} opacity={el.opacity || 0.9} {...clickProps}>
          {el.sprayDots.map((dot, idx) => (
            <circle key={idx} cx={dot.x} cy={dot.y} r={dot.r} fill={el.color} />
          ))}
        </g>
      );
    }
    if ((el.type === "line" || el.type === "arrow") && el.points && el.points.length >= 2) {
      const p1 = el.points[0];
      const p2 = el.points[el.points.length - 1];
      return (
        <g key={el.id} {...clickProps}>
          <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={Math.max(16, el.strokeWidth * 3)} />
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
      const fontSize = 16 + (el.strokeWidth || 3) * 2;
      return (
        <g key={el.id} {...clickProps}>
          {/* Bounding box visual highlight when selected */}
          {isSelected && (
            <rect
              x={(el.x || 0) - 4}
              y={(el.y || 0) - fontSize}
              width={(el.text?.length || 4) * (fontSize * 0.6) + 8}
              height={fontSize + 10}
              fill="none"
              stroke="#6366f1"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              rx="4"
            />
          )}
          <text
            x={el.x}
            y={el.y}
            fill={el.color}
            fontSize={fontSize}
            fontWeight="600"
            fontFamily="Inter, sans-serif"
            opacity={el.opacity}
            className="select-none"
          >
            {el.text}
          </text>
        </g>
      );
    }
    return null;
  };

  // ── Toolbar tools config ─────────────────────────────────────────────────────
  const tools: { id: ToolType; icon: any; label: string }[] = [
    { id: "select", icon: MousePointer2, label: "Selecionar e Mover (V)" },
    { id: "pencil", icon: Pencil, label: "Lápis Fino (N)" },
    { id: "pen", icon: PenTool, label: "Caneta Livre (P)" },
    { id: "calligraphy", icon: Feather, label: "Caligrafia (K)" },
    { id: "brush", icon: Paintbrush, label: "Pincel Macio (B)" },
    { id: "spray", icon: Sparkles, label: "Spray / Aerógrafo (S)" },
    { id: "line", icon: Minus, label: "Linha Reta (L)" },
    { id: "arrow", icon: ArrowRight, label: "Seta (A)" },
    { id: "rect", icon: Square, label: "Retângulo (R)" },
    { id: "circle", icon: Circle, label: "Elipse / Círculo (C)" },
    { id: "diamond", icon: Diamond, label: "Losango (D)" },
    { id: "text", icon: Type, label: "Caixa de Texto Direto (T)" },
    { id: "eraser", icon: Eraser, label: "Borracha (E)" },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const map: Record<string, ToolType> = {
      v: "select", n: "pencil", p: "pen", k: "calligraphy", b: "brush",
      s: "spray", l: "line", a: "arrow", r: "rect", c: "circle", d: "diamond",
      t: "text", e: "eraser",
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;
      if (map[e.key.toLowerCase()]) { setTool(map[e.key.toLowerCase()]); }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) { commitElements(elements.filter((el) => el.id !== selectedId)); setSelectedId(null); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, elements, commitElements]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between px-6 py-3 border-b border-border/40 bg-card/40 backdrop-blur-md gap-4 z-10">
        <div className="flex items-center gap-3">
          <Presentation className="h-6 w-6 text-accent" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-lg leading-none">
                {activeBoard ? activeBoard.title : "Novo Quadro"}
              </h1>
              {connected ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Wifi className="h-3 w-3 animate-pulse" /> Ao vivo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  <WifiOff className="h-3 w-3" /> Offline
                </span>
              )}
              {/* Save status badge */}
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                  <Layers className="h-3 w-3" /> Salvando...
                </span>
              )}
              {saveStatus === "saved" && activeBoard && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Check className="h-3 w-3" /> Salvo no projeto
                </span>
              )}
              {!activeBoard && (
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                  Comece a desenhar para salvar automaticamente
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeBoard?.project_id
                ? `Vinculado ao projeto selecionado · salvo automaticamente`
                : `Selecione um projeto antes de desenhar para vincular o quadro`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Integrated Project Selector */}
          <ProjectSelector />

          {/* List boards */}
          <Dialog open={listOpen} onOpenChange={setListOpen}>
            <Button variant="outline" size="sm" onClick={() => setListOpen(true)} className="gap-2 text-xs">
              <Presentation className="h-3.5 w-3.5" /> Meus Quadros ({boards.length})
            </Button>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Quadros do Projeto</DialogTitle></DialogHeader>
              <div className="space-y-2 max-h-60 overflow-y-auto py-2">
                {boards.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => openBoard(b)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition",
                      activeBoard?.id === b.id ? "bg-accent/10 border-accent" : "hover:bg-muted/50"
                    )}
                  >
                    <div>
                      <p className="font-semibold text-sm">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(b.updated_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <button onClick={(e) => deleteBoard(b.id, e)} className="text-muted-foreground hover:text-destructive p-1 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t flex gap-2">
                <Input placeholder="Nome do novo quadro..." value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createBoard()} />
                <Button onClick={createBoard} disabled={creating} className="bg-gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4 mr-1" /> Criar
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" size="sm" onClick={exportSVG} className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Exportar SVG</Button>
          <Button variant="destructive" size="sm" onClick={clearAll} className="gap-1.5 text-xs"><Trash2 className="h-3.5 w-3.5" /> Apagar Tudo</Button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div ref={canvasContainerRef} className="relative flex-1 overflow-hidden select-none bg-radial-grid">
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.3)]">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              title={t.label}
              className={cn(
                "p-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1",
                tool === t.id
                  ? "bg-accent text-accent-foreground shadow-md shadow-accent/20 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <t.icon className="h-4 w-4" />
            </button>
          ))}

          <div className="h-5 w-px bg-border mx-1" />

          {/* Color picker */}
          <div className="flex items-center gap-1.5 px-2">
            <RichColorPicker value={color} onChange={setColor} compact className="h-7 w-7 rounded-lg" />
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Stroke width */}
          <div className="flex items-center gap-1 px-1">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                onClick={() => setStrokeWidth(w)}
                className={cn(
                  "h-6 w-6 rounded-lg flex items-center justify-center transition",
                  strokeWidth === w ? "bg-accent/20 text-accent font-bold" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <span className="rounded-full bg-current" style={{ width: Math.max(3, w * 0.6), height: Math.max(3, w * 0.6) }} />
              </button>
            ))}
          </div>
        </div>

        {/* Floating Camera Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 p-1.5 rounded-xl bg-card/90 backdrop-blur-xl border border-white/10 shadow-lg text-xs font-bold">
          <button onClick={() => setCam((c) => ({ ...c, scale: Math.max(0.15, c.scale * 0.85) }))} className="px-2 py-1 rounded hover:bg-muted">-</button>
          <span>{Math.round(cam.scale * 100)}%</span>
          <button onClick={() => setCam((c) => ({ ...c, scale: Math.min(5, c.scale * 1.15) }))} className="px-2 py-1 rounded hover:bg-muted">+</button>
          <button onClick={() => setCam({ x: 0, y: 0, scale: 1 })} className="px-2 py-1 rounded hover:bg-muted text-[10px] uppercase">Reset</button>
        </div>

        {/* Eraser active notification banner */}
        {isEraserActive && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-destructive text-destructive-foreground px-4 py-1.5 rounded-full text-xs font-bold shadow-lg animate-pulse flex items-center gap-2">
            <Eraser className="h-4 w-4" />
            Modo Borracha Ativo: Clique ou passe sobre elementos para apagar!
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          ref={canvasRef}
          className="w-full h-full touch-none cursor-crosshair"
          onPointerDown={onDrawStart}
          onPointerMove={onDrawMove}
          onPointerUp={onDrawEnd}
        >
          <g transform={`translate(${cam.x}, ${cam.y}) scale(${cam.scale})`}>
            {elements.map(renderEl)}
          </g>
        </svg>

        {/* INLINE CANVAS TEXT EDITOR (No native browser prompt pop-up) */}
        {inlineText && (
          <div
            className="absolute z-30"
            style={{
              left: `${cam.x + inlineText.x * cam.scale}px`,
              top: `${cam.y + inlineText.y * cam.scale - 20}px`,
            }}
          >
            <div className="relative bg-card p-2 rounded-xl border-2 border-accent shadow-2xl min-w-[200px] flex flex-col gap-2 animate-in zoom-in-95 duration-150">
              <Textarea
                ref={inlineInputRef}
                value={inlineText.text}
                onChange={(e) => setInlineText({ ...inlineText, text: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitInlineText();
                  }
                  if (e.key === "Escape") {
                    setInlineText(null);
                  }
                }}
                placeholder="Escreva seu texto aqui..."
                rows={2}
                className="text-sm font-semibold border-none focus-visible:ring-0 bg-transparent resize-none p-1"
                autoFocus
              />
              <div className="flex items-center justify-end gap-1 border-t pt-1">
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => setInlineText(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" className="h-6 px-2 text-xs bg-accent text-accent-foreground font-bold gap-1" onClick={commitInlineText}>
                  <Check className="h-3 w-3" /> OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
