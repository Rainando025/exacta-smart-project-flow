import { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Edit3, Sparkles, ZoomIn, ZoomOut, RotateCcw,
  Download, Eye, EyeOff, Layout, Palette, Check,
  ChevronRight, ChevronLeft, Network, Layers, GitFork, ArrowDown, GitBranch,
  HelpCircle, Copy, Share2, Compass, Play, Pause, X, Move
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { askGroq, askGemini } from "@/lib/ai";
import html2canvas from "html2canvas";

export type LayoutType = "radial" | "tree-right" | "org-chart" | "ishikawa" | "timeline";

export type PaletteId = "cyber-neon" | "emerald-executive" | "tech-blue" | "sunset-vibrant" | "creative-pastel" | "monochrome";

export interface MindMapNode {
  id: string;
  text: string;
  color?: string;
  collapsed?: boolean;
  notes?: string;
  children: MindMapNode[];
}

export interface MindMapData {
  root: MindMapNode;
  layout: LayoutType;
  palette: PaletteId;
}

export const COLOR_PALETTES: Record<PaletteId, { name: string; rootBg: string; colors: string[] }> = {
  "cyber-neon": {
    name: "Cyber Neon",
    rootBg: "linear-gradient(135deg, #7c3aed, #06b6d4)",
    colors: ["#8b5cf6", "#06b6d4", "#10b981", "#ec4899", "#f59e0b", "#3b82f6"],
  },
  "emerald-executive": {
    name: "Esmeralda Executivo",
    rootBg: "linear-gradient(135deg, #065f46, #059669)",
    colors: ["#059669", "#10b981", "#0d9488", "#14b8a6", "#047857", "#10b981"],
  },
  "tech-blue": {
    name: "Azul Corporativo",
    rootBg: "linear-gradient(135deg, #1e3a8a, #2563eb)",
    colors: ["#2563eb", "#0284c7", "#4f46e5", "#0ea5e9", "#1d4ed8", "#38bdf8"],
  },
  "sunset-vibrant": {
    name: "Sunset Vibrante",
    rootBg: "linear-gradient(135deg, #c2410c, #db2777)",
    colors: ["#ea580c", "#f97316", "#e11d48", "#db2777", "#d97706", "#c026d3"],
  },
  "creative-pastel": {
    name: "Criativo Pastel",
    rootBg: "linear-gradient(135deg, #818cf8, #f472b6)",
    colors: ["#a78bfa", "#6ee7b7", "#93c5fd", "#fca5a5", "#fde047", "#f472b6"],
  },
  "monochrome": {
    name: "Monocromático Executivo",
    rootBg: "linear-gradient(135deg, #1e293b, #475569)",
    colors: ["#475569", "#64748b", "#334155", "#94a3b8", "#1e293b", "#0f172a"],
  },
};

export const INITIAL_MINDMAP: MindMapData = {
  layout: "radial",
  palette: "emerald-executive",
  root: {
    id: "root-1",
    text: "Ideia Central",
    color: "#059669",
    children: [],
  },
};

interface PositionedNode {
  node: MindMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  color: string;
  parentId?: string;
  parentPos?: { x: number; y: number };
}

// Helpers para manipulação de nós na árvore
function updateNodeInTree(
  root: MindMapNode,
  targetId: string,
  updater: (node: MindMapNode) => MindMapNode
): MindMapNode {
  if (root.id === targetId) return updater(root);
  return {
    ...root,
    children: root.children.map((child) => updateNodeInTree(child, targetId, updater)),
  };
}

function addChildNode(root: MindMapNode, parentId: string, text = "Novo Tópico"): MindMapNode {
  const newId = `node-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const newNode: MindMapNode = { id: newId, text, children: [] };
  return updateNodeInTree(root, parentId, (node) => ({
    ...node,
    collapsed: false,
    children: [...node.children, newNode],
  }));
}

function addSiblingNode(root: MindMapNode, siblingId: string, text = "Novo Tópico"): MindMapNode {
  if (root.id === siblingId) return root; // Não cria irmão da raiz

  function helper(parent: MindMapNode): MindMapNode {
    const idx = parent.children.findIndex((c) => c.id === siblingId);
    if (idx !== -1) {
      const newId = `node-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newNode: MindMapNode = { id: newId, text, children: [] };
      const newChildren = [...parent.children];
      newChildren.splice(idx + 1, 0, newNode);
      return { ...parent, children: newChildren };
    }
    return { ...parent, children: parent.children.map(helper) };
  }

  return helper(root);
}

function removeNodeFromTree(root: MindMapNode, targetId: string): MindMapNode {
  if (root.id === targetId) return root; // Não deleta a raiz
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== targetId)
      .map((c) => removeNodeFromTree(c, targetId)),
  };
}

export function MindMapTool({
  data,
  onChange,
}: {
  data?: MindMapData;
  onChange?: (newData: MindMapData) => void;
}) {
  const [mapData, setMapData] = useState<MindMapData>(data || INITIAL_MINDMAP);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("root-1");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Estados de Arraste Manual dos Nós
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [draggingNode, setDraggingNode] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // Estados do Modo Apresentação (Passo a Passo)
  const [presentationMode, setPresentationMode] = useState(false);
  const [presentationStep, setPresentationStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  // Sincronizar com props se fornecidas
  useEffect(() => {
    if (data) setMapData(data);
  }, [data]);

  const updateState = (updater: (prev: MindMapData) => MindMapData) => {
    setMapData((prev) => {
      const next = updater(prev);
      onChange?.(next);
      return next;
    });
  };

  const currentPalette = COLOR_PALETTES[mapData.palette] || COLOR_PALETTES["cyber-neon"];

  // Calcula contagem total de nós
  const totalNodesCount = useMemo(() => {
    let count = 0;
    function countNodes(node: MindMapNode) {
      count++;
      node.children.forEach(countNodes);
    }
    countNodes(mapData.root);
    return count;
  }, [mapData.root]);

  // Algoritmos de Layout de Posição de Nós
  const layoutCalculations = useMemo(() => {
    const positioned: PositionedNode[] = [];
    const layout = mapData.layout;
    const colors = currentPalette.colors;

    // Dimensões estimadas de cartões
    const ROOT_WIDTH = 240;
    const ROOT_HEIGHT = 64;
    const NODE_WIDTH = 190;
    const NODE_HEIGHT = 48;

    if (layout === "radial") {
      // Raiz no centro (0, 0)
      positioned.push({
        node: mapData.root,
        x: -ROOT_WIDTH / 2,
        y: -ROOT_HEIGHT / 2,
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT,
        level: 0,
        color: colors[0],
      });

      if (!mapData.root.collapsed && mapData.root.children.length > 0) {
        // Divide os filhos da raiz: metade para a direita e metade para a esquerda
        const children = mapData.root.children;
        const rightChildren = children.filter((_, idx) => idx % 2 === 0);
        const leftChildren = children.filter((_, idx) => idx % 2 !== 0);

        // Função recursiva para calcular altura da sub-árvore
        function getTreeHeight(node: MindMapNode): number {
          if (node.collapsed || node.children.length === 0) return 60;
          return node.children.reduce((acc, c) => acc + getTreeHeight(c), 0);
        }

        // Layout Ramo Direito
        const totalRightHeight = rightChildren.reduce((acc, c) => acc + getTreeHeight(c), 0);
        let currentRightY = -totalRightHeight / 2;

        function placeBranchRight(
          node: MindMapNode,
          x: number,
          startY: number,
          level: number,
          parentId: string,
          parentPos: { x: number; y: number },
          colorIndex: number
        ) {
          const h = getTreeHeight(node);
          const y = startY + h / 2 - NODE_HEIGHT / 2;
          const nodeColor = node.color || colors[colorIndex % colors.length];

          positioned.push({
            node,
            x,
            y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            level,
            color: nodeColor,
            parentId,
            parentPos,
          });

          if (!node.collapsed && node.children.length > 0) {
            let childY = startY;
            node.children.forEach((child) => {
              placeBranchRight(
                child,
                x + NODE_WIDTH + 60,
                childY,
                level + 1,
                node.id,
                { x: x + NODE_WIDTH, y: y + NODE_HEIGHT / 2 },
                colorIndex
              );
              childY += getTreeHeight(child);
            });
          }
        }

        rightChildren.forEach((child, i) => {
          placeBranchRight(
            child,
            ROOT_WIDTH / 2 + 70,
            currentRightY,
            1,
            mapData.root.id,
            { x: ROOT_WIDTH / 2, y: 0 },
            i * 2
          );
          currentRightY += getTreeHeight(child);
        });

        // Layout Ramo Esquerdo
        const totalLeftHeight = leftChildren.reduce((acc, c) => acc + getTreeHeight(c), 0);
        let currentLeftY = -totalLeftHeight / 2;

        function placeBranchLeft(
          node: MindMapNode,
          x: number,
          startY: number,
          level: number,
          parentId: string,
          parentPos: { x: number; y: number },
          colorIndex: number
        ) {
          const h = getTreeHeight(node);
          const y = startY + h / 2 - NODE_HEIGHT / 2;
          const nodeColor = node.color || colors[colorIndex % colors.length];

          positioned.push({
            node,
            x: x - NODE_WIDTH,
            y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            level,
            color: nodeColor,
            parentId,
            parentPos,
          });

          if (!node.collapsed && node.children.length > 0) {
            let childY = startY;
            node.children.forEach((child) => {
              placeBranchLeft(
                child,
                x - NODE_WIDTH - 60,
                childY,
                level + 1,
                node.id,
                { x: x - NODE_WIDTH, y: y + NODE_HEIGHT / 2 },
                colorIndex
              );
              childY += getTreeHeight(child);
            });
          }
        }

        leftChildren.forEach((child, i) => {
          placeBranchLeft(
            child,
            -ROOT_WIDTH / 2 - 70,
            currentLeftY,
            1,
            mapData.root.id,
            { x: -ROOT_WIDTH / 2, y: 0 },
            i * 2 + 1
          );
          currentLeftY += getTreeHeight(child);
        });
      }
    } else if (layout === "tree-right") {
      // Raiz na extrema esquerda
      function getSubtreeHeight(node: MindMapNode): number {
        if (node.collapsed || node.children.length === 0) return 56;
        return node.children.reduce((acc, c) => acc + getSubtreeHeight(c), 0);
      }

      const totalH = getSubtreeHeight(mapData.root);
      const rootY = 0;

      positioned.push({
        node: mapData.root,
        x: -400,
        y: rootY - ROOT_HEIGHT / 2,
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT,
        level: 0,
        color: colors[0],
      });

      function placeTreeRight(
        node: MindMapNode,
        x: number,
        startY: number,
        level: number,
        parentId: string,
        parentPos: { x: number; y: number },
        branchIdx: number
      ) {
        const h = getSubtreeHeight(node);
        const y = startY + h / 2 - NODE_HEIGHT / 2;
        const nodeColor = node.color || colors[branchIdx % colors.length];

        positioned.push({
          node,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          level,
          color: nodeColor,
          parentId,
          parentPos,
        });

        if (!node.collapsed && node.children.length > 0) {
          let curY = startY;
          node.children.forEach((child) => {
            placeTreeRight(
              child,
              x + NODE_WIDTH + 65,
              curY,
              level + 1,
              node.id,
              { x: x + NODE_WIDTH, y: y + NODE_HEIGHT / 2 },
              branchIdx
            );
            curY += getSubtreeHeight(child);
          });
        }
      }

      if (!mapData.root.collapsed) {
        let curY = -totalH / 2;
        mapData.root.children.forEach((child, idx) => {
          placeTreeRight(
            child,
            -400 + ROOT_WIDTH + 70,
            curY,
            1,
            mapData.root.id,
            { x: -400 + ROOT_WIDTH, y: rootY },
            idx
          );
          curY += getSubtreeHeight(child);
        });
      }
    } else if (layout === "org-chart") {
      // Top-Down: Raiz no topo, descendentes abaixo
      function getOrgWidth(node: MindMapNode): number {
        if (node.collapsed || node.children.length === 0) return NODE_WIDTH + 30;
        return node.children.reduce((acc, c) => acc + getOrgWidth(c), 0);
      }

      const totalW = getOrgWidth(mapData.root);

      positioned.push({
        node: mapData.root,
        x: -ROOT_WIDTH / 2,
        y: -220,
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT,
        level: 0,
        color: colors[0],
      });

      function placeOrg(
        node: MindMapNode,
        startX: number,
        y: number,
        level: number,
        parentId: string,
        parentPos: { x: number; y: number },
        colorIdx: number
      ) {
        const w = getOrgWidth(node);
        const x = startX + w / 2 - NODE_WIDTH / 2;
        const nodeColor = node.color || colors[colorIdx % colors.length];

        positioned.push({
          node,
          x,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          level,
          color: nodeColor,
          parentId,
          parentPos,
        });

        if (!node.collapsed && node.children.length > 0) {
          let curX = startX;
          node.children.forEach((child) => {
            placeOrg(
              child,
              curX,
              y + NODE_HEIGHT + 65,
              level + 1,
              node.id,
              { x: x + NODE_WIDTH / 2, y: y + NODE_HEIGHT },
              colorIdx
            );
            curX += getOrgWidth(child);
          });
        }
      }

      if (!mapData.root.collapsed) {
        let curX = -totalW / 2;
        mapData.root.children.forEach((child, idx) => {
          placeOrg(
            child,
            curX,
            -220 + ROOT_HEIGHT + 70,
            1,
            mapData.root.id,
            { x: 0, y: -220 + ROOT_HEIGHT },
            idx
          );
          curX += getOrgWidth(child);
        });
      }
    } else if (layout === "ishikawa") {
      // Diagrama Espinha de Peixe (Causa e Efeito)
      // Cabeça do peixe à direita
      const HEAD_X = 350;
      positioned.push({
        node: mapData.root,
        x: HEAD_X,
        y: -ROOT_HEIGHT / 2,
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT,
        level: 0,
        color: colors[0],
      });

      const SPINE_LENGTH = 800;
      const SPINE_START_X = HEAD_X - SPINE_LENGTH;
      const categories = mapData.root.children;

      categories.forEach((cat, idx) => {
        const isUpper = idx % 2 === 0;
        const segment = (idx + 1) / (categories.length + 1);
        const attachX = HEAD_X - SPINE_LENGTH * (1 - segment);
        const attachY = 0;
        const catY = isUpper ? -140 : 140;
        const catX = attachX - 80;
        const catColor = cat.color || colors[idx % colors.length];

        positioned.push({
          node: cat,
          x: catX,
          y: catY - NODE_HEIGHT / 2,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          level: 1,
          color: catColor,
          parentId: mapData.root.id,
          parentPos: { x: attachX, y: attachY },
        });

        // Sub-causas penduradas verticalmente na espinha da categoria
        if (!cat.collapsed && cat.children.length > 0) {
          cat.children.forEach((sub, subIdx) => {
            const subY = isUpper
              ? catY - 45 * (subIdx + 1)
              : catY + 45 * (subIdx + 1);
            positioned.push({
              node: sub,
              x: catX + 25,
              y: subY - 18,
              width: NODE_WIDTH - 20,
              height: 36,
              level: 2,
              color: catColor,
              parentId: cat.id,
              parentPos: { x: catX + 30, y: catY },
            });
          });
        }
      });
    } else if (layout === "timeline") {
      // Timeline sequencial: marcos horizontais com tarefas penduradas
      const stages = mapData.root.children;
      const SPACING = 240;
      const START_X = -((stages.length - 1) * SPACING) / 2;

      positioned.push({
        node: mapData.root,
        x: -ROOT_WIDTH / 2,
        y: -240,
        width: ROOT_WIDTH,
        height: ROOT_HEIGHT,
        level: 0,
        color: colors[0],
      });

      stages.forEach((stage, idx) => {
        const stageX = START_X + idx * SPACING;
        const stageY = -20;
        const stageColor = stage.color || colors[idx % colors.length];

        positioned.push({
          node: stage,
          x: stageX - NODE_WIDTH / 2,
          y: stageY,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          level: 1,
          color: stageColor,
          parentId: mapData.root.id,
          parentPos: { x: 0, y: -240 + ROOT_HEIGHT },
        });

        // Atividades do marco
        if (!stage.collapsed && stage.children.length > 0) {
          stage.children.forEach((task, taskIdx) => {
            const taskY = stageY + NODE_HEIGHT + 35 + taskIdx * 48;
            positioned.push({
              node: task,
              x: stageX - (NODE_WIDTH - 20) / 2,
              y: taskY,
              width: NODE_WIDTH - 20,
              height: 40,
              level: 2,
              color: stageColor,
              parentId: stage.id,
              parentPos: { x: stageX, y: stageY + NODE_HEIGHT },
            });
          });
        }
      });
    }

    return positioned;
  }, [mapData, currentPalette]);

  // Lista de nós com os deslocamentos manuais aplicados (Drag & Drop de nós)
  const positionedNodes = useMemo(() => {
    return layoutCalculations.map((p) => {
      const off = nodeOffsets[p.node.id] || { x: 0, y: 0 };
      return {
        ...p,
        x: p.x + off.x,
        y: p.y + off.y,
      };
    });
  }, [layoutCalculations, nodeOffsets]);

  // Mapa rápido de ID para nó posicionado
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    positionedNodes.forEach((p) => map.set(p.node.id, p));
    return map;
  }, [positionedNodes]);

  // Ordem de Apresentação Sequencial (Depth-First / Pré-ordem)
  const presentationOrder = useMemo(() => {
    const order: MindMapNode[] = [];
    function traverse(node: MindMapNode) {
      order.push(node);
      if (node.children && node.children.length > 0) {
        node.children.forEach(traverse);
      }
    }
    traverse(mapData.root);
    return order;
  }, [mapData.root]);

  // Conjunto de nós visíveis na Apresentação
  const visibleNodeIds = useMemo(() => {
    if (!presentationMode) return new Set<string>();
    return new Set(presentationOrder.slice(0, presentationStep + 1).map((n) => n.id));
  }, [presentationMode, presentationOrder, presentationStep]);

  // Centralização suave no card atual da apresentação
  useEffect(() => {
    if (!presentationMode) return;
    const currentNode = presentationOrder[presentationStep];
    if (currentNode && nodePositionMap) {
      const pos = nodePositionMap.get(currentNode.id);
      if (pos) {
        setPan({
          x: -pos.x * zoom,
          y: -pos.y * zoom,
        });
      }
    }
  }, [presentationMode, presentationStep]);

  // Timer para Auto-Play na Apresentação (3.2s por card)
  useEffect(() => {
    if (!presentationMode || !autoPlay) return;
    const interval = setInterval(() => {
      setPresentationStep((prev) => {
        if (prev >= presentationOrder.length - 1) {
          setAutoPlay(false);
          toast.info("Apresentação concluída!");
          return prev;
        }
        return prev + 1;
      });
    }, 3200);
    return () => clearInterval(interval);
  }, [presentationMode, autoPlay, presentationOrder.length]);

  // Teclado na Apresentação (Setas, Espaço, Esc)
  useEffect(() => {
    if (!presentationMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setPresentationStep((s) => Math.min(presentationOrder.length - 1, s + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPresentationStep((s) => Math.max(0, s - 1));
      } else if (e.key === "Escape") {
        setPresentationMode(false);
        setAutoPlay(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentationMode, presentationOrder.length]);

  // Iniciar Apresentação
  const startPresentation = () => {
    if (presentationOrder.length === 0) return;
    setPresentationMode(true);
    setPresentationStep(0);
    setAutoPlay(false);
    setZoom(1.05);
    const rootPos = nodePositionMap.get(mapData.root.id);
    if (rootPos) {
      setPan({ x: -rootPos.x * 1.05, y: -rootPos.y * 1.05 });
    } else {
      setPan({ x: 0, y: 0 });
    }
    toast.info("Modo Apresentação iniciado! Use as setas ← → ou Espaço para avançar.");
  };

  const exitPresentation = () => {
    setPresentationMode(false);
    setAutoPlay(false);
  };

  // Manipulação de Arraste de Nó
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input")) return;

    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNode({
      id: nodeId,
      startX: e.clientX,
      startY: e.clientY,
      origX: nodeOffsets[nodeId]?.x || 0,
      origY: nodeOffsets[nodeId]?.y || 0,
    });
  };

  // Manipulação de Pan do Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest(".mindmap-node") || target.closest("button") || target.closest("input")) {
      return;
    }
    setIsPanning(true);
    setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingNode) {
      const dx = (e.clientX - draggingNode.startX) / zoom;
      const dy = (e.clientY - draggingNode.startY) / zoom;
      setNodeOffsets((prev) => ({
        ...prev,
        [draggingNode.id]: {
          x: Math.round(draggingNode.origX + dx),
          y: Math.round(draggingNode.origY + dy),
        },
      }));
    } else if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  // Suporte a Touch em Dispositivos Móveis
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      if (target.closest(".mindmap-node") || target.closest("button") || target.closest("input")) {
        return;
      }
      setIsPanning(true);
      setStartPan({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      setPan({ x: touch.clientX - startPan.x, y: touch.clientY - startPan.y });
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggingNode(null);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const resetNodePositions = () => {
    setNodeOffsets({});
    toast.success("Posições automáticas dos nós restauradas!");
  };

  // Funções de Edição
  const startEditing = (node: MindMapNode) => {
    setEditingNodeId(node.id);
    setEditText(node.text);
  };

  const saveEditing = () => {
    if (!editingNodeId) return;
    if (editText.trim()) {
      updateState((prev) => ({
        ...prev,
        root: updateNodeInTree(prev.root, editingNodeId, (node) => ({
          ...node,
          text: editText.trim(),
        })),
      }));
    }
    setEditingNodeId(null);
  };

  const handleAddChild = () => {
    if (!selectedNodeId) return;
    updateState((prev) => ({
      ...prev,
      root: addChildNode(prev.root, selectedNodeId, "Novo Sub-tópico"),
    }));
    toast.success("Sub-nó adicionado!");
  };

  const handleAddSibling = () => {
    if (!selectedNodeId || selectedNodeId === mapData.root.id) {
      toast.info("A raiz não possui nós irmãos. Adicione um sub-nó.");
      return;
    }
    updateState((prev) => ({
      ...prev,
      root: addSiblingNode(prev.root, selectedNodeId, "Novo Tópico"),
    }));
    toast.success("Nó irmão adicionado!");
  };

  const handleDelete = () => {
    if (!selectedNodeId || selectedNodeId === mapData.root.id) {
      toast.warning("O nó raiz não pode ser excluído.");
      return;
    }
    updateState((prev) => ({
      ...prev,
      root: removeNodeFromTree(prev.root, selectedNodeId),
    }));
    setSelectedNodeId(mapData.root.id);
    toast.success("Ramo excluído.");
  };

  const handleToggleCollapse = (nodeId: string) => {
    updateState((prev) => ({
      ...prev,
      root: updateNodeInTree(prev.root, nodeId, (node) => ({
        ...node,
        collapsed: !node.collapsed,
      })),
    }));
  };

  // Exportação em Imagem PNG
  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    try {
      toast.info("Renderizando imagem em alta resolução...");
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: "#f8fafc",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `mapa-mental-exacta-${mapData.root.text.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Mapa Mental exportado com sucesso!");
    } catch (e) {
      toast.error("Erro ao exportar mapa mental.");
    }
  };

  // Resetar e criar novo mapa do zero
  const handleResetToEmpty = () => {
    if (confirm("Deseja criar um novo mapa mental do zero? Todo o conteúdo atual será resetado.")) {
      updateState((prev) => ({
        ...prev,
        root: {
          id: `root-${Date.now()}`,
          text: "Ideia Central",
          color: COLOR_PALETTES[prev.palette]?.colors[0] || "#059669",
          children: [],
        },
      }));
      setPan({ x: 0, y: 0 });
      setZoom(1);
      toast.success("Novo mapa mental pronto! Comece adicionando ideias a partir do nó central.");
    }
  };

  // Geração com Inteligência Artificial
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      toast.warning("Digite um tema ou objetivo para gerar.");
      return;
    }
    setAiLoading(true);

    const prompt = `
Você é o motor de inteligência artificial de planejamento estratégico e arquitetura mental do EXACTA.
Gere uma estrutura de Mapa Mental rica, profunda e extremamente organizada para o tema: "${aiTopic}".

REQUISITOS OBRIGATÓRIOS:
1. Responda APENAS com um objeto JSON válido, sem texto antes ou depois, sem markdown (sem \`\`\`json).
2. A estrutura deve ter um "text" raiz, e uma lista de 4 a 6 "children" principais.
3. Cada "children" deve ter 3 a 5 sub-nós com ideias acionáveis e práticas.
4. Use o seguinte formato JSON estrito:
{
  "text": "Tema Principal Resumido",
  "children": [
    {
      "text": "Pilar Estratégico 1",
      "children": [
        { "text": "Ação ou Tópico Específico 1.1" },
        { "text": "Ação ou Tópico Específico 1.2" },
        { "text": "Ação ou Tópico Específico 1.3" }
      ]
    }
  ]
}
`;

    try {
      let rawResult: string | null = null;
      try {
        rawResult = await askGroq(prompt);
      } catch {
        rawResult = await askGemini(prompt);
      }

      if (!rawResult) throw new Error("Sem resposta da IA");

      // Limpeza de blocos markdown caso o modelo adicione
      const cleanJson = rawResult
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanJson);

      function enrichWithIds(rawNode: any, prefix = "ai"): MindMapNode {
        const id = `${prefix}-${Math.random().toString(36).substring(2, 8)}`;
        return {
          id,
          text: rawNode.text || "Item",
          children: Array.isArray(rawNode.children)
            ? rawNode.children.map((c: any, i: number) => enrichWithIds(c, `${id}-${i}`))
            : [],
        };
      }

      const enrichedRoot = enrichWithIds(parsed, "root");

      updateState((prev) => ({
        ...prev,
        root: enrichedRoot,
      }));

      setSelectedNodeId(enrichedRoot.id);
      resetView();
      setAiModalOpen(false);
      setAiTopic("");
      toast.success("Mapa Mental gerado com IA com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error("Falha ao gerar mapa com IA. Tente reformular o tema.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-[680px] bg-card rounded-xl border border-border shadow-sm overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-border bg-card/90 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Esquerda: Tipo de Layout e Paleta */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Selector */}
          <div className="flex items-center gap-1 bg-background/80 border border-border rounded-lg p-1">
            <span className="text-xs font-semibold px-2 text-muted-foreground flex items-center gap-1.5">
              <Layout className="h-3.5 w-3.5 text-accent" /> Layout:
            </span>
            <Select
              value={mapData.layout}
              onValueChange={(val: LayoutType) =>
                updateState((prev) => ({ ...prev, layout: val }))
              }
            >
              <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 text-xs font-medium w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="radial" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Compass className="h-3.5 w-3.5 text-accent" />
                    <span>Radial (360° Cêntrico)</span>
                  </div>
                </SelectItem>
                <SelectItem value="tree-right" className="text-xs">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-3.5 w-3.5 text-accent" />
                    <span>Árvore Horizontal</span>
                  </div>
                </SelectItem>
                <SelectItem value="org-chart" className="text-xs">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="h-3.5 w-3.5 text-accent" />
                    <span>Organograma (Top-Down)</span>
                  </div>
                </SelectItem>
                <SelectItem value="ishikawa" className="text-xs">
                  <div className="flex items-center gap-2">
                    <GitFork className="h-3.5 w-3.5 text-accent" />
                    <span>Espinha de Peixe (Ishikawa)</span>
                  </div>
                </SelectItem>
                <SelectItem value="timeline" className="text-xs">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-accent" />
                    <span>Linha do Tempo / Fases</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Palette Selector */}
          <div className="flex items-center gap-1 bg-background/80 border border-border rounded-lg p-1">
            <span className="text-xs font-semibold px-2 text-muted-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-accent" /> Cores:
            </span>
            <Select
              value={mapData.palette}
              onValueChange={(val: PaletteId) =>
                updateState((prev) => ({ ...prev, palette: val }))
              }
            >
              <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 text-xs font-medium w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
                  <SelectItem key={key} value={key} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {pal.colors.slice(0, 3).map((c, i) => (
                          <div
                            key={i}
                            className="h-3 w-3 rounded-full border border-black/30"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span>{pal.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="text-xs font-mono border-white/10 text-muted-foreground">
            {totalNodesCount} tópicos
          </Badge>
        </div>

        {/* Direita: Ações Rápidas, Zoom e IA */}
        <div className="flex items-center gap-2">
          {/* Botões de Nós */}
          <div className="flex items-center gap-1 bg-background/50 border border-white/10 rounded-lg p-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1.5 hover:text-accent"
              onClick={handleAddChild}
              title="Adicionar sub-tópico ao nó selecionado (Tab)"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Sub-nó</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1.5 hover:text-accent"
              onClick={handleAddSibling}
              title="Adicionar tópico irmão no mesmo nível (Enter)"
            >
              <Network className="h-3.5 w-3.5" />
              <span>+ Irmão</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              title="Excluir ramo selecionado (Delete)"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-background/50 border border-white/10 rounded-lg p-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              title="Diminuir Zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-mono px-2 text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              title="Aumentar Zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={resetView}
              title="Centralizar e Resetar"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Modo Apresentação */}
          <Button
            size="sm"
            variant={presentationMode ? "default" : "outline"}
            onClick={presentationMode ? exitPresentation : startPresentation}
            className={cn(
              "h-8 px-3 text-xs gap-1.5 font-semibold transition-all shadow-sm",
              presentationMode
                ? "bg-accent text-accent-foreground border-accent shadow-glow"
                : "border-accent/40 text-accent hover:bg-accent/10"
            )}
            title="Apresentação passo a passo (vai revelando os cards aos poucos)"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{presentationMode ? "Sair da Apresentação" : "Apresentação"}</span>
          </Button>

          {/* Realinhar Nós (se houver posições arrastadas) */}
          {Object.keys(nodeOffsets).length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={resetNodePositions}
              className="h-8 px-2.5 text-xs gap-1.5 border-border hover:border-accent text-muted-foreground hover:text-foreground"
              title="Restaurar posições automáticas do layout"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="hidden sm:inline">Realinhar</span>
            </Button>
          )}

          {/* Botão IA */}
          <Button
            size="sm"
            onClick={() => setAiModalOpen(true)}
            className="h-8 gap-1.5 bg-gradient-to-r from-accent to-purple-600 text-white font-semibold shadow-glow text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gerar com IA</span>
          </Button>

          {/* Criar do Zero */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetToEmpty}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:border-destructive/40 text-muted-foreground hover:text-destructive"
            title="Criar novo mapa mental do zero"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Criar do Zero</span>
          </Button>

          {/* Exportar PNG */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPNG}
            className="h-8 px-2.5 text-xs gap-1.5 border-border hover:border-accent text-foreground"
            title="Exportar imagem PNG"
          >
            <Download className="h-3.5 w-3.5 text-accent" />
            <span className="hidden sm:inline">Exportar PNG</span>
          </Button>
        </div>
      </div>

      {/* Canvas Principal com Arraste Livre (Canvas e Nós), Linhas SVG e Cartões */}
      <div
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "flex-1 relative overflow-hidden bg-slate-100/90 dark:bg-slate-900/40 select-none",
          draggingNode ? "cursor-grabbing" : isPanning ? "cursor-grabbing" : "cursor-grab",
          "bg-[radial-gradient(#64748b33_1px,transparent_1px)] [background-size:24px_24px]"
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x + (canvasRef.current?.clientWidth || 800) / 2}px, ${
              pan.y + (canvasRef.current?.clientHeight || 600) / 2
            }px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isPanning || draggingNode ? "none" : "transform 0.15s ease-out",
          }}
        >
          {/* Conexões SVG Suaves Bezier Dinâmicas */}
          <svg className="overflow-visible absolute top-0 left-0 w-1 h-1 pointer-events-none">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Linha da Espinha Central se layout for Ishikawa */}
            {mapData.layout === "ishikawa" && (
              <line
                x1={350 - 800}
                y1={0}
                x2={350}
                y2={0}
                stroke="#64748b"
                strokeWidth={4}
                strokeLinecap="round"
              />
            )}

            {/* Linha da Timeline Central se layout for Timeline */}
            {mapData.layout === "timeline" && (
              <line
                x1={-((mapData.root.children.length - 1) * 240) / 2 - 100}
                y1={4}
                x2={((mapData.root.children.length - 1) * 240) / 2 + 100}
                y2={4}
                stroke="#38bdf8"
                strokeWidth={3}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            )}

            {positionedNodes.map((p) => {
              if (!p.parentId) return null;
              const parentNode = nodePositionMap.get(p.parentId);
              if (!parentNode) return null;

              // No modo de apresentação, só mostra a linha se ambos os cartões já apareceram
              if (presentationMode && (!visibleNodeIds.has(p.node.id) || !visibleNodeIds.has(p.parentId))) {
                return null;
              }

              // Posição de origem (do pai) calculada dinamicamente com suporte a nós arrastados
              let sourceX = parentNode.x + parentNode.width;
              let sourceY = parentNode.y + parentNode.height / 2;
              let targetX = p.x;
              let targetY = p.y + p.height / 2;

              if (mapData.layout === "radial") {
                if (p.x < parentNode.x) {
                  sourceX = parentNode.x;
                  targetX = p.x + p.width;
                } else {
                  sourceX = parentNode.x + parentNode.width;
                  targetX = p.x;
                }
              } else if (mapData.layout === "org-chart" || mapData.layout === "timeline") {
                sourceX = parentNode.x + parentNode.width / 2;
                sourceY = parentNode.y + parentNode.height;
                targetX = p.x + p.width / 2;
                targetY = p.y;
              } else if (mapData.layout === "ishikawa") {
                sourceX = parentNode.x;
                sourceY = parentNode.y;
                targetX = p.x + (p.x < parentNode.x ? p.width : 0);
              }

              // Curvas Bézier naturais e limpas
              let pathData = "";
              if (mapData.layout === "radial" || mapData.layout === "tree-right") {
                const dx = (targetX - sourceX) * 0.5;
                pathData = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
              } else if (mapData.layout === "org-chart" || mapData.layout === "timeline") {
                const dy = (targetY - sourceY) * 0.5;
                pathData = `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + dy}, ${targetX} ${targetY - dy}, ${targetX} ${targetY}`;
              } else if (mapData.layout === "ishikawa") {
                pathData = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
              } else {
                const dx = (targetX - sourceX) * 0.5;
                pathData = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
              }

              return (
                <path
                  key={`edge-${p.node.id}`}
                  d={pathData}
                  fill="none"
                  stroke={p.color || "#06b6d4"}
                  strokeWidth={Math.max(1.8, 3.2 - p.level * 0.7)}
                  strokeOpacity={0.7}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              );
            })}
          </svg>

          {/* Cartões dos Nós (com Arraste Livre e Modo Apresentação) */}
          {positionedNodes.map((p) => {
            // No modo de apresentação, só renderiza os cards até o passo atual
            if (presentationMode && !visibleNodeIds.has(p.node.id)) {
              return null;
            }

            const isRoot = p.level === 0;
            const isSelected = selectedNodeId === p.node.id;
            const isEditing = editingNodeId === p.node.id;
            const hasChildren = p.node.children && p.node.children.length > 0;
            const isCurrentInPresentation =
              presentationMode && presentationOrder[presentationStep]?.id === p.node.id;

            return (
              <div
                key={p.node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, p.node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(p.node.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditing(p.node);
                }}
                className={cn(
                  "mindmap-node absolute pointer-events-auto rounded-xl flex items-center justify-between px-3.5 select-none",
                  "shadow-card border text-foreground cursor-grab active:cursor-grabbing",
                  "transition-all duration-200 group",
                  isCurrentInPresentation
                    ? "ring-4 ring-accent ring-offset-4 ring-offset-background scale-105 shadow-2xl z-30 animate-in fade-in zoom-in-90 duration-500"
                    : isSelected
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-background border-accent shadow-md z-10"
                    : "hover:border-accent/60 hover:shadow-md",
                  isRoot
                    ? "font-bold text-sm tracking-wide text-white border-white/20 shadow-glow"
                    : "text-xs font-medium border-border/80 bg-card"
                )}
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.width,
                  height: p.height,
                  background: isRoot
                    ? currentPalette.rootBg
                    : "hsl(var(--card))",
                  borderColor: isCurrentInPresentation
                    ? p.color
                    : isSelected
                    ? p.color
                    : isRoot
                    ? "transparent"
                    : `${p.color}50`,
                  boxShadow: isCurrentInPresentation
                    ? `0 0 25px ${p.color}90, 0 8px 24px rgba(0,0,0,0.18)`
                    : isSelected
                    ? `0 0 16px ${p.color}50`
                    : `0 2px 8px rgba(0,0,0,0.06)`,
                }}
              >
                {/* Badge Flutuante no Card em Destaque na Apresentação */}
                {isCurrentInPresentation && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 shrink-0 animate-bounce">
                    <Sparkles className="size-2.5" /> Destaque
                  </div>
                )}

                {/* Indicador de cor à esquerda do nó */}
                {!isRoot && (
                  <div
                    className="w-1.5 h-6 rounded-full mr-2.5 shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                )}

                {/* Texto do Nó ou Campo de Edição */}
                <div className="flex-1 min-w-0 pr-1">
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={saveEditing}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing();
                        if (e.key === "Escape") setEditingNodeId(null);
                      }}
                      className="h-7 text-xs bg-background border-accent px-1.5 py-0 text-foreground"
                    />
                  ) : (
                    <span
                      className={cn(
                        "block truncate leading-tight font-medium",
                        isRoot ? "text-white font-bold" : "text-foreground"
                      )}
                      title={p.node.text}
                    >
                      {p.node.text}
                    </span>
                  )}
                </div>

                {/* Ícone sutil de movimentação (Drag handle) */}
                <div className="mr-1 opacity-0 group-hover:opacity-40 transition-opacity">
                  <Move className="size-3 text-muted-foreground" />
                </div>

                {/* Ações Rápidas no Cartão */}
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(p.node);
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-white transition"
                    title="Editar texto"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(p.node.id);
                      handleAddChild();
                    }}
                    className="p-1 rounded text-muted-foreground hover:text-accent transition"
                    title="Adicionar sub-nó"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Badge de Expansão / Colapso se tiver filhos */}
                {hasChildren && !presentationMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCollapse(p.node.id);
                    }}
                    className={cn(
                      "absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md transition",
                      p.node.collapsed
                        ? "bg-accent text-accent-foreground ring-2 ring-background scale-110"
                        : "bg-muted/80 text-muted-foreground hover:bg-muted"
                    )}
                    title={p.node.collapsed ? "Expandir ramo" : "Colapsar ramo"}
                  >
                    {p.node.collapsed ? `+${p.node.children.length}` : "−"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Barra de Controle de Apresentação (Passo a Passo) */}
        {presentationMode && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 bg-card/95 backdrop-blur-xl border border-accent/40 shadow-2xl rounded-2xl p-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
              <Badge className="bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider">
                Apresentação
              </Badge>
              <span className="text-xs font-mono font-medium text-foreground">
                {presentationStep + 1} / {presentationOrder.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPresentationStep((s) => Math.max(0, s - 1))}
                disabled={presentationStep === 0}
                className="h-8 px-2.5 text-xs gap-1"
                title="Card Anterior (Seta Esquerda)"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>

              <Button
                size="sm"
                variant={autoPlay ? "default" : "outline"}
                onClick={() => setAutoPlay((p) => !p)}
                className={cn("h-8 px-3 text-xs gap-1.5", autoPlay && "bg-accent text-accent-foreground font-semibold")}
                title={autoPlay ? "Pausar avanço automático" : "Avançar automaticamente (3s por card)"}
              >
                {autoPlay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{autoPlay ? "Pausar" : "Auto-Play"}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setPresentationStep((s) => Math.min(presentationOrder.length - 1, s + 1))}
                disabled={presentationStep === presentationOrder.length - 1}
                className="h-8 px-2.5 text-xs gap-1 font-semibold text-accent border-accent/40 hover:bg-accent/10"
                title="Próximo Card (Espaço ou Seta Direita)"
              >
                Próximo <ChevronRight className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setPresentationStep(0);
                  setAutoPlay(false);
                }}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Reiniciar do Início"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={exitPresentation}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive gap-1"
                title="Sair da Apresentação (Esc)"
              >
                <X className="h-3.5 w-3.5" /> Sair
              </Button>
            </div>
          </div>
        )}

        {/* Floating Mini Guide */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-[11px] text-muted-foreground space-y-1 hidden md:block z-20">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-accent" /> Dicas de Navegação:
          </p>
          <p>• Clique e arraste em qualquer nó para reposicioná-lo.</p>
          <p>• Clique e arraste no fundo para mover o mapa (Pan).</p>
          <p>• Use <strong>Apresentação</strong> para exibir os cards pouco a pouco.</p>
          <p>• Dê duplo clique em qualquer nó para editar seu texto.</p>
        </div>
      </div>

      {/* Modal de Geração de Mapa Mental com IA */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-lg bg-sidebar/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display font-bold">
              <Sparkles className="h-5 w-5 text-accent" />
              Gerar Mapa Mental com IA
            </DialogTitle>
            <DialogDescription>
              Digite o tópico, meta ou desafio da sua empresa. A inteligência artificial irá estruturar
              uma árvore completa de ramos e sub-ramos acionáveis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Input
                placeholder="Ex: Lançamento de Software SaaS B2B, Estratégia de Redução de Churn..."
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !aiLoading) handleGenerateAI();
                }}
                disabled={aiLoading}
                className="bg-background/50 border-white/10 focus:border-accent"
              />
            </div>

            {/* Sugestões Rápidas */}
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Exemplos Prontos para Testar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Plano de Expansão Comercial 2026",
                  "Arquitetura de Segurança da Informação",
                  "Onboarding e Treinamento de Colaboradores",
                  "Funil de Vendas e Marketing de Conteúdo",
                  "Diagnóstico e Otimização de Custos",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAiTopic(preset)}
                    className="text-xs px-2.5 py-1 rounded-md bg-accent/10 hover:bg-accent/20 text-accent transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setAiModalOpen(false)}
              disabled={aiLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateAI}
              disabled={aiLoading || !aiTopic.trim()}
              className="bg-gradient-to-r from-accent to-purple-600 text-white font-semibold gap-2 shadow-glow"
            >
              {aiLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Estruturando nós...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Gerar Mapa Mental</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
