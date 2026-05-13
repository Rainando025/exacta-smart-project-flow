import { createFileRoute } from "@tanstack/react-router";
import { Presentation, Plus, Eraser, MousePointer2, Type, Square, Circle, Image as ImageIcon, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/whiteboards")({
  component: WhiteboardsPage,
});

function WhiteboardsPage() {
  const tools = [
    { icon: MousePointer2, label: "Selecionar" },
    { icon: Type, label: "Texto" },
    { icon: Square, label: "Retângulo" },
    { icon: Circle, label: "Círculo" },
    { icon: Eraser, label: "Borracha" },
    { icon: ImageIcon, label: "Imagem" },
  ];

  return (
    <div className="h-[calc(100vh-theme(spacing.16))] flex flex-col overflow-hidden animate-in fade-in duration-700">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
            <Presentation className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Quadro Branco: Planejamento de Produto</h1>
            <p className="text-xs text-muted-foreground">Última edição há 10 minutos por você</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-accent flex items-center justify-center text-[10px] font-bold">
                U{i}
              </div>
            ))}
            <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold">
              +2
            </div>
          </div>
          <Button variant="outline" size="sm"><Download className="mr-2 h-3.5 w-3.5" /> Exportar</Button>
          <Button size="sm" className="bg-gradient-primary shadow-elegant"><Share2 className="mr-2 h-3.5 w-3.5" /> Compartilhar</Button>
        </div>
      </header>

      <div className="relative flex-1 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px]">
        {/* Floating Toolbar */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant">
          {tools.map((t, i) => (
            <Button key={i} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent transition-all" title={t.label}>
              <t.icon className="h-5 w-5" />
            </Button>
          ))}
          <div className="h-px bg-white/10 my-1" />
          <div className="h-8 w-8 rounded-full bg-accent cursor-pointer hover:scale-110 transition-transform m-1" />
          <div className="h-8 w-8 rounded-full bg-blue-500 cursor-pointer hover:scale-110 transition-transform m-1" />
          <div className="h-8 w-8 rounded-full bg-red-500 cursor-pointer hover:scale-110 transition-transform m-1" />
        </div>

        {/* Mock Content */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 select-none">
          <div className="text-center">
            <Presentation className="h-24 w-24 mx-auto mb-4 text-muted-foreground/20" />
            <h2 className="text-2xl font-display font-bold text-muted-foreground/30">Área de Desenho Infinita</h2>
            <p className="text-muted-foreground/20">Arraste ferramentas para começar o brainstorming visual</p>
          </div>
        </div>

        {/* Floating Controls */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 p-1.5 rounded-xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant">
          <Button variant="ghost" size="sm" className="h-8 px-2 font-mono text-xs">100%</Button>
          <div className="h-4 w-px bg-white/10" />
          <Button variant="ghost" size="icon" className="h-8 w-8">-</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">+</Button>
        </div>
      </div>
    </div>
  );
}
