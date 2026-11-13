import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Link as LinkIcon,
  Unlink,
  FileText,
  Sparkles,
  Network,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  GitFork,
  SlidersHorizontal,
  Magnet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { RichColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";

export interface Node {
  id: string; // UUID from neural_nodes (or untracked_note_<id>)
  label: string;
  content?: string;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
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
  "#94a3b8", // Obsidian Slate
  "#38bdf8", // Sky
  "#a855f7", // Purple
  "#10b981", // Emerald
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

  // Camera Pan & Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [pointerStart, setPointerStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Dragging & Interaction
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragMoved, setDragMoved] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);

  // Obsidian Graph Settings Panel (Filtros, Tela, Forças)
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [openSections, setOpenSections] = useState<{
    filters: boolean;
    display: boolean;
    forces: boolean;
  }>({
    filters: true,
    display: false,
    forces: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showOrphans, setShowOrphans] = useState(true);
  const [alwaysShowLabels, setAlwaysShowLabels] = useState(true);
  const [nodeScale, setNodeScale] = useState(1);
  const [lineWidth, setLineWidth] = useState(1.2);
  const [physicsEnabled, setPhysicsEnabled] = useState(true);
  const [repulsionForce, setRepulsionForce] = useState(180);
  const [linkDistance, setLinkDistance] = useState(130);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Modal: Create New Node / Note
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [spawnPos, setSpawnPos] = useState<{ x: number; y: number } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [creatingLoading, setCreatingLoading] = useState(false);

  // Modal: Open / Edit Note & Description (works for ALL nodes)
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNoteNode, setActiveNoteNode] = useState<{
    nodeId: string;
    noteId: string | null;
    title: string;
    content: string;
    color: string;
  } | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  // Branch idea input inside inspector
  const [branchInput, setBranchInput] = useState("");
  const [branchingLoading, setBranchingLoading] = useState(false);
  const [linkTargetId, setLinkTargetId] = useState("");

  // Wheel listener: scroll zooms smoothly towards center/cursor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) < 4) {
        const factor = e.deltaY < 0 ? 1.09 : 0.91;
        setZoom((z) => Math.min(3, Math.max(0.25, z * factor)));
      } else {
        setPan((p) => ({ x: p.x - e.deltaX * 0.8, y: p.y - e.deltaY * 0.8 }));
      }
    };
    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, []);

  // Load nodes, edges and linked notes from Supabase
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
        supabase.from("notes").select("*").eq("user_id", user.id),
      ]);

      if (nodesRes.error) throw nodesRes.error;
      if (edgesRes.error) throw edgesRes.error;
      if (notesRes.error) throw notesRes.error;

      const dbNodes = nodesRes.data || [];
      const dbEdges = edgesRes.data || [];
      const dbNotes = notesRes.data || [];

      const finalNodes: Node[] = [];
      const noteMap = new Map(dbNotes.map((n) => [n.id, n]));

      dbNodes.forEach((dn) => {
        if (dn.note_id && noteMap.has(dn.note_id)) {
          const note = noteMap.get(dn.note_id)!;
          finalNodes.push({
            id: dn.id,
            label: note.title || dn.label,
            content: note.content || "",
            x: dn.x,
            y: dn.y,
            vx: 0,
            vy: 0,
            color: note.color?.startsWith("#") ? note.color : dn.color || DEFAULT_COLORS[0],
            note_id: note.id,
            is_note: true,
          });
          noteMap.delete(dn.note_id);
        } else {
          finalNodes.push({
            id: dn.id,
            label: dn.label,
            content: "",
            x: dn.x,
            y: dn.y,
            vx: 0,
            vy: 0,
            color: dn.color || DEFAULT_COLORS[0],
            note_id: dn.note_id || null,
            is_note: Boolean(dn.note_id),
          });
        }
      });

      // In personal mode, also surface notes that aren't placed on the graph yet
      if (!isTeam) {
        Array.from(noteMap.values()).forEach((note, index) => {
          const angle = (index * (Math.PI * 2)) / Math.max(8, noteMap.size);
          const radius = 210 + (index % 3) * 55;
          const x = Math.round(Math.cos(angle) * radius);
          const y = Math.round(Math.sin(angle) * radius);

          finalNodes.push({
            id: `untracked_note_${note.id}`,
            label: note.title,
            content: note.content || "",
            x,
            y,
            vx: 0,
            vy: 0,
            color: note.color?.startsWith("#") ? note.color : DEFAULT_COLORS[0],
            note_id: note.id,
            is_note: true,
          });
        });
      }

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

  // Force-directed simulation (Obsidian style physics)
  useEffect(() => {
    if (!physicsEnabled || loading || nodesRef.current.length === 0) return;

    let animId: number;
    let tickCount = 0;

    const step = () => {
      tickCount++;
      setNodes((prevNodes) => {
        if (prevNodes.length <= 1) return prevNodes;

        const next = prevNodes.map((n) => ({ ...n, vx: n.vx || 0, vy: n.vy || 0 }));
        const idxMap = new Map(next.map((n, i) => [n.id, i]));
        const currentEdges = edgesRef.current;

        // 1. Repulsion between all pairs
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let distSq = dx * dx + dy * dy;
            if (distSq < 1) {
              dx = (Math.random() - 0.5) * 4;
              dy = (Math.random() - 0.5) * 4;
              distSq = dx * dx + dy * dy || 1;
            }
            const dist = Math.sqrt(distSq);
            if (dist < repulsionForce * 2.4) {
              const force = (repulsionForce * 14) / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              if (a.id !== draggingNode) {
                a.vx! -= fx;
                a.vy! -= fy;
              }
              if (b.id !== draggingNode) {
                b.vx! += fx;
                b.vy! += fy;
              }
            }
          }
        }

        // 2. Spring attraction along edges
        for (const edge of currentEdges) {
          const iA = idxMap.get(edge.source);
          const iB = idxMap.get(edge.target);
          if (iA === undefined || iB === undefined) continue;
          const a = next[iA];
          const b = next[iB];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const displacement = dist - linkDistance;
          const springForce = displacement * 0.032;
          const fx = (dx / dist) * springForce;
          const fy = (dy / dist) * springForce;

          if (a.id !== draggingNode) {
            a.vx! += fx;
            a.vy! += fy;
          }
          if (b.id !== draggingNode) {
            b.vx! -= fx;
            b.vy! -= fy;
          }
        }

        // 3. Gentle center gravity + velocity damping
        let totalEnergy = 0;
        for (const n of next) {
          if (n.id === draggingNode) {
            n.vx = 0;
            n.vy = 0;
            continue;
          }
          n.vx = (n.vx! - n.x * 0.008) * 0.78;
          n.vy = (n.vy! - n.y * 0.008) * 0.78;

          // Clamp max speed per frame
          const speed = Math.hypot(n.vx!, n.vy!);
          if (speed > 12) {
            n.vx = (n.vx! / speed) * 12;
            n.vy = (n.vy! / speed) * 12;
          }
          n.x += n.vx!;
          n.y += n.vy!;
          totalEnergy += speed;
        }

        // Stop updating if system settled and not dragging
        if (totalEnergy < 0.08 && !draggingNode && tickCount > 30) {
          return prevNodes;
        }
        return next;
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [physicsEnabled, loading, draggingNode, repulsionForce, linkDistance]);

  // Helper: ensure a node exists in `neural_nodes` (materializes untracked_note_ if needed)
  const ensurePersistedNodeId = async (node: Node): Promise<string> => {
    if (!user) throw new Error("Usuário não autenticado");
    if (!node.id.startsWith("untracked_note_")) return node.id;

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
    return data.id;
  };

  // Global mouse/pointer drag listener for 0ms lag
  useEffect(() => {
    if (!draggingNode && !isPanning) return;

    let rafId: number | null = null;
    const onWindowMove = (e: PointerEvent | MouseEvent) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      const clientX = e.clientX;
      const clientY = e.clientY;

      rafId = requestAnimationFrame(() => {
        if (draggingNode && containerRef.current) {
          const dist = Math.hypot(clientX - dragStartPos.x, clientY - dragStartPos.y);
          if (dist > 3) setDragMoved(true);

          const rect = containerRef.current.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const x = (clientX - rect.left - cx - pan.x) / zoom;
          const y = (clientY - rect.top - cy - pan.y) / zoom;

          setNodes((prev) =>
            prev.map((n) => (n.id === draggingNode ? { ...n, x, y, vx: 0, vy: 0 } : n))
          );
        } else if (isPanning) {
          setPan({
            x: panStart.x + (clientX - pointerStart.x),
            y: panStart.y + (clientY - pointerStart.y),
          });
        }
      });
    };

    const onWindowUp = async () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (draggingNode && dragMoved && user) {
        const node = nodesRef.current.find((n) => n.id === draggingNode);
        if (node) {
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
              if (!error && data) {
                setNodes((prev) =>
                  prev.map((n) => (n.id === draggingNode ? { ...n, id: data.id } : n))
                );
                if (selectedNodeId === draggingNode) setSelectedNodeId(data.id);
              }
            } else {
              await supabase
                .from("neural_nodes")
                .update({ x: Math.round(node.x), y: Math.round(node.y) })
                .eq("id", node.id);
            }
          } catch (err) {
            console.error("Erro ao salvar posição:", err);
          }
        }
      }
      setDraggingNode(null);
      setIsPanning(false);
    };

    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowUp);
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
    };
  }, [draggingNode, isPanning, dragMoved, dragStartPos, pan, zoom, panStart, pointerStart, user, isTeam, selectedNodeId]);

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
        setLinkMode(false);
      }
      setIsPanning(true);
      setPointerStart({ x: e.clientX, y: e.clientY });
      setPanStart(pan);
      setSelectedNodeId(null);
    }
  };

  // Double click canvas -> Open modal to create new Note/Node at that exact position
  const handleBackgroundDoubleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const x = (e.clientX - rect.left - cx - pan.x) / zoom;
    const y = (e.clientY - rect.top - cy - pan.y) / zoom;

    setSpawnPos({ x: Math.round(x), y: Math.round(y) });
    setNewTitle("");
    setNewContent("");
    setNewColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    setCreateModalOpen(true);
  };

  const openNewSeparateNode = () => {
    setSpawnPos(null);
    setNewTitle("");
    setNewContent("");
    setNewColor(DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)]);
    setCreateModalOpen(true);
  };

  // Create Note + Neural Node together so every node can be opened and have descriptions
  const handleCreateNodeAndNote = async () => {
    if (!user || !newTitle.trim()) return;
    setCreatingLoading(true);
    try {
      const x = spawnPos ? spawnPos.x : Math.round(-pan.x / zoom + (Math.random() - 0.5) * 60);
      const y = spawnPos ? spawnPos.y : Math.round(-pan.y / zoom + (Math.random() - 0.5) * 60);

      // 1. Create note in `notes` table
      const { data: createdNote, error: noteErr } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: newTitle.trim(),
          content: newContent.trim() || null,
          color: newColor,
        })
        .select("id")
        .single();

      if (noteErr) throw noteErr;

      // 2. Create node in `neural_nodes` linked to this note
      const { data: createdNode, error: nodeErr } = await supabase
        .from("neural_nodes")
        .insert({
          user_id: user.id,
          label: newTitle.trim(),
          x,
          y,
          color: newColor,
          note_id: createdNote.id,
          is_team: isTeam,
        })
        .select()
        .single();

      if (nodeErr) throw nodeErr;

      toast.success("Nota (nó) criada no mapa!");
      setCreateModalOpen(false);
      await loadMap();
      if (createdNode) setSelectedNodeId(createdNode.id);
    } catch (err: any) {
      toast.error("Erro ao criar nó: " + err.message);
    } finally {
      setCreatingLoading(false);
    }
  };

  // Link or Unlink two nodes (automatically materializes untracked notes)
  const toggleEdge = async (rawSourceId: string, rawTargetId: string) => {
    if (!user || rawSourceId === rawTargetId) return;

    const sourceNode = nodes.find((n) => n.id === rawSourceId);
    const targetNode = nodes.find((n) => n.id === rawTargetId);
    if (!sourceNode || !targetNode) return;

    try {
      const sourceId = await ensurePersistedNodeId(sourceNode);
      const targetId = await ensurePersistedNodeId(targetNode);

      const exists = edges.find(
        (e) =>
          (e.source === sourceId && e.target === targetId) ||
          (e.source === targetId && e.target === sourceId)
      );

      if (exists) {
        const { error } = await supabase.from("neural_edges").delete().eq("id", exists.id);
        if (error) throw error;
        setEdges((prev) => prev.filter((e) => e.id !== exists.id));
        toast.success("Vínculo removido!");
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
          toast.success("Nós vinculados!");
        }
      }
      if (sourceId !== rawSourceId || targetId !== rawTargetId) {
        await loadMap();
      }
    } catch (err: any) {
      toast.error("Erro ao vincular nós: " + err.message);
    } finally {
      setLinkMode(false);
    }
  };

  // Create child Note/Node branched from selected node
  const handleBranchIdea = async () => {
    if (!selectedNode || !branchInput.trim() || !user) return;
    setBranchingLoading(true);
    try {
      const parentId = await ensurePersistedNodeId(selectedNode);
      const childCount = edges.filter((e) => e.source === parentId || e.target === parentId).length;
      const angle = childCount * (Math.PI / 3) + Math.random() * 0.4;
      const childX = Math.round(selectedNode.x + Math.cos(angle) * linkDistance);
      const childY = Math.round(selectedNode.y + Math.sin(angle) * linkDistance);
      const childColor = selectedNode.color || DEFAULT_COLORS[childCount % DEFAULT_COLORS.length];

      // 1. Create note
      const { data: createdNote, error: noteErr } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: branchInput.trim(),
          content: "",
          color: childColor,
        })
        .select("id")
        .single();
      if (noteErr) throw noteErr;

      // 2. Create neural_node
      const { data: newChild, error: nodeErr } = await supabase
        .from("neural_nodes")
        .insert({
          user_id: user.id,
          label: branchInput.trim(),
          x: childX,
          y: childY,
          color: childColor,
          note_id: createdNote.id,
          is_team: isTeam,
        })
        .select()
        .single();
      if (nodeErr) throw nodeErr;

      // 3. Connect parent -> child
      const { error: edgeErr } = await supabase.from("neural_edges").insert({
        user_id: user.id,
        source: parentId,
        target: newChild.id,
        is_team: isTeam,
      });
      if (edgeErr) throw edgeErr;

      toast.success(`Nova nota "${branchInput.trim()}" criada e vinculada!`);
      setBranchInput("");
      await loadMap();
      setSelectedNodeId(newChild.id);
    } catch (err: any) {
      toast.error("Erro ao criar nó conectado: " + err.message);
    } finally {
      setBranchingLoading(false);
    }
  };

  // Open ANY node to view/edit title, description (content) & color
  const openNodeEditor = async (node: Node) => {
    if (!user) return;
    let title = node.label;
    let content = node.content || "";
    let color = node.color || DEFAULT_COLORS[0];

    if (node.note_id) {
      try {
        const { data } = await supabase
          .from("notes")
          .select("title, content, color")
          .eq("id", node.note_id)
          .single();
        if (data) {
          title = data.title || title;
          content = data.content || "";
          if (data.color?.startsWith("#")) color = data.color;
        }
      } catch {
        // Fallback to cached node values if another team member owns the note
      }
    }

    setActiveNoteNode({
      nodeId: node.id,
      noteId: node.note_id,
      title,
      content,
      color,
    });
    setNoteModalOpen(true);
  };

  const saveNodeNoteChanges = async () => {
    if (!activeNoteNode || !user || !activeNoteNode.title.trim()) return;
    setSavingNote(true);
    try {
      const targetNode = nodes.find((n) => n.id === activeNoteNode.nodeId);
      let noteId = activeNoteNode.noteId;

      if (noteId) {
        const { error } = await supabase
          .from("notes")
          .update({
            title: activeNoteNode.title.trim(),
            content: activeNoteNode.content,
            color: activeNoteNode.color,
            updated_at: new Date().toISOString(),
          })
          .eq("id", noteId);
        if (error) throw error;
      } else {
        // Upgrade older node without note_id into a full Note
        const { data: createdNote, error: createErr } = await supabase
          .from("notes")
          .insert({
            user_id: user.id,
            title: activeNoteNode.title.trim(),
            content: activeNoteNode.content,
            color: activeNoteNode.color,
          })
          .select("id")
          .single();
        if (createErr) throw createErr;
        noteId = createdNote.id;
      }

      if (targetNode && !targetNode.id.startsWith("untracked_note_")) {
        await supabase
          .from("neural_nodes")
          .update({
            label: activeNoteNode.title.trim(),
            color: activeNoteNode.color,
            note_id: noteId,
          })
          .eq("id", targetNode.id);
      }

      toast.success("Nota e descrição salvas!");
      setNoteModalOpen(false);
      await loadMap();
    } catch (err: any) {
      toast.error("Erro ao salvar descrição: " + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNode = async (node: Node) => {
    if (!confirm(`Deseja remover "${node.label}" e suas conexões?`)) return;
    try {
      if (node.note_id) {
        await supabase.from("notes").delete().eq("id", node.note_id);
      }
      if (!node.id.startsWith("untracked_note_")) {
        await supabase.from("neural_nodes").delete().eq("id", node.id);
      }
      toast.success("Nó removido do mapa!");
      setSelectedNodeId(null);
      loadMap();
    } catch (err: any) {
      toast.error("Erro ao excluir nó: " + err.message);
    }
  };

  // Derived data for rendering
  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    edges.forEach((e) => {
      map.set(e.source, (map.get(e.source) || 0) + 1);
      map.set(e.target, (map.get(e.target) || 0) + 1);
    });
    return map;
  }, [edges]);

  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (!showOrphans && (degreeMap.get(n.id) || 0) === 0) return false;
      return true;
    });
  }, [nodes, showOrphans, degreeMap]);

  const visibleNodeIdSet = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const activeFocusId = hoveredNodeId || selectedNodeId;
  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const set = new Set<string>([activeFocusId]);
    edges.forEach((e) => {
      if (e.source === activeFocusId) set.add(e.target);
      if (e.target === activeFocusId) set.add(e.source);
    });
    return set;
  }, [activeFocusId, edges]);

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

  const availableToLink = useMemo(() => {
    if (!selectedNodeId) return [];
    const connectedSet = new Set(neighborNodes.map((nb) => nb.node.id));
    return nodes.filter((n) => n.id !== selectedNodeId && !connectedSet.has(n.id));
  }, [selectedNodeId, neighborNodes, nodes]);

  const getNodeRadius = (nodeId: string) => {
    const degree = degreeMap.get(nodeId) || 0;
    const base = 5.5 + Math.min(degree, 10) * 1.15;
    return base * nodeScale;
  };

  const handleResetCamera = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedNodeId(null);
  };

  // Pulse physics reorganization
  const handleReorganizeGraph = () => {
    setPhysicsEnabled(true);
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
      }))
    );
    toast.info("Reorganizando grafo com forças orgânicas...");
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full min-h-[620px] w-full relative overflow-hidden text-foreground rounded-2xl border border-border shadow-xl select-none flex flex-col",
        isDark ? "bg-[#1e1e1e]" : "bg-background",
        draggingNode ? "cursor-grabbing" : isPanning ? "cursor-grabbing" : "cursor-grab"
      )}
      onPointerDown={(e) => handlePointerDown(e)}
      onDoubleClick={handleBackgroundDoubleClick}
    >
      {/* ─── PAINEL ESTILO OBSIDIAN (Canto Superior Esquerdo: Filtros, Tela, Forças) ─── */}
      <div
        className="absolute top-3 left-3 z-20 w-56 rounded-xl bg-card/90 backdrop-blur-md border border-border shadow-lg pointer-events-auto overflow-hidden text-xs"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
          <span className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5 text-accent" />
            Visualização em gráfico
          </span>
          <button
            onClick={() => setSettingsOpen(!settingsOpen)}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
            title={settingsOpen ? "Minimizar painel" : "Expandir painel"}
          >
            {settingsOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        </div>

        {settingsOpen && (
          <div className="p-2 space-y-1 max-h-[68vh] overflow-y-auto scrollbar-hide">
            {/* ▸ Filtros */}
            <div className="rounded-lg border border-border/50 bg-background/40">
              <button
                onClick={() => setOpenSections((s) => ({ ...s, filters: !s.filters }))}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-[11px] text-foreground hover:bg-muted/40 rounded-lg"
              >
                {openSections.filters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Filtros
              </button>
              {openSections.filters && (
                <div className="px-2.5 pb-2.5 pt-1 space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar nós..."
                      className="h-7 pl-7 pr-6 text-[11px] bg-background/80 border-border"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <label className="flex items-center justify-between text-[11px] text-muted-foreground cursor-pointer">
                    <span>Mostrar órfãos (isolados)</span>
                    <input
                      type="checkbox"
                      checked={showOrphans}
                      onChange={(e) => setShowOrphans(e.target.checked)}
                      className="accent-accent rounded"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* ▸ Tela */}
            <div className="rounded-lg border border-border/50 bg-background/40">
              <button
                onClick={() => setOpenSections((s) => ({ ...s, display: !s.display }))}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-[11px] text-foreground hover:bg-muted/40 rounded-lg"
              >
                {openSections.display ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Tela
              </button>
              {openSections.display && (
                <div className="px-2.5 pb-2.5 pt-1 space-y-2.5">
                  <label className="flex items-center justify-between text-[11px] text-muted-foreground cursor-pointer">
                    <span>Sempre mostrar nomes</span>
                    <input
                      type="checkbox"
                      checked={alwaysShowLabels}
                      onChange={(e) => setAlwaysShowLabels(e.target.checked)}
                      className="accent-accent rounded"
                    />
                  </label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Tamanho dos pontos</span>
                      <span>{nodeScale.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.0"
                      step="0.1"
                      value={nodeScale}
                      onChange={(e) => setNodeScale(parseFloat(e.target.value))}
                      className="w-full accent-accent h-1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Espessura das linhas</span>
                      <span>{lineWidth.toFixed(1)}px</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={lineWidth}
                      onChange={(e) => setLineWidth(parseFloat(e.target.value))}
                      className="w-full accent-accent h-1.5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ▸ Forças */}
            <div className="rounded-lg border border-border/50 bg-background/40">
              <button
                onClick={() => setOpenSections((s) => ({ ...s, forces: !s.forces }))}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-[11px] text-foreground hover:bg-muted/40 rounded-lg"
              >
                {openSections.forces ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                Forças
              </button>
              {openSections.forces && (
                <div className="px-2.5 pb-2.5 pt-1 space-y-2.5">
                  <label className="flex items-center justify-between text-[11px] text-muted-foreground cursor-pointer">
                    <span>Simulação física ativa</span>
                    <input
                      type="checkbox"
                      checked={physicsEnabled}
                      onChange={(e) => setPhysicsEnabled(e.target.checked)}
                      className="accent-accent rounded"
                    />
                  </label>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Força de repulsão</span>
                      <span>{repulsionForce}</span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="350"
                      step="10"
                      value={repulsionForce}
                      onChange={(e) => setRepulsionForce(parseInt(e.target.value, 10))}
                      className="w-full accent-accent h-1.5"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Distância do vínculo</span>
                      <span>{linkDistance}px</span>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="250"
                      step="10"
                      value={linkDistance}
                      onChange={(e) => setLinkDistance(parseInt(e.target.value, 10))}
                      className="w-full accent-accent h-1.5"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReorganizeGraph}
                    className="w-full h-7 text-[11px] gap-1.5 border-border"
                  >
                    <Magnet className="h-3 w-3 text-accent" /> Reorganizar Grafo
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── BARRA DE AÇÕES RÁPIDAS (Centro / Topo) ─── */}
      <div
        className="absolute top-3 left-64 z-20 flex flex-wrap items-center gap-2 pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          onClick={openNewSeparateNode}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm h-8 text-xs font-semibold gap-1.5 rounded-xl"
        >
          <Plus className="h-3.5 w-3.5" /> Nova Nota (Nó)
        </Button>

        <Button
          size="sm"
          variant={linkMode ? "default" : "outline"}
          onClick={() => setLinkMode(!linkMode)}
          className={cn(
            "h-8 text-xs font-semibold rounded-xl gap-1.5 transition-colors",
            linkMode
              ? "bg-accent text-accent-foreground border-accent shadow-sm"
              : "bg-card/90 backdrop-blur-md border-border hover:bg-card text-foreground"
          )}
        >
          {linkMode ? <Unlink className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
          {linkMode ? "Clique em 2 nós para vincular" : "Vincular Nós"}
        </Button>
      </div>

      {/* ─── CONTROLES DE ZOOM (Canto Inferior Direito) ─── */}
      <div
        className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border shadow-md pointer-events-auto"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setZoom((z) => Math.min(3, z * 1.15))}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          title="Aumentar Zoom"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] font-mono font-semibold px-1 text-muted-foreground min-w-[36px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setZoom((z) => Math.max(0.25, z * 0.85))}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          title="Diminuir Zoom"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <div className="w-[1px] h-4 bg-border mx-0.5" />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleResetCamera}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
          title="Centralizar Câmera"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ─── DICA RÁPIDA (Canto Inferior Esquerdo) ─── */}
      <div className="absolute bottom-4 left-3 z-20 pointer-events-none hidden sm:block">
        <div className="px-3 py-2 rounded-xl bg-card/85 backdrop-blur-md border border-border text-[10px] text-muted-foreground space-y-0.5 shadow-sm">
          <p>• <strong>Duplo clique no fundo</strong>: criar nota/nó separado</p>
          <p>• <strong>Duplo clique no ponto</strong>: abrir nota e editar descrição</p>
          <p>• <strong>Arrastar ponto</strong>: mover livremente</p>
        </div>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs text-muted-foreground">Carregando grafo de notas...</p>
          </div>
        </div>
      )}

      {/* ─── WORLD CANVAS LAYER (Centrado no meio da tela) ─── */}
      <div
        className="absolute left-1/2 top-1/2 w-0 h-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {/* SVG Edges Layer (Linhas retas limpas estilo Obsidian) */}
        <svg className="overflow-visible absolute top-0 left-0 w-1 h-1 pointer-events-none">
          {edges.map((edge) => {
            if (!visibleNodeIdSet.has(edge.source) || !visibleNodeIdSet.has(edge.target)) return null;
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            const isEdgeHighlighted =
              activeFocusId && (edge.source === activeFocusId || edge.target === activeFocusId);
            const isDimmed = activeFocusId && !isEdgeHighlighted;

            const defaultStroke = isDark
              ? "rgba(255, 255, 255, 0.22)"
              : "rgba(15, 23, 42, 0.20)";
            const highlightStroke = isDark ? "#38bdf8" : "#0284c7";

            return (
              <line
                key={edge.id}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={isEdgeHighlighted ? highlightStroke : defaultStroke}
                strokeWidth={isEdgeHighlighted ? Math.max(1.8, lineWidth * 1.5) : lineWidth}
                strokeOpacity={isDimmed ? 0.12 : isEdgeHighlighted ? 0.95 : 0.75}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Nodes Layer: Clean Obsidian Dots */}
        {visibleNodes.map((node) => {
          const radius = getNodeRadius(node.id);
          const diameter = radius * 2;
          const isSelected = selectedNodeId === node.id;
          const isHovered = hoveredNodeId === node.id;
          const isFocusedGroup = !activeFocusId || connectedNodeIds.has(node.id);
          const matchesSearch =
            !searchQuery || node.label.toLowerCase().includes(searchQuery.toLowerCase());

          const isDimmed = !matchesSearch || (activeFocusId && !isFocusedGroup);
          const showLabel =
            alwaysShowLabels || isSelected || isHovered || (activeFocusId && isFocusedGroup) || zoom >= 1.1;

          const dotColor = node.color?.startsWith("#") ? node.color : DEFAULT_COLORS[0];

          return (
            <div
              key={node.id}
              className={cn(
                "absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-grab active:cursor-grabbing",
                isDimmed ? "opacity-20" : "opacity-100"
              )}
              style={{
                left: node.x,
                top: node.y,
                zIndex: isSelected || isHovered ? 20 : 10,
              }}
              onPointerDown={(e) => handlePointerDown(e, node.id)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openNodeEditor(node);
              }}
            >
              {/* Clean Solid Obsidian Dot */}
              <div
                className={cn(
                  "rounded-full transition-transform duration-100",
                  isSelected || isHovered ? "scale-125" : "hover:scale-120"
                )}
                style={{
                  width: `${diameter}px`,
                  height: `${diameter}px`,
                  backgroundColor: isSelected || isHovered ? (isDark ? "#ffffff" : "#0f172a") : dotColor,
                  boxShadow:
                    isSelected || isHovered
                      ? `0 0 0 3px ${dotColor}55, 0 0 12px ${dotColor}80`
                      : undefined,
                }}
              />

              {/* Clean Minimal Label Below Dot (Obsidian Style) */}
              {showLabel && (
                <div
                  className={cn(
                    "absolute top-full mt-1 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap text-center leading-none",
                    isSelected || isHovered
                      ? "text-[11px] font-semibold text-foreground"
                      : "text-[10px] font-medium text-muted-foreground"
                  )}
                  style={{
                    textShadow: isDark
                      ? "0 1px 3px rgba(0,0,0,0.9)"
                      : "0 1px 2px rgba(255,255,255,0.95)",
                  }}
                >
                  {node.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── INSPETOR DA NOTA SELECIONADA (Canto Superior Direito) ─── */}
      {selectedNode && (
        <div
          className="absolute top-3 right-3 z-20 w-76 sm:w-84 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-4 pointer-events-auto flex flex-col gap-3 max-h-[calc(100%-70px)] overflow-y-auto scrollbar-hide"
          onPointerDown={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedNode.color }}
              />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-foreground truncate" title={selectedNode.label}>
                  {selectedNode.label}
                </h3>
                <span className="text-[10px] text-muted-foreground block">
                  {degreeMap.get(selectedNode.id) || 0} conexão(ões)
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Preview da Descrição + Botão Abrir Nota */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Descrição / Nota
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openNodeEditor(selectedNode)}
                className="h-7 text-[11px] gap-1 px-2 border-border hover:border-accent"
              >
                <Edit2 className="h-3 w-3 text-accent" />
                {selectedNode.content ? "Abrir / Editar" : "Adicionar Descrição"}
              </Button>
            </div>
            <div
              onClick={() => openNodeEditor(selectedNode)}
              className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground cursor-pointer hover:border-accent/50 transition-colors min-h-[56px] max-h-28 overflow-y-auto whitespace-pre-wrap"
            >
              {selectedNode.content?.trim()
                ? selectedNode.content
                : "Clique aqui ou dê duplo clique no ponto para adicionar descrições e detalhes a esta nota..."}
            </div>
          </div>

          {/* Criar Nova Nota Conectada a Este Nó */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleBranchIdea();
            }}
            className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 space-y-2"
          >
            <div className="flex items-center gap-1.5 text-accent font-semibold text-[11px]">
              <GitFork className="h-3.5 w-3.5" />
              <span>Criar Nova Nota Conectada</span>
            </div>
            <div className="flex gap-1.5">
              <Input
                value={branchInput}
                onChange={(e) => setBranchInput(e.target.value)}
                placeholder="Nome da nova nota..."
                className="h-7 text-xs bg-background/80 border-border flex-1"
                disabled={branchingLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!branchInput.trim() || branchingLoading}
                className="h-7 px-2.5 text-xs bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </form>

          {/* Vincular / Desvincular Nós */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                <Network className="h-3.5 w-3.5 text-accent" /> Vínculos ({neighborNodes.length})
              </span>
              <button
                onClick={() => setLinkMode(true)}
                className="text-[11px] text-accent hover:underline font-medium"
              >
                + Ligar no mapa
              </button>
            </div>

            {availableToLink.length > 0 && (
              <div className="flex gap-1.5">
                <select
                  value={linkTargetId}
                  onChange={(e) => setLinkTargetId(e.target.value)}
                  className="flex-1 h-7 rounded-lg border border-border bg-background px-2 text-[11px] text-foreground"
                >
                  <option value="">Selecionar nó para vincular...</option>
                  {availableToLink.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!linkTargetId}
                  onClick={() => {
                    if (linkTargetId) {
                      toggleEdge(selectedNode.id, linkTargetId);
                      setLinkTargetId("");
                    }
                  }}
                  className="h-7 px-2 text-[11px] border-border"
                >
                  Vincular
                </Button>
              </div>
            )}

            {neighborNodes.length > 0 && (
              <div className="space-y-1 max-h-28 overflow-y-auto pr-0.5">
                {neighborNodes.map(({ node }) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/40 hover:bg-muted border border-border/50 text-xs cursor-pointer group"
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: node.color }}
                      />
                      <span className="truncate text-[11px] font-medium text-foreground">
                        {node.label}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEdge(selectedNode.id, node.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                      title="Desvincular"
                    >
                      <Unlink className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => openNodeEditor(selectedNode)}
              className="h-8 text-xs gap-1.5 flex-1"
            >
              <FileText className="h-3.5 w-3.5" /> Abrir Nota Completa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteNode(selectedNode)}
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Excluir nó"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── MODAL: CRIAR NOVA NOTA (NÓ SEPARADO) ─── */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[460px] bg-card/95 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Nova Nota (Nó) no Mapa
            </DialogTitle>
            <DialogDescription className="text-xs">
              Crie um ponto no grafo com título e descrição. Depois você pode abri-lo ou vinculá-lo a outros nós.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Título da Nota / Nó</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Arquitetura do Projeto..."
                className="text-xs bg-background"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Descrição / Conteúdo</Label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Escreva a descrição, ideias e detalhes desta nota..."
                className="w-full min-h-[120px] p-3 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-accent resize-y"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Cor do Ponto</Label>
              <RichColorPicker value={newColor} onChange={setNewColor} compact />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleCreateNodeAndNote}
              disabled={!newTitle.trim() || creatingLoading}
              className="w-full bg-primary font-semibold"
            >
              {creatingLoading ? "Criando..." : "Criar Nota no Mapa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: ABRIR E EDITAR NOTA / DESCRIÇÃO COMPLETA ─── */}
      <Dialog open={isNoteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-xl border border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Nota & Descrição
            </DialogTitle>
          </DialogHeader>
          {activeNoteNode && (
            <div className="space-y-4 py-2 flex-1 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Título</Label>
                <Input
                  value={activeNoteNode.title}
                  onChange={(e) =>
                    setActiveNoteNode({ ...activeNoteNode, title: e.target.value })
                  }
                  className="text-sm font-semibold bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descrição / Anotações</Label>
                <textarea
                  value={activeNoteNode.content}
                  onChange={(e) =>
                    setActiveNoteNode({ ...activeNoteNode, content: e.target.value })
                  }
                  className="w-full min-h-[240px] p-3 text-xs leading-relaxed rounded-xl bg-background border border-border focus:outline-none focus:ring-1 focus:ring-accent resize-y"
                  placeholder="Adicione descrições, tópicos, referências e detalhes sobre esta ideia..."
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cor do Ponto</Label>
                <RichColorPicker
                  value={activeNoteNode.color}
                  onChange={(c) => setActiveNoteNode({ ...activeNoteNode, color: c })}
                  compact
                />
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0">
            <Button
              onClick={saveNodeNoteChanges}
              disabled={!activeNoteNode?.title.trim() || savingNote}
              className="w-full bg-primary font-semibold"
            >
              {savingNote ? "Salvando..." : "Salvar Nota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
