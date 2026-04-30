import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Trello,
  CalendarRange,
  Megaphone,
  Users,
  LogOut,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsBell } from "@/components/NotificationsBell";
import logo from "@/assets/exacta-logo.png";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/kanban", label: "Kanban", icon: Trello },
  { to: "/gantt", label: "Cronograma", icon: CalendarRange },
  { to: "/announcements", label: "Mural", icon: Megaphone },
  { to: "/team", label: "Equipe", icon: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted-foreground">Carregando EXACTA…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <img src={logo} alt="EXACTA" className="h-10 w-10 rounded-lg object-contain bg-white/5 p-1" />
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">EXACTA</h1>
            <p className="text-[10px] uppercase tracking-widest text-accent">Precisão em gestão</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to || location.pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3 space-y-1">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-accent font-bold text-accent-foreground text-xs">
              {(profile?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{profile?.full_name || user.email}</p>
              <p className="truncate text-[10px] text-sidebar-foreground/60">{profile?.job_title || "Colaborador"}</p>
            </div>
            <NotificationsBell />
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="EXACTA" className="h-8 w-8 rounded object-contain bg-white/5 p-0.5" />
            <span className="font-display font-bold">EXACTA</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <button onClick={signOut} aria-label="Sair" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent/50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex gap-1 overflow-x-auto bg-sidebar/95 px-2 py-2 text-sidebar-foreground border-t border-sidebar-border">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] whitespace-nowrap",
                active ? "bg-sidebar-accent text-accent" : "text-sidebar-foreground/70"
              )}>
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
