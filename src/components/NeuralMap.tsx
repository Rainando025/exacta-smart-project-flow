import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Edit2, Link as LinkIcon, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
}

const COLORS = [
  "bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-pink-500", "bg-amber-500", "bg-accent"
];

export function NeuralMap() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: "1", label: "Visão Q3", x: 400, y: 300, color: "bg-accent" },
    { id: "2", label: "Marketing", x: 200, y: 200, color: "bg-blue-500" },
    { id: "3", label: "Produto", x: 600, y: 150, color: "bg-purple-500" },
    { id: "4", label: "Vendas", x: 250, y: 450, color: "bg-emerald-500" },
  ]);
  const [edges, setEdges] = useState<Edge[]>([
    { id: "e1", source: "1", target: "2" },
    { id: "e2", source: "1", target: "3" },
    { id: "e3", source: "1", target: "4" },
  ]);

  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isNodeModalOpen, setNodeModalOpen] = useState(false);
  const [editNode, setEditNode] = useState<Node | null>(null);
  const [nodeLabel, setNodeLabel] = useState("");
  const [nodeColor, setNodeColor] = useState(COLORS[0]);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (linkMode) {
      if (selectedNode && selectedNode !== id) {
        // connect
        const exists = edges.find((ed) => (ed.source === selectedNode && ed.target === id) || (ed.source === id && ed.target === selectedNode));
        if (exists) {
          setEdges(edges.filter(ed => ed.id !== exists.id)); // toggle off
        } else {
          setEdges([...edges, { id: `e_${Date.now()}`, source: selectedNode, target: id }]);
        }
        setSelectedNode(null);
        setLinkMode(false);
      } else {
        setSelectedNode(id);
      }
    } else {
      setDraggingNode(id);
      setSelectedNode(id);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingNode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setNodes(nodes.map(n => n.id === draggingNode ? { ...n, x, y } : n));
  };

  const handlePointerUp = () => {
    setDraggingNode(null);
  };

  const openNewNode = () => {
    setEditNode(null);
    setNodeLabel("");
    setNodeColor(COLORS[0]);
    setNodeModalOpen(true);
  };

  const openEditNode = (n: Node) => {
    setEditNode(n);
    setNodeLabel(n.label);
    setNodeColor(n.color);
    setNodeModalOpen(true);
  };

  const saveNode = () => {
    if (!nodeLabel.trim()) return;
    if (editNode) {
      setNodes(nodes.map(n => n.id === editNode.id ? { ...n, label: nodeLabel, color: nodeColor } : n));
    } else {
      setNodes([...nodes, {
        id: `n_${Date.now()}`,
        label: nodeLabel,
        x: 400, y: 300,
        color: nodeColor
      }]);
    }
    setNodeModalOpen(false);
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
    setEdges(edges.filter(e => e.source !== id && e.target !== id));
    if (selectedNode === id) setSelectedNode(null);
  };

  return (
    <div 
      ref={containerRef}
      className="h-[500px] w-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-background to-background rounded-xl border border-white/10 shadow-elegant touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onClick={() => { if (!linkMode) setSelectedNode(null); }}
    >
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1px, transparent 1px)`,
        backgroundSize: '30px 30px'
      }} />

      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        <Button size="sm" onClick={openNewNode} className="bg-gradient-primary shadow-elegant h-8">
          <Plus className="mr-1 h-3.5 w-3.5" /> Nó
        </Button>
        <Button 
          size="sm" 
          variant={linkMode ? "default" : "outline"}
          onClick={() => { setLinkMode(!linkMode); setSelectedNode(null); }} 
          className={`h-8 ${linkMode ? 'bg-accent text-accent-foreground' : 'bg-card/50 backdrop-blur-md'}`}
        >
          {linkMode ? <Unlink className="mr-1 h-3.5 w-3.5" /> : <LinkIcon className="mr-1 h-3.5 w-3.5" />} 
          {linkMode ? "Cancelar Liga" : "Ligar Nós"}
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="p-2 rounded-lg bg-card/80 backdrop-blur-md border border-white/10 text-[10px] text-muted-foreground">
          <p>Arraste os nós livremente.</p>
          <p>Clique em "Ligar Nós" e selecione 2 para conectar.</p>
        </div>
      </div>

      {/* Edges SVG */}
      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        {edges.map(edge => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          return (
            <line 
              key={edge.id}
              x1={sourceNode.x} y1={sourceNode.y} 
              x2={targetNode.x} y2={targetNode.y} 
              stroke="currentColor" 
              strokeWidth="1.5" 
              className="text-muted-foreground/40 transition-all duration-300" 
            />
          );
        })}
        
        {/* Preview line when linking */}
        {linkMode && selectedNode && nodes.find(n => n.id === selectedNode) && (
           <circle cx={nodes.find(n => n.id === selectedNode)!.x} cy={nodes.find(n => n.id === selectedNode)!.y} r={40} className="stroke-accent fill-accent/10 animate-pulse pointer-events-none" />
        )}
      </svg>

      {/* Nodes */}
      {nodes.map(node => (
        <div 
          key={node.id}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group"
          style={{ left: node.x, top: node.y }}
          onPointerDown={(e) => handlePointerDown(e, node.id)}
        >
          <div className={`
            relative flex items-center justify-center text-center p-3 rounded-full min-w-[80px] min-h-[80px]
            backdrop-blur-md border border-white/20 transition-transform duration-200 shadow-xl
            ${node.color.replace('bg-', 'bg-').replace('500', '500/20')} 
            ${selectedNode === node.id ? 'scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background' : 'hover:scale-105'}
          `}>
             <span className={`font-bold text-xs ${node.color.replace('bg-', 'text-').replace('500', '400')}`}>
               {node.label}
             </span>

             {/* Node Controls (Edit/Delete) */}
             {selectedNode === node.id && !linkMode && (
               <div className="absolute -top-8 flex gap-1 animate-in fade-in zoom-in duration-200">
                 <button onClick={(e) => { e.stopPropagation(); openEditNode(node); }} className="p-1.5 rounded-full bg-card/90 border border-white/10 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors">
                   <Edit2 className="h-3 w-3" />
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} className="p-1.5 rounded-full bg-card/90 border border-white/10 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors">
                   <Trash2 className="h-3 w-3" />
                 </button>
               </div>
             )}
          </div>
        </div>
      ))}

      {/* Modal */}
      <Dialog open={isNodeModalOpen} onOpenChange={setNodeModalOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>{editNode ? "Editar Nó" : "Nova Ideia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Texto da Ideia</Label>
              <Input value={nodeLabel} onChange={e => setNodeLabel(e.target.value)} placeholder="Ex: Nova funcionalidade" />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button 
                    key={c} onClick={() => setNodeColor(c)}
                    className={`h-6 w-6 rounded-full transition-transform ${nodeColor === c ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'} ${c}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveNode} className="w-full bg-gradient-primary">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
