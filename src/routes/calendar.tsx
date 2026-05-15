import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CalendarScheduler } from "@/components/CalendarScheduler";

export const Route = createFileRoute("/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  return (
    <AppShell>
      <div className="p-6 lg:p-10 h-full max-w-[1400px] mx-auto">
        <header className="mb-8">
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Planejamento</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Calendário e Agendamentos</h1>
          <p className="text-muted-foreground mt-2">Gerencie seus compromissos e receba alertas inteligentes.</p>
        </header>

        <div className="bg-card rounded-2xl border border-white/10 shadow-card p-6 h-[calc(100vh-250px)] min-h-[600px]">
          <CalendarScheduler isTeam={true} />
        </div>
      </div>
    </AppShell>
  );
}
