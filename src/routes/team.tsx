import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/team")({
  component: () => <AppShell><TeamPage /></AppShell>,
});

function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [p, t, r] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("tasks").select("assignee_id,status"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      if (p.data) setMembers(p.data);
      if (t.data) setTasks(t.data);
      if (r.data) setRoles(Object.fromEntries(r.data.map((x) => [x.user_id, x.role])));
    })();
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      <header>
        <p className="text-sm text-accent font-medium uppercase tracking-wider">Equipe</p>
        <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Membros da equipe</h1>
        <p className="text-muted-foreground mt-2">Veja quem está fazendo o quê.</p>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((m) => {
          const mine = tasks.filter((t) => t.assignee_id === m.id);
          const done = mine.filter((t) => t.status === "done").length;
          const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
          return (
            <Card key={m.id} className="p-5 shadow-card hover:shadow-elegant transition">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold text-lg">
                  {(m.full_name || "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold truncate">{m.full_name || "Sem nome"}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{roles[m.id] || "colaborador"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Conclusão</span>
                  <span className="font-bold">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-accent" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                  <span>{done} concluídas</span>
                  <span>{mine.length} totais</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
