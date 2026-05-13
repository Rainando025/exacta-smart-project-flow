import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Trello, CalendarRange,
  Megaphone, Users, LogOut, Bell, MessageSquareHeart, Wallet,
  StickyNote, FolderOpen, Building2, UserCircle, ChevronDown, BellRing, Settings,
  Moon, Sun, Command, Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationsBell } from "@/components/NotificationsBell";
const logo = "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/gen_3CpSPBsmWgKcVvejbF3BGqkl98C%20(2).png";
import { cn } from "@/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const PERSONAL_NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/notes", label: "Anotações", icon: StickyNote },
  { to: "/finances", label: "Finanças", icon: Wallet },
  { to: "/projects", label: "Projetos", icon: FolderOpen },
  { to: "/reminders", label: "Lembretes", icon: BellRing },
  { to: "/notifications", label: "Avisos", icon: Bell },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

const TEAM_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tarefas", icon: CheckSquare },
  { to: "/projects", label: "Projetos", icon: FolderKanban },
  { to: "/okrs", label: "Metas e OKRs", icon: Target },
  { to: "/kanban", label: "Kanban", icon: Trello },
  { to: "/gantt", label: "Cronograma", icon: CalendarRange },
  { to: "/announcements", label: "Mural", icon: Megaphone },
  { to: "/team", label: "Equipe", icon: Users },
  { to: "/feedback", label: "Feedback 360°", icon: MessageSquareHeart },
  { to: "/notifications", label: "Avisos", icon: Bell },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

type AppMode = "personal" | "team";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AppMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("exacta-mode") as AppMode) || "team";
    }
    return "team";
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    localStorage.setItem("exacta-mode", mode);
  }, [mode]);

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

  const NAV = mode === "personal" ? PERSONAL_NAV : TEAM_NAV;

  const modeLabel = mode === "personal" ? "Pessoal" : "Equipe";
  const ModeIcon = mode === "personal" ? UserCircle : Building2;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <img src={logo} alt="EXACTA" className="h-16 w-16 rounded-lg object-contain" />
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight">EXACTA</h1>
            <p className="text-[10px] uppercase tracking-widest text-accent">Precisão em gestão</p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setMode(mode === "personal" ? "team" : "personal")}
            className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent/60 px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent"
          >
            <div className="flex items-center gap-2">
              <ModeIcon className="h-4 w-4 text-accent" />
              <span>Modo {modeLabel}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
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
          <button
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Modo {theme === "light" ? "Escuro" : "Claro"}
          </button>
          
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

      {/* Command Palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou busque..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Sugestões">
            {NAV.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => {
                  navigate({ to: item.to });
                  setOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ações">
            <CommandItem onSelect={() => { toggleTheme(); setOpen(false); }}>
              {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
              <span>Alternar Tema</span>
            </CommandItem>
            <CommandItem onSelect={() => { setMode(mode === "personal" ? "team" : "personal"); setOpen(false); }}>
              <ModeIcon className="mr-2 h-4 w-4" />
              <span>Alternar para Modo {mode === "personal" ? "Equipe" : "Pessoal"}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logo} alt="EXACTA" className="h-12 w-12 rounded object-contain" />
            <span className="font-display font-bold">EXACTA</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium hover:bg-sidebar-accent/50"
            >
              <ModeIcon className="h-4 w-4 text-accent" />
              {modeLabel}
            </button>
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
