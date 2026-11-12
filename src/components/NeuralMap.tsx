import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Link as LinkIcon,
  Unlink,
  FileText,
  StickyNote,
  Sparkles,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  X,
  ChevronRight,
  GitFork,
  Check,
  Maximize2,
  FolderOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { RichColorPicker } from "@/components/ui/color-picker";

export interface Node {
  id: string; // UUID from neural_nodes or note.id
  label: string;
  x: number;
  y: number;
  color: string;
  note_id: string | null;
  is_note: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
}

const DEFAULT_COLORS = [
  "#0ea5e9", // Cyan (Obsidian style)
  "#a855f7", // Purple
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#6366f1", // Indigo
  "#f43f5e", // Rose
];

export function NeuralMap({ isTeam = false }: { isTeam?: boolean }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // Pan & Zoom state (Obsidian infinite camera)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [pointerStart, setPointerStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Floating constellation animation state
  const [time, setTime] = useState(0);

  // Dragging and selection
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragMoved, setDragMoved] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Modal states for creating standalone / separate node
  const [isNodeModalOpen, setNodeModalOpen] = useState(false);
  const [spawnPos, setSpawnPos] = useState<{ x: number; y: number } | null>(null);
  const [editNode, setEditNode] = useState<Node | null>(null);
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeColor, setNodeColor] = useState(DEFAULT_COLORS[0]);

  // Branch idea state (creating child node from selected node)
  const [branchInput, setBranchInput] = useState("");
  const [branchingLoading, setBranchingLoading] = useState(false);

  // Note Modal state (for editing full note content directly from the map)
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<{ id: string; title: string; content: string } | null>(null);

  // Animation Loop for subtle organic float
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTime((t) => t + 0.012);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Wheel listener: Ctrl/Meta + wheel zooms, regular wheel pans
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        // Zoom towards mouse
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        setZoom((z) => Math.min(2.5, Math.max(0.35, z * factor)));
      } else {
        // Pan
        setPan((p) => ({ x: p.x - e.deltaX * 0.8, y: p.y - e.deltaY * 0.8 }));
      }
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  // Fetch all nodes, edges, and notes from Supabase
  const loadMap = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let nodesQuery = supabase.from("neural_nodes").select("*");
      let edgesQuery = supabase.from("neural_edges").select("*");

      if (isTeam) {
        nodesQuery = nodesQuery.eq("is_team", true);
        edgesQuery = edgesQuery.eq("is_team", true);
      } else {
        nodesQuery = nodesQuery.eq("is_team", false).eq("user_id", user.id);
        edgesQuery = edgesQuery.eq("is_team", false).eq("user_id", user.id);
      }

      const [nodesRes, edgesRes, notesRes] = await Promise.all([
        nodesQuery,
        edgesQuery,
        isTeam
          ? Promise.resolve({ data: [], error: null })
          : supabase.from("notes").select("*").eq("user_id", user.id),
      ]);

      if (nodesRes.error) throw nodesRes.error;
      if (edgesRes.error) throw edgesRes.error;
      if (notesRes.error) throw notesRes.error;

      const dbNodes = nodesRes.data || [];
      const dbEdges = edgesRes.data || [];
      const dbNotes = notesRes.data || [];

      // Build the final nodes list merging DB neural_nodes and notes
      const finalNodes: Node[] = [];
      const noteMap = new Map(dbNotes.map((n) => [n.id, n]));

      // 1. Process existing database neural nodes
      dbNodes.forEach((dn) => {
        if (dn.note_id) {
          const note = noteMap.get(dn.note_id);
          if (note) {
            finalNodes.push({
              id: dn.id,
              label: note.title,
              x: dn.x,
              y: dn.y,
              color: note.color?.startsWith("#") ? note.color : dn.color || "#0ea5e9",
              note_id: note.id,
              is_note: true,
            });
            noteMap.delete(dn.note_id);
          }
        } else {
          finalNodes.push({
            id: dn.id,
            label: dn.label,
            x: dn.x,
            y: dn.y,
            color: dn.color || "#a855f7",
            note_id: null,
            is_note: false,
          });
        }
      });

      // 2. Add remaining notes that don't have coordinates yet (distribute in clean arc)
      Array.from(noteMap.values()).forEach((note, index) => {
        const angle = (index * (Math.PI * 2)) / Math.max(8, noteMap.size);
        const radius = 220 + (index % 3) * 60;
        const x = 400 + Math.cos(angle) * radius;
        const y = 300 + Math.sin(angle) * radius;

        finalNodes.push({
          id: `untracked_note_${note.id}`,
          label: note.title,
          x,
          y,
          color: note.color?.startsWith("#") ? note.color : "#0ea5e9",
          note_id: note.id,
          is_note: true,
        });
      });

      setNodes(finalNodes);
      setEdges(
        dbEdges.map((de) => ({
          id: de.id,
          source: de.source,
          target: de.target,
        }))
      );
    } catch (err: any) {
      toast.error("Erro ao carregar mapa neural: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user, isTeam]);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  // Selected Node data
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Nodes connected to currently selected/hovered node
  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const set = new Set<string>();
    set.add(activeFocusId);
    edges.forEach((e) => {
      if (e.source === activeFocusId) set.add(e.target);
      if (e.target === activeFocusId) set.add(e.source);
    });
    return set;
  }, [activeFocusId, edges]);

  // Node Degree (number of connected edges) -> calculates circle radius
  const getNodeRadius = useCallback(
    (nodeId: string) => {
      const degree = edges.filter((e) => e.source === nodeId || e.target === nodeId).length;
      return Math.min(36, Math.max(24, 24 + degree * 2.5)); // radius 24px - 36px (diameter 48px - 72px)
    },
    [edges]
  );

  // Node Floating Offset (subtle cosmic drift)
  const getNodePos = useCallback(
    (node: Node) => {
      if (draggingNode === node.id) {
        return { x: node.x, y: node.y };
      }
      const phase = node.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) || 1;
      const dx = Math.sin(time + phase * 0.1) * 4;
      const dy = Math.cos(time + phase * 0.1) * 4;
      return {
        x: node.x + dx,
        y: node.y + dy,
      };
    },
    [draggingNode, time]
  );

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent, id?: string) => {
    if (id) {
      e.stopPropagation();
      if (linkMode) {
        if (selectedNodeId && selectedNodeId !== id) {
          toggleEdge(selectedNodeId, id);
        } else {
          setSelectedNodeId(id);
        }
      } else {
        setDraggingNode(id);
        setDragMoved(false);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setSelectedNodeId(id);
      }
    } else {
      if (linkMode) {
        setSelectedNodeId(null);
        setLinkMode(false);
        return;
      }
      setIsPanning(true);
      setPointerStart({ x: e.clientX, y: e.clientY });
      setPanStart(pan);
      // Unselect if clicked on background
      setSelectedNodeId(null);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNode && containerRef.current) {
      const dist = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
      if (dist > 3) setDragMoved(true);

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNode ? { ...n, x, y } : n))
      );
    } else if (isPanning) {
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;
      setPan({ x: panStart.x + dx, y: panStart.y + dy });
    }
  };

  // Pointer Up
  const handlePointerUp = async () => {
    if (draggingNode && dragMoved) {
      const node = nodes.find((n) => n.id === draggingNode);
      if (node && user) {
        try {
          if (node.id.startsWith("untracked_note_")) {
            const { data, error } = await supabase
              .from("neural_nodes")
              .insert({
                user_id: user.id,
                label: node.label,
                x: Math.round(node.x),
                y: Math.round(node.y),
                color: node.color,
                note_id: node.note_id,
                is_team: isTeam,
              })
              .select("id")
              .single();

            if (error) throw error;
            if (data) {
              setNodes((prev) =>
                prev.map((n) => (n.id === draggingNode ? { ...n, id: data.id } : n))
              );
            }
          } else {
            await supabase
              .from("neural_nodes")
              .update({ x: Math.round(node.x), y: Math.round(node.y) })
              .eq("id", node.id);
          }
        } catch (err: any) {
          console.error("Erro ao salvar posição do nó:", err?.message);
        }
      }
    }
    setDraggingNode(null);
    setIsPanning(false);
  };

  // Double Click Background -> Create a new isolated/separate node at click coordinates
  const handleBackgroundDoubleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;

    setSpawnPos({ x: Math.round(x), y: Math.round(y) });
    setEditNode(null);
    setNodeLabel("");
    setNodeColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    setNodeModalOpen(true);
  };

  // Create or Toggle Connection (Edge)
  const toggleEdge = async (sourceId: string, targetId: string) => {
    if (!user) return;

    if (sourceId.startsWith("untracked_note_") || targetId.startsWith("untracked_note_")) {
      toast.error("Arraste o nó uma vez no mapa antes de conectá-lo!");
      return;
    }

    const exists = edges.find(
      (e) =>
        (e.source === sourceId && e.target === targetId) ||
        (e.source === targetId && e.target === sourceId)
    );

    try {
      if (exists) {
        const { error } = await supabase.from("neural_edges").delete().eq("id", exists.id);
        if (error) throw error;
        setEdges((prev) => prev.filter((e) => e.id !== exists.id));
        toast.success("Conexão removida!");
      } else {
        const { data, error } = await supabase
          .from("neural_edges")
          .insert({
            user_id: user.id,
            source: sourceId,
            target: targetId,
            is_team: isTeam,
          })
          .select("id")
          .single();

        if (error) throw error;
        if (data) {
          setEdges((prev) => [...prev, { id: data.id, source: sourceId, target: targetId }]);
          toast.success("Nós interligados com sucesso!");
        }
      }
    } catch (err: any) {
      toast.error("Erro ao alterar conexão: " + err.message);
    } finally {
      setLinkMode(false);
    }
  };

  // Open modal to create separate node
  const openNewSeparateNode = () => {
    setEditNode(null);
    setSpawnPos(null);
    setNodeLabel("");
    setNodeColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    setNodeModalOpen(true);
  };

  // Save Node Details (create new standalone node or edit existing)
  const saveNode = async () => {
    if (!user || !nodeLabel.trim()) return;

    try {
      if (editNode) {
        if (editNode.is_note) {
          const { error } = await supabase
            .from("notes")
            .update({ title: nodeLabel.trim() })
            .eq("id", editNode.note_id || "");
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("neural_nodes")
            .update({ label: nodeLabel.trim(), color: nodeColor })
            .eq("id", editNode.id);
          if (error) throw error;
        }
        toast.success("Ideia atualizada!");
      } else {
        // Spawn coordinates: either clicked position or current viewport center
        const defaultX = (450 - pan.x) / zoom;
        const defaultY = (300 - pan.y) / zoom;
        const x = spawnPos ? spawnPos.x : Math.round(defaultX);
        const y = spawnPos ? spawnPos.y : Math.round(defaultY);

        const { data, error } = await supabase
          .from("neural_nodes")
          .insert({
            user_id: user.id,
            label: nodeLabel.trim(),
            x,
            y,
            color: nodeColor,
            is_team: isTeam,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          toast.success("Nova ideia separada criada no mapa!");
          setSelectedNodeId(data.id);
        }
      }
      setNodeModalOpen(false);
      loadMap();
    } catch (err: any) {
      toast.error("Erro ao salvar nó: " + err.message);
    }
  };

  // Definir Novas Ideias DENTRO do Nó Selecionado -> vira novo Nó conectado automaticamente
  const handleBranchIdea = async () => {
    if (!selectedNode || !branchInput.trim() || !user) return;
    setBranchingLoading(true);

    try {
      // 1. Ensure parent node has a persistent database ID
      let parentId = selectedNode.id;
      if (parentId.startsWith("untracked_note_")) {
        const { data: savedParent, error: errParent } = await supabase
          .from("neural_nodes")
          .insert({
            user_id: user.id,
            label: selectedNode.label,
            x: Math.round(selectedNode.x),
            y: Math.round(selectedNode.y),
            color: selectedNode.color,
            note_id: selectedNode.note_id,
            is_team: isTeam,
          })
          .select("id")
          .single();

        if (errParent) throw errParent;
        parentId = savedParent.id;
      }

      // 2. Calculate radial spawn orbit around the parent circle
      const existingConnected = edges.filter(
        (e) => e.source === parentId || e.target === parentId
      );
      const childCount = existingConnected.length;
      // Orbit around parent
      const angle = childCount * (Math.PI / 3) + Math.PI / 4 + (Math.random() * 0.2 - 0.1);
      const orbitDistance = 140 + (childCount % 2) * 30;

      const childX = Math.round(selectedNode.x + Math.cos(angle) * orbitDistance);
      const childY = Math.round(selectedNode.y + Math.sin(angle) * orbitDistance);

      // Child inherits parent's color or picks an elegant accent
      const childColor = selectedNode.color || DEFAULT_COLORS[childCount % DEFAULT_COLORS.length];

      // 3. Create child node in neural_nodes
      const { data: newChild, error: errChild } = await supabase
        .from("neural_nodes")
        .insert({
          user_id: user.id,
          label: branchInput.trim(),
          x: childX,
          y: childY,
          color: childColor,
          is_team: isTeam,
        })
        .select()
        .single();

      if (errChild) throw errChild;

      // 4. Create connecting edge from parent to child
      const { error: errEdge } = await supabase
        .from("neural_edges")
        .insert({
          user_id: user.id,
          source: parentId,
          target: newChild.id,
          is_team: isTeam,
        });

      if (errEdge) throw errEdge;

      toast.success(`Nova ideia "${branchInput.trim()}" conectada ao nó!`, {
        icon: <GitFork className="h-4 w-4 text-emerald-500" />,
      });
      setBranchInput("");
      await loadMap();
      setSelectedNodeId(newChild.id);
    } catch (err: any) {
      toast.error("Erro ao ramificar ideia: " + err.message);
    } finally {
      setBranchingLoading(false);
    }
  };

  // Delete Node (Cascades edges in Supabase)
  const deleteNode = async (node: Node) => {
    if (!confirm(`Deseja remover "${node.label}" e suas conexões?`)) return;

    try {
      if (node.is_note) {
        const { error } = await supabase.from("notes").delete().eq("id", node.note_id || "");
        if (error) throw error;
        toast.success("Anotação excluída!");
      } else {
        const { error } = await supabase.from("neural_nodes").delete().eq("id", node.id);
        if (error) throw error;
        toast.success("Ideia removida!");
      }
      setSelectedNodeId(null);
      loadMap();
    } catch (err: any) {
      toast.error("Erro ao excluir nó: " + err.message);
    }
  };

  // Double Click Note Node -> Open Full Note Editor Modal
  const handleNodeDoubleClick = async (node: Node) => {
    if (node.is_note && node.note_id) {
      try {
        const { data, error } = await supabase
          .from("notes")
          .select("*")
          .eq("id", node.note_id)
          .single();
        if (error) throw error;
        if (data) {
          setActiveNote({
            id: data.id,
            title: data.title,
            content: data.content || "",
          });
          setNoteModalOpen(true);
        }
      } catch (err: any) {
        toast.error("Erro ao carregar anotação: " + err.message);
      }
    } else {
      // For regular ideas, open the edit title/color modal
      setEditNode(node);
      setNodeLabel(node.label);
      setNodeColor(node.color);
      setNodeModalOpen(true);
    }
  };

  // Save Note Changes from Modal
  const saveNoteContent = async () => {
    if (!activeNote) return;
    try {
      const { error } = await supabase
        .from("notes")
        .update({
          title: activeNote.title.trim(),
          content: activeNote.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeNote.id);
      if (error) throw error;
      toast.success("Anotação salva!");
      setNoteModalOpen(false);
      loadMap();
    } catch (err: any) {
      toast.error("Erro ao salvar anotação: " + err.message);
    }
  };

  // Reset Camera View
  const handleResetCamera = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedNodeId(null);
  };

  // Get currently connected neighbor nodes for inspector
  const neighborNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const neighbors: Array<{ node: Node; edgeId: string }> = [];
    edges.forEach((e) => {
      if (e.source === selectedNodeId) {
        const target = nodes.find((n) => n.id === e.target);
        if (target) neighbors.push({ node: target, edgeId: e.id });
      } else if (e.target === selectedNodeId) {
        const source = nodes.find((n) => n.id === e.source);
        if (source) neighbors.push({ node: source, edgeId: e.id });
      }
    });
    return neighbors;
  }, [selectedNodeId, edges, nodes]);

  return (
    <div
      ref={containerRef}
      className="h-full min-h-[620px] w-full relative overflow-hidden bg-background dark:bg-[#0a0e17] text-foreground rounded-2xl border border-border shadow-xl select-none cursor-grab active:cursor-grabbing flex flex-col"
      onPointerDown={(e) => handlePointerDown(e)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onDoubleClick={handleBackgroundDoubleClick}
    >
      {/* Obsidian Constellation Background (adaptado ao tema claro/escuro) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-transform duration-75"
        style={{
          backgroundImage: isDark
            ? `
              radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.14) 1.5px, transparent 1.5px),
              radial-gradient(circle at 20% 30%, rgba(168, 85, 247, 0.08) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.08) 0%, transparent 40%)
            `
            : `
              radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.12) 1.5px, transparent 1.5px),
              radial-gradient(circle at 20% 30%, rgba(14, 165, 233, 0.06) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.06) 0%, transparent 40%)
            `,
          backgroundSize: "36px 36px, 100% 100%, 100% 100%",
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      />

      {/* Top Floating Obsidian Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        <Button
          size="sm"
          onClick={openNewSeparateNode}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow h-8 text-xs font-semibold gap-1.5 rounded-xl"
        >
          <Plus className="h-3.5 w-3.5" /> Nova Ideia Separada
        </Button>

        <Button
          size="sm"
          variant={linkMode ? "default" : "outline"}
          onClick={() => {
            setLinkMode(!linkMode);
          }}
          className={`h-8 text-xs font-semibold rounded-xl gap-1.5 transition-all ${
            linkMode
              ? "bg-accent text-accent-foreground shadow-glow-accent border-accent"
              : "bg-card/85 backdrop-blur-md border-border hover:bg-card text-foreground"
          }`}
        >
          {linkMode ? <Unlink className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
          {linkMode ? "Conectando... (Clique em 2 Nós)" : "Conectar Nós"}
        </Button>

        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar no mapa..."
            className="pl-8 pr-7 h-8 w-40 sm:w-48 text-xs rounded-xl bg-card/85 backdrop-blur-md border-border focus:border-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-card/85 backdrop-blur-md p-1 rounded-xl border border-border shadow-elegant pointer-events-auto">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          title="Aumentar Zoom (+)"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] font-mono font-semibold px-1 text-muted-foreground min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setZoom((z) => Math.max(0.35, z * 0.85))}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          title="Diminuir Zoom (-)"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="w-[1px] h-4 bg-border mx-0.5" />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleResetCamera}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          title="Centralizar e Redefinir Câmera"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Obsidian Bottom Left Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:block">
        <div className="p-3 rounded-xl bg-card/85 backdrop-blur-md border border-border text-[10px] text-muted-foreground space-y-1 shadow-elegant">
          <p className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            Nós Circulares Obsidian: ideias e pensamentos conectados
          </p>
          <p className="flex items-center gap-1.5">
            <GitFork className="h-3 w-3 text-purple-400" />
            Clique em qualquer círculo para <strong>definir novas ideias ramificadas</strong>
          </p>
          <p className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-400" />
            Duplo clique no fundo cria um <strong>nó separado</strong> onde você clicar
          </p>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs text-muted-foreground">Carregando constelação de ideias...</p>
          </div>
        </div>
      )}

      {/* Connection Mode Banner */}
      {linkMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <Badge className="bg-accent text-accent-foreground border-accent shadow-glow px-3 py-1 text-xs animate-bounce font-semibold">
            {selectedNodeId
              ? "Agora clique no 2º círculo para conectar ou desconectar"
              : "Clique no primeiro círculo para iniciar a conexão"}
          </Badge>
        </div>
      )}

      {/* Canvas Layer: Edges (SVG) and Nodes (Circles) scaled and panned */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Connections Layer */}
        <svg className="absolute inset-0 w-[10000px] h-[10000px] -left-[2000px] -top-[2000px] pointer-events-none">
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const sPos = getNodePos(sourceNode);
            const tPos = getNodePos(targetNode);

            // Offset by the SVG's negative origin
            const x1 = sPos.x + 2000;
            const y1 = sPos.y + 2000;
            const x2 = tPos.x + 2000;
            const y2 = tPos.y + 2000;

            const isEdgeHighlighted =
              activeFocusId && (edge.source === activeFocusId || edge.target === activeFocusId);

            return (
              <g key={edge.id}>
                {/* Outer Glow Line on Active */}
                {isEdgeHighlighted && (
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#38bdf8"
                    strokeWidth="4"
                    strokeOpacity="0.4"
                    className="filter blur-[2px] animate-pulse"
                  />
                )}
                {/* Main Connection Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isEdgeHighlighted
                      ? isDark ? "#38bdf8" : "#0284c7"
                      : isDark ? "rgba(255, 255, 255, 0.25)" : "rgba(15, 23, 42, 0.24)"
                  }
                  strokeWidth={isEdgeHighlighted ? "2.5" : "1.5"}
                  strokeDasharray={isEdgeHighlighted ? undefined : undefined}
                  className="transition-colors duration-200"
                />
              </g>
            );
          })}

          {/* Linking Mode Active Circle Indicator */}
          {linkMode && selectedNode && (() => {
            const activePos = getNodePos(selectedNode);
            const r = getNodeRadius(selectedNode.id);
            return (
              <circle
                cx={activePos.x + 2000}
                cy={activePos.y + 2000}
                r={r + 14}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-spin origin-center"
              />
            );
          })()}
        </svg>

        {/* Nodes Layer: Obsidian-style Circles */}
        {nodes.map((node) => {
          const renderPos = getNodePos(node);
          const radius = getNodeRadius(node.id);
          const diameter = radius * 2;
          const nodeColorHex = node.color?.startsWith("#") ? node.color : "#0ea5e9";

          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isFocusedGroup = !activeFocusId || connectedNodeIds.has(node.id);
          const matchesSearch =
            !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase());

          const opacity = matchesSearch ? (isFocusedGroup ? "opacity-100" : "opacity-30") : "opacity-20";

          return (
            <div
              key={node.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing pointer-events-auto transition-opacity duration-200 ${opacity}`}
              style={{
                left: renderPos.x,
                top: renderPos.y,
              }}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleNodeDoubleClick(node);
              }}
            >
              {/* Obsidian Circle Orb */}
              <div
                className={`
                  relative rounded-full flex items-center justify-center transition-all duration-200
                  ${isSelected ? "scale-115 ring-2 ring-accent ring-offset-2 ring-offset-background" : "hover:scale-110"}
                `}
                style={{
                  width: `${diameter}px`,
                  height: `${diameter}px`,
                  backgroundColor: `${nodeColorHex}28`,
                  borderColor: nodeColorHex,
                  borderWidth: isSelected ? "3px" : "2px",
                  boxShadow: isSelected
                    ? `0 0 25px ${nodeColorHex}99, inset 0 0 15px ${nodeColorHex}55`
                    : isHovered
                    ? `0 0 18px ${nodeColorHex}77`
                    : `0 0 10px ${nodeColorHex}40`,
                }}
              >
                {/* Glowing Core Dot / Icon */}
                {node.is_note ? (
                  <FileText className="h-4 w-4" style={{ color: nodeColorHex }} />
                ) : (
                  <div
                    className="rounded-full animate-pulse"
                    style={{
                      width: `${Math.round(radius * 0.55)}px`,
                      height: `${Math.round(radius * 0.55)}px`,
                      backgroundColor: nodeColorHex,
                      boxShadow: `0 0 10px ${nodeColorHex}`,
                    }}
                  />
                )}

                {/* Quick Add Child Idea Badge on the Circle Border */}
                {isSelected && !linkMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Focus the branch input in the inspector
                      const inputEl = document.getElementById("branch-idea-input");
                      if (inputEl) inputEl.focus();
                    }}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-glow transition-transform hover:scale-110 font-bold"
                    title="Definir nova ideia derivada deste nó"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Obsidian Label Below Circle */}
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                <span
                  className={`
                    text-[11px] font-semibold px-2.5 py-0.5 rounded-full text-center max-w-[130px] truncate leading-tight shadow-sm transition-all
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-md"
                        : "bg-card/90 backdrop-blur-md text-foreground border border-border"
                    }
                  `}
                  title={node.label}
                >
                  {node.label}
                </span>
                {node.is_note && (
                  <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">anotação</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Obsidian Node Inspector Panel (Definir novas ideias dentro do nó) */}
      {selectedNode && (
        <div className="absolute top-4 right-4 z-20 w-80 sm:w-88 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-4 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-auto flex flex-col gap-3.5 max-h-[calc(100%-32px)] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                style={{
                  backgroundColor: selectedNode.color || "#0ea5e9",
                  boxShadow: `0 0 10px ${selectedNode.color || "#0ea5e9"}`,
                }}
              />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate" title={selectedNode.label}>
                  {selectedNode.label}
                </h3>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                  {selectedNode.is_note ? "Anotação Vinculada" : "Ideia Livre (Mapa Neural)"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedNodeId(null)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Section: Definir Novas Ideias Dentro Deste Nó (Ramificação Automática) */}
          <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 space-y-2">
            <div className="flex items-center gap-1.5 text-accent font-semibold text-xs">
              <GitFork className="h-4 w-4" />
              <span>Ramificar Nova Ideia deste Nó</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Digite uma nova ideia relacionada. Ela será criada como um <strong>novo nó circular</strong> já interligado a este!
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBranchIdea();
              }}
              className="space-y-2 pt-1"
            >
              <Input
                id="branch-idea-input"
                value={branchInput}
                onChange={(e) => setBranchInput(e.target.value)}
                placeholder="Ex: Definir arquitetura técnica..."
                className="h-8 text-xs bg-background/80 border-border focus:border-accent"
                disabled={branchingLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!branchInput.trim() || branchingLoading}
                className="w-full h-8 text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 shadow-glow-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                {branchingLoading ? "Conectando..." : "Criar Novo Nó Conectado"}
              </Button>
            </form>
          </div>

          {/* Section: Conexões Atuais */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-accent" /> Conexões ({neighborNodes.length})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLinkMode(true)}
                className="h-6 text-[10px] px-2 text-accent hover:text-accent font-semibold"
              >
                + Ligar a outro nó
              </Button>
            </div>

            {neighborNodes.length === 0 ? (
              <p className="text-[11px] text-muted-foreground/70 italic p-2 rounded-lg bg-muted/20 border border-dashed border-border text-center">
                Este nó ainda está isolado. Ramifique uma ideia acima ou use "Conectar Nós".
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {neighborNodes.map(({ node, edgeId }) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-card/60 hover:bg-card border border-border text-xs transition cursor-pointer group"
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: node.color || "#0ea5e9" }}
                      />
                      <span className="truncate font-medium text-foreground group-hover:text-accent">
                        {node.label}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEdge(selectedNode.id, node.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition shrink-0"
                      title="Remover conexão"
                    >
                      <Unlink className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions Bottom Bar */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            {selectedNode.is_note ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleNodeDoubleClick(selectedNode)}
                className="h-8 text-xs gap-1.5 flex-1 border-border hover:bg-accent hover:text-accent-foreground"
              >
                <FileText className="h-3.5 w-3.5 text-accent" /> Abrir Anotação
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditNode(selectedNode);
                  setNodeLabel(selectedNode.label);
                  setNodeColor(selectedNode.color);
                  setNodeModalOpen(true);
                }}
                className="h-8 text-xs gap-1.5 flex-1 border-border hover:bg-accent hover:text-accent-foreground"
              >
                <Edit2 className="h-3.5 w-3.5" /> Editar Nó
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteNode(selectedNode)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Excluir este nó"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Idea Creation / Edit Modal (Para novos nós separados ou edição) */}
      <Dialog open={isNodeModalOpen} onOpenChange={setNodeModalOpen}>
        <DialogContent className="sm:max-w-[380px] bg-card/95 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              {editNode ? "Editar Ideia" : "Nova Ideia Separada"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {editNode
                ? "Altere o título ou a cor desta ideia no mapa neural."
                : "Crie um novo nó circular isolado. Depois você pode ramificá-lo ou conectá-lo livremente a outros."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nome / Título da Ideia</Label>
              <Input
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Ex: Arquitetura de Microsserviços..."
                className="text-xs bg-background/80"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNode();
                }}
              />
            </div>
            {!editNode?.is_note && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Cor do Círculo</Label>
                <RichColorPicker
                  value={nodeColor}
                  onChange={(c) => setNodeColor(c)}
                  compact
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveNode} disabled={!nodeLabel.trim()} className="w-full bg-primary font-semibold">
              {editNode ? "Salvar Alterações" : "Criar Nó Separado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Note Editor Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Editar Anotação Vinculada
            </DialogTitle>
          </DialogHeader>
          {activeNote && (
            <div className="space-y-4 py-2 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-xs">Título da Anotação</Label>
                <Input
                  value={activeNote.title}
                  onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Conteúdo da Anotação</Label>
                <textarea
                  value={activeNote.content}
                  onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
                  className="w-full min-h-[220px] p-3 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-accent resize-none font-mono"
                  placeholder="Escreva seus pensamentos e anotações aqui..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0">
            <Button onClick={saveNoteContent} className="w-full bg-primary font-semibold">
              Salvar Anotação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
