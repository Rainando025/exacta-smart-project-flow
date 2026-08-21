import { a8 as createLucideIcon, ak as useAuth, ai as supabase, aj as toast, b as Button, D as Dialog, o as DialogContent, r as DialogHeader, s as DialogTitle, L as Label$1, q as DialogFooter } from "./router-Bktayy9l.mjs";
import { S as reactExports, I as jsxRuntimeExports } from "./index.mjs";
import { I as Input } from "./input-nTKCBTY6.mjs";
import { P as Plus, F as FileText, i as StickyNote, j as Trash2 } from "./AppShell-OCwEkoGu.mjs";
import { P as Pen } from "./pen-DrucmGnU.mjs";
const __iconNode$2 = [
  ["path", { d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", key: "1cjeqo" }],
  ["path", { d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71", key: "19qd67" }]
];
const Link = createLucideIcon("link", __iconNode$2);
const __iconNode$1 = [
  ["rect", { x: "16", y: "16", width: "6", height: "6", rx: "1", key: "4q2zg0" }],
  ["rect", { x: "2", y: "16", width: "6", height: "6", rx: "1", key: "8cvhb9" }],
  ["rect", { x: "9", y: "2", width: "6", height: "6", rx: "1", key: "1egb70" }],
  ["path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", key: "1jsf9p" }],
  ["path", { d: "M12 12V8", key: "2874zd" }]
];
const Network = createLucideIcon("network", __iconNode$1);
const __iconNode = [
  [
    "path",
    {
      d: "m18.84 12.25 1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71",
      key: "yqzxt4"
    }
  ],
  [
    "path",
    {
      d: "m5.17 11.75-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71",
      key: "4qinb0"
    }
  ],
  ["line", { x1: "8", x2: "8", y1: "2", y2: "5", key: "1041cp" }],
  ["line", { x1: "2", x2: "5", y1: "8", y2: "8", key: "14m1p5" }],
  ["line", { x1: "16", x2: "16", y1: "19", y2: "22", key: "rzdirn" }],
  ["line", { x1: "19", x2: "22", y1: "16", y2: "16", key: "ox905f" }]
];
const Unlink = createLucideIcon("unlink", __iconNode);
const COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-amber-500",
  "bg-accent"
];
const HEX_COLORS = {
  "bg-blue-500": "#3b82f6",
  "bg-purple-500": "#a855f7",
  "bg-emerald-500": "#10b981",
  "bg-pink-500": "#ec4899",
  "bg-amber-500": "#f59e0b",
  "bg-accent": "#0ea5e9"
};
function NeuralMap() {
  const { user } = useAuth();
  const [nodes, setNodes] = reactExports.useState([]);
  const [edges, setEdges] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [pan, setPan] = reactExports.useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = reactExports.useState(false);
  const [pointerStart, setPointerStart] = reactExports.useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = reactExports.useState({ x: 0, y: 0 });
  const [time, setTime] = reactExports.useState(0);
  const [draggingNode, setDraggingNode] = reactExports.useState(null);
  const [selectedNode, setSelectedNode] = reactExports.useState(null);
  const [linkMode, setLinkMode] = reactExports.useState(false);
  const containerRef = reactExports.useRef(null);
  const [isNodeModalOpen, setNodeModalOpen] = reactExports.useState(false);
  const [editNode, setEditNode] = reactExports.useState(null);
  const [nodeLabel, setNodeLabel] = reactExports.useState("");
  const [nodeColor, setNodeColor] = reactExports.useState(COLORS[0]);
  const [isNoteModalOpen, setNoteModalOpen] = reactExports.useState(false);
  const [activeNote, setActiveNote] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let animId;
    const tick = () => {
      setTime((t) => t + 0.015);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);
  const loadMap = reactExports.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [nodesRes, edgesRes, notesRes] = await Promise.all([
        supabase.from("neural_nodes").select("*").eq("user_id", user.id),
        supabase.from("neural_edges").select("*").eq("user_id", user.id),
        supabase.from("notes").select("*").eq("user_id", user.id)
      ]);
      if (nodesRes.error) throw nodesRes.error;
      if (edgesRes.error) throw edgesRes.error;
      if (notesRes.error) throw notesRes.error;
      const dbNodes = nodesRes.data || [];
      const dbEdges = edgesRes.data || [];
      const dbNotes = notesRes.data || [];
      const finalNodes = [];
      const noteMap = new Map(dbNotes.map((n) => [n.id, n]));
      dbNodes.forEach((dn) => {
        if (dn.note_id) {
          const note = noteMap.get(dn.note_id);
          if (note) {
            finalNodes.push({
              id: dn.id,
              label: note.title,
              x: dn.x,
              y: dn.y,
              color: note.color.startsWith("#") ? "bg-accent" : note.color || "bg-accent",
              note_id: note.id,
              is_note: true
            });
            noteMap.delete(dn.note_id);
          }
        } else {
          finalNodes.push({
            id: dn.id,
            label: dn.label,
            x: dn.x,
            y: dn.y,
            color: dn.color || "bg-accent",
            note_id: null,
            is_note: false
          });
        }
      });
      Array.from(noteMap.values()).forEach((note, index) => {
        const x = 200 + index % 4 * 160;
        const y = 150 + Math.floor(index / 4) * 140;
        finalNodes.push({
          id: `untracked_note_${note.id}`,
          // Temporary ID until dragged/saved
          label: note.title,
          x,
          y,
          color: note.color.startsWith("#") ? "bg-accent" : note.color || "bg-accent",
          note_id: note.id,
          is_note: true
        });
      });
      setNodes(finalNodes);
      setEdges(
        dbEdges.map((de) => ({
          id: de.id,
          source: de.source,
          target: de.target
        }))
      );
    } catch (err) {
      toast.error("Erro ao carregar mapa neural: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);
  reactExports.useEffect(() => {
    loadMap();
  }, [loadMap]);
  const handlePointerDown = (e, id) => {
    if (id) {
      e.stopPropagation();
      if (linkMode) {
        if (selectedNode && selectedNode !== id) {
          toggleEdge(selectedNode, id);
        } else {
          setSelectedNode(id);
        }
      } else {
        setDraggingNode(id);
        setSelectedNode(id);
      }
    } else {
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
  const handlePointerMove = (e) => {
    if (draggingNode && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - pan.x;
      const y = e.clientY - rect.top - pan.y;
      setNodes(
        (prev) => prev.map((n) => n.id === draggingNode ? { ...n, x, y } : n)
      );
    } else if (isPanning) {
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;
      setPan({ x: panStart.x + dx, y: panStart.y + dy });
    }
  };
  const handlePointerUp = async () => {
    if (draggingNode) {
      const node = nodes.find((n) => n.id === draggingNode);
      if (node && user) {
        try {
          if (node.id.startsWith("untracked_note_")) {
            const { data, error } = await supabase.from("neural_nodes").insert({
              user_id: user.id,
              label: node.label,
              x: node.x,
              y: node.y,
              color: node.color,
              note_id: node.note_id
            }).select("id").single();
            if (error) throw error;
            if (data) {
              setNodes(
                (prev) => prev.map(
                  (n) => n.id === draggingNode ? { ...n, id: data.id } : n
                )
              );
            }
          } else {
            const { error } = await supabase.from("neural_nodes").update({ x: node.x, y: node.y }).eq("id", node.id);
            if (error) throw error;
          }
        } catch (err) {
          console.error("Error saving node position:", err.message);
        }
      }
      setDraggingNode(null);
    }
    setIsPanning(false);
  };
  const toggleEdge = async (sourceId, targetId) => {
    if (!user) return;
    if (sourceId.startsWith("untracked_note_") || targetId.startsWith("untracked_note_")) {
      toast.error("Arraste as notas uma vez para fixá-las no mapa antes de criar conexões!");
      return;
    }
    const exists = edges.find(
      (e) => e.source === sourceId && e.target === targetId || e.source === targetId && e.target === sourceId
    );
    try {
      if (exists) {
        const { error } = await supabase.from("neural_edges").delete().eq("id", exists.id);
        if (error) throw error;
        setEdges((prev) => prev.filter((e) => e.id !== exists.id));
        toast.success("Conexão removida!");
      } else {
        const { data, error } = await supabase.from("neural_edges").insert({
          user_id: user.id,
          source: sourceId,
          target: targetId
        }).select("id").single();
        if (error) throw error;
        if (data) {
          setEdges((prev) => [
            ...prev,
            { id: data.id, source: sourceId, target: targetId }
          ]);
          toast.success("Nós conectados!");
        }
      }
    } catch (err) {
      toast.error("Erro ao alterar conexão: " + err.message);
    } finally {
      setSelectedNode(null);
      setLinkMode(false);
    }
  };
  const getNodePos = (node) => {
    if (draggingNode === node.id) {
      return { x: node.x, y: node.y };
    }
    const phase = node.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) || 1;
    const dx = Math.sin(time + phase * 0.1) * 6;
    const dy = Math.cos(time + phase * 0.1) * 6;
    return {
      x: node.x + dx,
      y: node.y + dy
    };
  };
  const openNewNode = () => {
    setEditNode(null);
    setNodeLabel("");
    setNodeColor(COLORS[0]);
    setNodeModalOpen(true);
  };
  const openEditNode = (n) => {
    setEditNode(n);
    setNodeLabel(n.label);
    setNodeColor(n.color);
    setNodeModalOpen(true);
  };
  const saveNode = async () => {
    if (!user || !nodeLabel.trim()) return;
    try {
      if (editNode) {
        if (editNode.is_note) {
          const { error } = await supabase.from("notes").update({ title: nodeLabel.trim() }).eq("id", editNode.note_id || "");
          if (error) throw error;
        } else {
          const { error } = await supabase.from("neural_nodes").update({ label: nodeLabel.trim(), color: nodeColor }).eq("id", editNode.id);
          if (error) throw error;
        }
        toast.success("Nó atualizado!");
      } else {
        const { data, error } = await supabase.from("neural_nodes").insert({
          user_id: user.id,
          label: nodeLabel.trim(),
          x: 400 - pan.x,
          // spawn centered in current view
          y: 250 - pan.y,
          color: nodeColor
        }).select().single();
        if (error) throw error;
        if (data) {
          toast.success("Nova ideia criada no mapa!");
        }
      }
      setNodeModalOpen(false);
      loadMap();
    } catch (err) {
      toast.error("Erro ao salvar nó: " + err.message);
    }
  };
  const deleteNode = async (node) => {
    if (!confirm(`Deseja remover "${node.label}"?`)) return;
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
      setSelectedNode(null);
      loadMap();
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };
  const handleNodeDoubleClick = async (node) => {
    if (!node.is_note || !node.note_id) return;
    try {
      const { data, error } = await supabase.from("notes").select("*").eq("id", node.note_id).single();
      if (error) throw error;
      if (data) {
        setActiveNote({
          id: data.id,
          title: data.title,
          content: data.content || ""
        });
        setNoteModalOpen(true);
      }
    } catch (err) {
      toast.error("Erro ao carregar anotação: " + err.message);
    }
  };
  const saveNoteContent = async () => {
    if (!activeNote) return;
    try {
      const { error } = await supabase.from("notes").update({
        title: activeNote.title.trim(),
        content: activeNote.content,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", activeNote.id);
      if (error) throw error;
      toast.success("Anotação salva!");
      setNoteModalOpen(false);
      loadMap();
    } catch (err) {
      toast.error("Erro ao salvar anotação: " + err.message);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: containerRef,
      className: "h-[550px] w-full relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-950 via-background to-background rounded-2xl border border-white/10 shadow-elegant select-none cursor-grab active:cursor-grabbing",
      onPointerDown: (e) => handlePointerDown(e),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerUp,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-0 z-0 opacity-15 pointer-events-none transition-transform duration-75",
            style: {
              backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.15) 1.5px, transparent 1.5px)`,
              backgroundSize: "40px 40px",
              transform: `translate(${pan.x}px, ${pan.y}px)`
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-4 left-4 z-20 flex gap-2 pointer-events-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: openNewNode, className: "bg-gradient-primary shadow-elegant h-8 text-xs font-semibold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1 h-3.5 w-3.5" }),
            " Nova Ideia"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              variant: linkMode ? "default" : "outline",
              onClick: () => {
                setLinkMode(!linkMode);
                setSelectedNode(null);
              },
              className: `h-8 text-xs font-semibold ${linkMode ? "bg-accent text-accent-foreground shadow-glow" : "bg-card/50 backdrop-blur-md border-white/5"}`,
              children: [
                linkMode ? /* @__PURE__ */ jsxRuntimeExports.jsx(Unlink, { className: "mr-1 h-3.5 w-3.5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "mr-1 h-3.5 w-3.5" }),
                linkMode ? "Cancelar Liga" : "Conectar Nós"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-4 left-4 z-20 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-card/85 backdrop-blur-md border border-white/10 text-[10px] text-muted-foreground space-y-1 shadow-elegant", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-3 w-3 text-accent" }),
            " Nós com ícone são suas **Anotações** (Abrem no Clique Duplo)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { className: "h-3 w-3 text-emerald-400" }),
            " Arraste o fundo para rolar a tela infinitamente"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { className: "h-3 w-3" }),
            ' Clique em "Conectar Nós" para interligar ideias'
          ] })
        ] }) }),
        loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 z-30 flex items-center justify-center bg-background/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Sincronizando ideias..." })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "absolute inset-0 w-full h-full z-0 pointer-events-none", children: [
          edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;
            const sPos = getNodePos(sourceNode);
            const tPos = getNodePos(targetNode);
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "line",
              {
                x1: sPos.x + pan.x,
                y1: sPos.y + pan.y,
                x2: tPos.x + pan.x,
                y2: tPos.y + pan.y,
                stroke: "currentColor",
                strokeWidth: "2",
                className: "text-accent/30 dark:text-accent/20 animate-pulse transition-all duration-300"
              },
              edge.id
            );
          }),
          linkMode && selectedNode && nodes.find((n) => n.id === selectedNode) && (() => {
            const activeNodePos = getNodePos(nodes.find((n) => n.id === selectedNode));
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "circle",
              {
                cx: activeNodePos.x + pan.x,
                cy: activeNodePos.y + pan.y,
                r: 45,
                className: "stroke-accent fill-accent/5 animate-ping pointer-events-none"
              }
            );
          })()
        ] }),
        nodes.map((node) => {
          const renderPos = getNodePos(node);
          const nodeHexColor = HEX_COLORS[node.color] || node.color;
          return /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group pointer-events-auto",
              style: {
                left: renderPos.x + pan.x,
                top: renderPos.y + pan.y
              },
              onPointerDown: (e) => handlePointerDown(e, node.id),
              onDoubleClick: () => handleNodeDoubleClick(node),
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "div",
                {
                  className: `
              relative flex flex-col items-center justify-center text-center p-3 rounded-2xl min-w-[90px] min-h-[90px] max-w-[140px]
              backdrop-blur-xl border border-white/10 transition-transform duration-350 shadow-elegant
              ${selectedNode === node.id ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-background" : "hover:scale-105"}
            `,
                  style: {
                    backgroundColor: nodeHexColor ? `${nodeHexColor}18` : "rgba(255,255,255,0.05)",
                    borderColor: nodeHexColor || "rgba(255,255,255,0.2)"
                  },
                  children: [
                    node.is_note ? /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4.5 w-4.5 mb-1.5 text-accent animate-pulse" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(StickyNote, { className: "h-4.5 w-4.5 mb-1.5 text-muted-foreground" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-[11px] leading-tight text-foreground select-none pointer-events-none break-words w-full", children: node.label }),
                    selectedNode === node.id && !linkMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute -top-10 flex gap-1 animate-in fade-in zoom-in duration-200 pointer-events-auto", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => {
                        e.stopPropagation();
                        openEditNode(node);
                      }, className: "p-1.5 rounded-lg bg-card border border-white/10 hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors", title: "Editar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { className: "h-3 w-3" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (e) => {
                        e.stopPropagation();
                        deleteNode(node);
                      }, className: "p-1.5 rounded-lg bg-card border border-white/10 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition-colors", title: "Excluir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3 w-3" }) })
                    ] })
                  ]
                }
              )
            },
            node.id
          );
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isNodeModalOpen, onOpenChange: setNodeModalOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[350px] border border-white/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editNode ? "Editar Ideia" : "Nova Ideia" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Texto da Ideia" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: nodeLabel, onChange: (e) => setNodeLabel(e.target.value), placeholder: "Ex: Pesquisar concorrentes..." })
            ] }),
            !editNode?.is_note && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Cor do Nó" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: COLORS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setNodeColor(c),
                  className: `h-6 w-6 rounded-full transition-transform ${nodeColor === c ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"} ${c}`
                },
                c
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveNode, className: "w-full bg-gradient-primary", children: "Salvar" }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: isNoteModalOpen, onOpenChange: setNoteModalOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-[500px] max-h-[80vh] flex flex-col border border-white/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Editar Anotação" }) }),
          activeNote && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-2 flex-1 overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Título" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: activeNote.title, onChange: (e) => setActiveNote({ ...activeNote, title: e.target.value }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label$1, { children: "Conteúdo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  value: activeNote.content,
                  onChange: (e) => setActiveNote({ ...activeNote, content: e.target.value }),
                  className: "w-full min-h-[200px] p-3 text-sm rounded-lg bg-muted border border-white/10 focus:outline-none focus:ring-1 focus:ring-accent resize-none",
                  placeholder: "Escreva aqui..."
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { className: "shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: saveNoteContent, className: "w-full bg-gradient-primary", children: "Salvar Alterações" }) })
        ] }) })
      ]
    }
  );
}
export {
  Network as N,
  NeuralMap as a
};
