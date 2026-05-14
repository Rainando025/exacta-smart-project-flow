import { createFileRoute } from "@tanstack/react-router";
import { Presentation, Plus, Eraser, MousePointer2, Type, Square, Circle, Image as ImageIcon, Download, Share2, Diamond, Database, Hexagon, GitCommit, Network, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/whiteboards")({
  component: () => <AppShell><WhiteboardsPage /></AppShell>,
});

function WhiteboardsPage() {
  const tools = [
    { icon: MousePointer2, label: "Selecionar" },
    { icon: Type, label: "Texto" },
    { icon: Eraser, label: "Borracha" },
    { icon: ImageIcon, label: "Imagem" },
  ];

  const flowchartTools = [
    { icon: Square, label: "Processo (Retângulo)" },
    { icon: Diamond, label: "Decisão (Losango)" },
    { icon: Circle, label: "Início/Fim (Círculo)" },
    { icon: Database, label: "Banco de Dados" },
    { icon: Hexagon, label: "Preparação (Hexágono)" },
    { icon: MoveRight, label: "Seta de Fluxo" },
  ];

  const mindMapTools = [
    { icon: Network, label: "Nó Central" },
    { icon: GitCommit, label: "Sub-tópico" },
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
        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-elegant max-h-[80vh] overflow-y-auto custom-scrollbar">
          <Tabs defaultValue="geral" className="w-12">
            <TabsList className="flex flex-col h-auto w-10 bg-transparent gap-2 p-0">
              <TabsTrigger value="geral" className="w-10 h-10 p-0 rounded-xl data-[state=active]:bg-accent/20 data-[state=active]:text-accent" title="Geral"><MousePointer2 className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="fluxo" className="w-10 h-10 p-0 rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-primary" title="Fluxograma"><Diamond className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="mapa" className="w-10 h-10 p-0 rounded-xl data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary" title="Mapa Mental"><Network className="h-4 w-4" /></TabsTrigger>
            </TabsList>
            
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 items-center">
              <TabsContent value="geral" className="mt-0 flex flex-col gap-2 w-full">
                {tools.map((t, i) => (
                  <Button key={i} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent transition-all" title={t.label}>
                    <t.icon className="h-4 w-4" />
                  </Button>
                ))}
              </TabsContent>
              <TabsContent value="fluxo" className="mt-0 flex flex-col gap-2 w-full">
                {flowchartTools.map((t, i) => (
                  <Button key={i} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/20 hover:text-primary transition-all" title={t.label}>
                    <t.icon className="h-4 w-4" />
                  </Button>
                ))}
              </TabsContent>
              <TabsContent value="mapa" className="mt-0 flex flex-col gap-2 w-full">
                {mindMapTools.map((t, i) => (
                  <Button key={i} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-secondary/20 hover:text-secondary transition-all" title={t.label}>
                    <t.icon className="h-4 w-4" />
                  </Button>
                ))}
              </TabsContent>
            </div>
          </Tabs>

          <div className="h-px bg-white/10 my-1 w-8 mx-auto" />
          <div className="flex flex-col items-center gap-2 mt-1">
            <div className="h-6 w-6 rounded-full bg-accent cursor-pointer hover:scale-110 transition-transform shadow-glow" />
            <div className="h-6 w-6 rounded-full bg-blue-500 cursor-pointer hover:scale-110 transition-transform shadow-glow-blue" />
            <div className="h-6 w-6 rounded-full bg-red-500 cursor-pointer hover:scale-110 transition-transform shadow-glow-red" />
          </div>
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
