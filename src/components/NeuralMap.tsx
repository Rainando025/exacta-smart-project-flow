import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit2, Link as LinkIcon, Unlink, FileText, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Node {
  id: string; // Can be a UUID from neural_nodes or note.id
  label: string;
  x: number;
  y: number;
  color: string;
  note_id: string | null;
  is_note: boolean;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

const COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-pink-500", "bg-amber-500", "bg-accent"
];

const HEX_COLORS: Record<string, string> = {
  "bg-blue-500": "#3b82f6",
  "bg-purple-500": "#a855f7",
  "bg-emerald-500": "#10b981",
  "bg-pink-500": "#ec4899",
  "bg-amber-500": "#f59e0b",
  "bg-accent": "#0ea5e9",
};

export function NeuralMap() {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // Pan state (Camera scroll)
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [pointerStart, setPointerStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Floating animation state
  const [time, setTime] = useState(0);

  // Dragging and selection
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isNodeModalOpen, setNodeModalOpen] = useState(false);
  const [editNode, setEditNode] = useState<Node | null>(null);
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeColor, setNodeColor] = useState(COLORS[0]);

  // Note Modal state (for editing note content directly from the map)
  const [isNoteModalOpen, setNoteModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState<{ id: string; title: string; content: string } | null>(null);

  // Animation Frame Loop
  useEffect(() => {
    let animId: number;
    const tick = () => {
      setTime((t) => t + 0.015);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Fetch all nodes, edges, and notes from Supabase
  const loadMap = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nodesRes, edgesRes, notesRes] = await Promise.all([
        supabase.from("neural_nodes").select("*").eq("user_id", user.id),
        supabase.from("neural_edges").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id),
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
            // Note node that has coordinate mapping in neural_nodes
            finalNodes.push({
              id: dn.id,
              label: note.title,
              x: dn.x,
              y: dn.y,
              color: note.color.startsWith("#") ? "bg-accent" : note.color || "bg-accent",
              note_id: note.id,
              is_note: true,
            });
            noteMap.delete(dn.note_id); // Removed from map to identify untracked notes
          }
        } else {
          // Plain brainstorming idea
          finalNodes.push({
            id: dn.id,
            label: dn.label,
            x: dn.x,
            y: dn.y,
            color: dn.color || "bg-accent",
            note_id: null,
            is_note: false,
          });
        }
      });

      // 2. Add remaining notes that don't have coordinates yet (automatically position them in grid)
      Array.from(noteMap.values()).forEach((note, index) => {
        const x = 200 + (index % 4) * 160;
        const y = 150 + Math.floor(index / 4) * 140;
        finalNodes.push({
          id: `untracked_note_${note.id}`, // Temporary ID until dragged/saved
          label: note.title,
          x,
          y,
          color: note.color.startsWith("#") ? "bg-accent" : note.color || "bg-accent",
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
  }, [user]);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  // Pointer Down on Node or Background
  const handlePointerDown = (e: React.PointerEvent, id?: string) => {
    if (id) {
      // Node Clicked
      e.stopPropagation();
      if (linkMode) {
        if (selectedNode && selectedNode !== id) {
          // Create or toggle edge
          toggleEdge(selectedNode, id);
        } else {
          setSelectedNode(id);
        }
      } else {
        setDraggingNode(id);
        setSelectedNode(id);
      }
    } else {
      // Background Clicked -> Start Pan Scroll
      if (linkMode) {
        setSelectedNode(null);
        setLinkMode(false);
        return;
      }
      setIsPanning(true);
      setPointerStart({ x: e.clientX, y: e.clientY });
      setPanStart(pan);
      setSelectedNode(null);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNode && containerRef.current) {
      // Move dragged node relative to zoom/pan offset
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - pan.x;
      const y = e.clientY - rect.top - pan.y;

      setNodes((prev) =>
        prev.map((n) => (n.id === draggingNode ? { ...n, x, y } : n))
      );
    } else if (isPanning) {
      // Pan container
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;
      setPan({ x: panStart.x + dx, y: panStart.y + dy });
    }
  };

  // Pointer Up -> Save coordinates to Supabase
  const handlePointerUp = async () => {
    if (draggingNode) {
      const node = nodes.find((n) => n.id === draggingNode);
      if (node && user) {
        try {
          if (node.id.startsWith("untracked_note_")) {
            // First time note coordinates are saved: Insert neural_nodes mapping row
            const { data, error } = await supabase
              .from("neural_nodes")
              .insert({
                user_id: user.id,
                label: node.label,
                x: node.x,
                y: node.y,
                color: node.color,
                note_id: node.note_id,
              })
              .select("id")
              .single();

            if (error) throw error;
            if (data) {
              // Update local state to use the newly created DB ID
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === draggingNode ? { ...n, id: data.id } : n
                )
              );
            }
          } else {
            // Update existing node coordinates
            const { error } = await supabase
              .from("neural_nodes")
              .update({ x: node.x, y: node.y })
              .eq("id", node.id);

            if (error) throw error;
          }
        } catch (err: any) {
          console.error("Error saving node position:", err.message);
        }
      }
      setDraggingNode(null);
    }
    setIsPanning(false);
  };

  // Create or Toggle Connection (Edge)
  const toggleEdge = async (sourceId: string, targetId: string) => {
    if (!user) return;
    
    // Check if untracked notes are involved (they must have database IDs first)
    if (sourceId.startsWith("untracked_note_") || targetId.startsWith("untracked_note_")) {
      toast.error("Arraste as notas uma vez para fixá-las no mapa antes de criar conexões!");
      return;
    }

    const exists = edges.find(
      (e) =>
        (e.source === sourceId && e.target === targetId) ||
        (e.source === targetId && e.target === sourceId)
    );

    try {
      if (exists) {
        // Delete Edge
        const { error } = await supabase.from("neural_edges").delete().eq("id", exists.id);
        if (error) throw error;
        setEdges((prev) => prev.filter((e) => e.id !== exists.id));
        toast.success("Conexão removida!");
      } else {
        // Insert Edge
        const { data, error } = await supabase
          .from("neural_edges")
          .insert({
            user_id: user.id,
            source: sourceId,
            target: targetId,
          })
          .select("id")
          .single();

        if (error) throw error;
        if (data) {
          setEdges((prev) => [
            ...prev,
            { id: data.id, source: sourceId, target: targetId },
          ]);
          toast.success("Nós conectados!");
        }
      }
    } catch (err: any) {
      toast.error("Erro ao alterar conexão: " + err.message);
    } finally {
      setSelectedNode(null);
      setLinkMode(false);
    }
  };

  // Node Floating Offset Calculation
  const getNodePos = (node: Node) => {
    if (draggingNode === node.id) {
      return { x: node.x, y: node.y };
    }
    // Phase based on string characters sum or id hash
    const phase = node.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) || 1;
    const dx = Math.sin(time + phase * 0.1) * 6;
    const dy = Math.cos(time + phase * 0.1) * 6;
    return {
      x: node.x + dx,
      y: node.y + dy,
    };
  };

  // Open Dialog for creating new brainstorming node
  const openNewNode = () => {
    setEditNode(null);
    setNodeLabel("");
    setNodeColor(COLORS[0]);
    setNodeModalOpen(true);
  };

  // Open Dialog for editing custom node label/color
  const openEditNode = (n: Node) => {
    setEditNode(n);
    setNodeLabel(n.label);
    setNodeColor(n.color);
    setNodeModalOpen(true);
  };

  // Save Node Details
  const saveNode = async () => {
    if (!user || !nodeLabel.trim()) return;

    try {
      if (editNode) {
        if (editNode.is_note) {
          // If it's a note node, update the note title in Notes table
          const { error } = await supabase
            .from("notes")
            .update({ title: nodeLabel.trim() })
            .eq("id", editNode.note_id || "");
          if (error) throw error;
        } else {
          // Otherwise update neural node label/color
          const { error } = await supabase
            .from("neural_nodes")
            .update({ label: nodeLabel.trim(), color: nodeColor })
            .eq("id", editNode.id);
          if (error) throw error;
        }
        toast.success("Nó atualizado!");
      } else {
        // Create brand new Brainstorm Idea Node
        const { data, error } = await supabase
          .from("neural_nodes")
          .insert({
            user_id: user.id,
            label: nodeLabel.trim(),
            x: 400 - pan.x, // spawn centered in current view
            y: 250 - pan.y,
            color: nodeColor,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          toast.success("Nova ideia criada no mapa!");
        }
      }
      setNodeModalOpen(false);
      loadMap();
    } catch (err: any) {
      toast.error("Erro ao salvar nó: " + err.message);
    }
  };

  // Delete Node (Cascades edges in DB)
  const deleteNode = async (node: Node) => {
    if (!confirm(`Deseja remover "${node.label}"?`)) return;

    try {
      if (node.is_note) {
        // Delete original note
        const { error } = await supabase.from("notes").delete().eq("id", node.note_id || "");
        if (error) throw error;
        toast.success("Anotação excluída!");
      } else {
        // Delete brainstorming idea node
        const { error } = await supabase.from("neural_nodes").delete().eq("id", node.id);
        if (error) throw error;
        toast.success("Ideia removida!");
      }
      setSelectedNode(null);
      loadMap();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  // Double Click Note Node -> Open Note Editor Modal
  const handleNodeDoubleClick = async (node: Node) => {
    if (!node.is_note || !node.note_id) return;
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

  return (
    <div 
      ref={containerRef}
      className="h-[550px] w-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950 via-background to-background rounded-2xl border border-white/10 shadow-elegant select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => handlePointerDown(e)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-15 pointer-events-none transition-transform duration-75" 
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1.5px, transparent 1.5px)`,
          backgroundSize: '40px 40px',
          transform: `translate(${pan.x}px, ${pan.y}px)`,
        }} 
      />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex gap-2 pointer-events-auto">
        <Button size="sm" onClick={openNewNode} className="bg-gradient-primary shadow-elegant h-8 text-xs font-semibold">
          <Plus className="mr-1 h-3.5 w-3.5" /> Nova Ideia
        </Button>
        <Button 
          size="sm" 
          variant={linkMode ? "default" : "outline"}
          onClick={() => { setLinkMode(!linkMode); setSelectedNode(null); }} 
          className={`h-8 text-xs font-semibold ${linkMode ? 'bg-accent text-accent-foreground shadow-glow' : 'bg-card/50 backdrop-blur-md border-white/5'}`}
        >
          {linkMode ? <Unlink className="mr-1 h-3.5 w-3.5" /> : <LinkIcon className="mr-1 h-3.5 w-3.5" />} 
          {linkMode ? "Cancelar Liga" : "Conectar Nós"}
        </Button>
      </div>

      {/* Legend & Instructions */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="p-3 rounded-xl bg-card/85 backdrop-blur-md border border-white/10 text-[10px] text-muted-foreground space-y-1 shadow-elegant">
          <p className="flex items-center gap-1.5"><FileText className="h-3 w-3 text-accent" /> Nós com ícone são suas **Anotações** (Abrem no Clique Duplo)</p>
          <p className="flex items-center gap-1.5"><StickyNote className="h-3 w-3 text-emerald-400" /> Arraste o fundo para rolar a tela infinitamente</p>
          <p className="flex items-center gap-1.5"><LinkIcon className="h-3 w-3" /> Clique em "Conectar Nós" para interligar ideias</p>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <p className="text-xs text-muted-foreground">Sincronizando ideias...</p>
          </div>
        </div>
      )}

      {/* Edges SVG */}
      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          
          const sPos = getNodePos(sourceNode);
          const tPos = getNodePos(targetNode);

          return (
            <line 
              key={edge.id}
              x1={sPos.x + pan.x} y1={sPos.y + pan.y} 
              x2={tPos.x + pan.x} y2={tPos.y + pan.y} 
              stroke="currentColor" 
              strokeWidth="2" 
              className="text-accent/30 dark:text-accent/20 animate-pulse transition-all duration-300" 
            />
          );
        })}
        
        {/* Preview line when linking */}
        {linkMode && selectedNode && nodes.find((n) => n.id === selectedNode) && (() => {
          const activeNodePos = getNodePos(nodes.find((n) => n.id === selectedNode)!);
          return (
            <circle 
              cx={activeNodePos.x + pan.x} 
              cy={activeNodePos.y + pan.y} 
              r={45} 
              className="stroke-accent fill-accent/5 animate-ping pointer-events-none" 
            />
          );
        })()}
      </svg>

      {/* Nodes */}
      {nodes.map((node) => {
        const renderPos = getNodePos(node);
        const nodeHexColor = HEX_COLORS[node.color] || node.color;
        
        return (
          <div 
            key={node.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group pointer-events-auto"
            style={{ 
              left: renderPos.x + pan.x, 
              top: renderPos.y + pan.y 
            }}
            onPointerDown={(e) => handlePointerDown(e, node.id)}
            onDoubleClick={() => handleNodeDoubleClick(node)}
          >
            <div className={`
              relative flex flex-col items-center justify-center text-center p-3 rounded-2xl min-w-[90px] min-h-[90px] max-w-[140px]
              backdrop-blur-xl border border-white/10 transition-transform duration-350 shadow-elegant
              ${selectedNode === node.id ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background' : 'hover:scale-105'}
            `}
            style={{
              backgroundColor: nodeHexColor ? `${nodeHexColor}18` : "rgba(255,255,255,0.05)",
              borderColor: nodeHexColor || "rgba(255,255,255,0.2)",
            }}>
              {node.is_note ? (
                <FileText className="h-4.5 w-4.5 mb-1.5 text-accent animate-pulse" />
              ) : (
                <StickyNote className="h-4.5 w-4.5 mb-1.5 text-muted-foreground" />
              )}
              
              <span className="font-bold text-[11px] leading-tight text-foreground select-none pointer-events-none break-words w-full">
                {node.label}
              </span>

              {/* Node Controls (Edit/Delete) */}
              {selectedNode === node.id && !linkMode && (
                <div className="absolute -top-10 flex gap-1 animate-in fade-in zoom-in duration-200 pointer-events-auto">
                  <button onClick={(e) => { e.stopPropagation(); openEditNode(node); }} className="p-1.5 rounded-lg bg-card border border-white/10 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors" title="Editar">
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteNode(node); }} className="p-1.5 rounded-lg bg-card border border-white/10 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors" title="Excluir">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Idea Creation/Edit Modal */}
      <Dialog open={isNodeModalOpen} onOpenChange={setNodeModalOpen}>
        <DialogContent className="sm:max-w-[350px] border border-white/10">
          <DialogHeader>
            <DialogTitle>{editNode ? "Editar Ideia" : "Nova Ideia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Texto da Ideia</Label>
              <Input value={nodeLabel} onChange={(e) => setNodeLabel(e.target.value)} placeholder="Ex: Pesquisar concorrentes..." />
            </div>
            {!editNode?.is_note && (
              <div className="space-y-2">
                <Label>Cor do Nó</Label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button 
                      key={c} onClick={() => setNodeColor(c)}
                      className={`h-6 w-6 rounded-full transition-transform ${nodeColor === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'} ${c}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveNode} className="w-full bg-gradient-primary">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Editor Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setNoteModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col border border-white/10">
          <DialogHeader>
            <DialogTitle>Editar Anotação</DialogTitle>
          </DialogHeader>
          {activeNote && (
            <div className="space-y-4 py-2 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={activeNote.title} onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <textarea 
                  value={activeNote.content} 
                  onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })} 
                  className="w-full min-h-[200px] p-3 text-sm rounded-lg bg-muted border border-white/10 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  placeholder="Escreva aqui..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0">
            <Button onClick={saveNoteContent} className="w-full bg-gradient-primary">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
