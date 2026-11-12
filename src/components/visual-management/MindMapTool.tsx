import { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus, Trash2, Edit3, Sparkles, ZoomIn, ZoomOut, RotateCcw,
  Download, Eye, EyeOff, Layout, Palette, Check,
  ChevronRight, Network, Layers, GitFork, ArrowDown, GitBranch,
  HelpCircle, Copy, Share2, Compass
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
  palette: "cyber-neon",
  root: {
    id: "root-1",
    text: "Estratégia de Crescimento EXACTA",
    color: "#8b5cf6",
    children: [
      {
        id: "c1",
        text: "Produto & Inovação",
        children: [
          { id: "c1-1", text: "Gestão Visual com Mapas Mentais", children: [] },
          { id: "c1-2", text: "Módulo de Finanças Pessoais & Cartões", children: [] },
          { id: "c1-3", text: "Área de Treinamentos e Manuais", children: [] },
          { id: "c1-4", text: "Colaboração ao Vivo em Projetos", children: [] },
        ],
      },
      {
        id: "c2",
        text: "Operações & Produtividade",
        children: [
          { id: "c2-1", text: "Automação de Lançamentos Recorrentes", children: [] },
          { id: "c2-2", text: "Alertas Pop-up de Contas Próximas", children: [] },
          { id: "c2-3", text: "Importação Inteligente de Planilhas CSV", children: [] },
        ],
      },
      {
        id: "c3",
        text: "Pessoas & Cultura",
        children: [
          { id: "c3-1", text: "Onboarding Estruturado com Vídeos", children: [] },
          { id: "c3-2", text: "Manuais Operacionais Padronizados (POPs)", children: [] },
          { id: "c3-3", text: "Feedback 360° e Metas Compartilhadas", children: [] },
        ],
      },
      {
        id: "c4",
        text: "BI & Análise de Dados",
        children: [
          { id: "c4-1", text: "Conexão Direta com MariaDB / MySQL", children: [] },
          { id: "c4-2", text: "Geração de Consultas com IA Especializada", children: [] },
          { id: "c4-3", text: "Dashboards Executivos de Performance", children: [] },
        ],
      },
    ],
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

  // Manipulação de Pan & Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === "svg") {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
        backgroundColor: "#0d1117",
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
    <div className="flex flex-col h-full w-full min-h-[680px] bg-card/40 rounded-xl border border-white/5 overflow-hidden select-none">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-white/5 bg-sidebar/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Esquerda: Tipo de Layout e Paleta */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layout Selector */}
          <div className="flex items-center gap-1 bg-background/50 border border-white/10 rounded-lg p-1">
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
          <div className="flex items-center gap-1 bg-background/50 border border-white/10 rounded-lg p-1">
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

          {/* Botão IA */}
          <Button
            size="sm"
            onClick={() => setAiModalOpen(true)}
            className="h-8 gap-1.5 bg-gradient-to-r from-accent to-purple-600 text-white font-semibold shadow-glow text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gerar com IA</span>
          </Button>

          {/* Exportar PNG */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPNG}
            className="h-8 px-2.5 text-xs gap-1.5 border-white/10 hover:border-accent"
            title="Exportar imagem PNG"
          >
            <Download className="h-3.5 w-3.5 text-accent" />
            <span className="hidden sm:inline">Exportar PNG</span>
          </Button>
        </div>
      </div>

      {/* Canvas Principal com Arraste, Linhas SVG e Cartões */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "flex-1 relative overflow-hidden bg-[#0c1017] cursor-grab active:cursor-grabbing",
          "bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]"
        )}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x + (canvasRef.current?.clientWidth || 800) / 2}px, ${
              pan.y + (canvasRef.current?.clientHeight || 600) / 2
            }px) scale(${zoom})`,
            transformOrigin: "0 0",
            transition: isPanning ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* Conexões SVG Suaves Bezier */}
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

            {layoutCalculations.map((p) => {
              if (!p.parentPos) return null;
              const sourceX = p.parentPos.x;
              const sourceY = p.parentPos.y;

              // Destino baseado no layout
              let targetX = p.x;
              let targetY = p.y + p.height / 2;

              if (mapData.layout === "radial") {
                if (p.x < 0) {
                  // Ramo esquerdo
                  targetX = p.x + p.width;
                }
              } else if (mapData.layout === "org-chart") {
                targetX = p.x + p.width / 2;
                targetY = p.y;
              }

              // Curvas Bézier naturais e limpas
              let pathData = "";
              if (mapData.layout === "radial") {
                const dx = (targetX - sourceX) * 0.55;
                pathData = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
              } else if (mapData.layout === "tree-right") {
                const dx = (targetX - sourceX) * 0.5;
                pathData = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
              } else if (mapData.layout === "org-chart") {
                const dy = (targetY - sourceY) * 0.5;
                pathData = `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + dy}, ${targetX} ${targetY - dy}, ${targetX} ${targetY}`;
              } else if (mapData.layout === "ishikawa") {
                // Diagonais retas técnicas de espinha de peixe
                pathData = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
              } else {
                const dy = (targetY - sourceY) * 0.5;
                pathData = `M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + dy}, ${targetX} ${targetY - dy}, ${targetX} ${targetY}`;
              }

              return (
                <path
                  key={`edge-${p.node.id}`}
                  d={pathData}
                  fill="none"
                  stroke={p.color || "#06b6d4"}
                  strokeWidth={Math.max(1.8, 3.2 - p.level * 0.7)}
                  strokeOpacity={0.65}
                  strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Cartões dos Nós */}
          {layoutCalculations.map((p) => {
            const isRoot = p.level === 0;
            const isSelected = selectedNodeId === p.node.id;
            const isEditing = editingNodeId === p.node.id;
            const hasChildren = p.node.children && p.node.children.length > 0;

            return (
              <div
                key={p.node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(p.node.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditing(p.node);
                }}
                className={cn(
                  "absolute pointer-events-auto rounded-xl flex items-center justify-between px-3.5 transition-all duration-150 group",
                  "backdrop-blur-md shadow-card border text-foreground",
                  isRoot
                    ? "font-bold text-sm tracking-wide text-white border-white/20 shadow-glow"
                    : "text-xs font-medium border-white/10 hover:border-accent/50",
                  isSelected
                    ? "ring-2 ring-accent ring-offset-2 ring-offset-[#0c1017] border-accent"
                    : ""
                )}
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.width,
                  height: p.height,
                  background: isRoot
                    ? currentPalette.rootBg
                    : `linear-gradient(135deg, rgba(25, 33, 44, 0.95), rgba(15, 23, 34, 0.98))`,
                  borderColor: isSelected ? p.color : isRoot ? "transparent" : `${p.color}40`,
                  boxShadow: isSelected
                    ? `0 0 16px ${p.color}60`
                    : `0 4px 12px rgba(0,0,0,0.3)`,
                }}
              >
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
                      className="h-7 text-xs bg-black/60 border-accent px-1.5 py-0 text-white"
                    />
                  ) : (
                    <span
                      className={cn(
                        "block truncate leading-tight",
                        isRoot ? "text-white font-semibold" : "text-gray-100"
                      )}
                      title={p.node.text}
                    >
                      {p.node.text}
                    </span>
                  )}
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
                {hasChildren && (
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

        {/* Floating Mini Guide */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-lg p-2.5 text-[11px] text-muted-foreground space-y-1 hidden md:block">
          <p className="font-semibold text-white flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-accent" /> Dicas de Navegação:
          </p>
          <p>• Clique e arraste no fundo para mover o mapa (Pan).</p>
          <p>• Dê duplo clique em qualquer nó para editar seu texto.</p>
          <p>• Selecione um nó e use <span className="text-accent font-mono">+ Sub-nó</span> ou <span className="text-accent font-mono">+ Irmão</span>.</p>
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
