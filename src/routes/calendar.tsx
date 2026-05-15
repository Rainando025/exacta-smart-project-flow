import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CalendarScheduler } from "@/components/CalendarScheduler";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <header className="p-4 border-b border-white/5 bg-card/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-accent font-bold uppercase tracking-widest">Planejamento Estratégico</p>
              <h1 className="font-display text-xl font-bold">Calendário Inteligente</h1>
            </div>
            <div className="flex gap-2">
               {/* Opções extras se necessário */}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <CalendarScheduler isTeam={true} />
        </div>
      </div>
    </AppShell>
  );
}
