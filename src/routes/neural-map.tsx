import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { NeuralMap } from "@/components/NeuralMap";
import { Network } from "lucide-react";

export const Route = createFileRoute("/neural-map")({
  component: () => (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <header className="p-4 border-b border-white/5 bg-card/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-accent font-bold uppercase tracking-widest font-display">Visualização Estratégica</p>
              <h1 className="font-display text-xl font-bold flex items-center gap-2">
                <Network className="h-5 w-5 text-accent" /> Mapa Neural da Equipe
              </h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          <NeuralMap isTeam={true} />
        </div>
      </div>
    </AppShell>
  ),
});
