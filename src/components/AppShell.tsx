import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Kanban, CalendarRange,
  Megaphone, Users, LogOut, Bell, MessageSquareHeart, Wallet,
  StickyNote, FolderOpen, Building2, UserCircle, ChevronDown, BellRing, Settings,
  Moon, Sun, Command, Search, Target, Brain, FileText, Presentation, Cpu, Timer,
  Plus, ArrowLeft, MoreVertical, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationsBell } from "@/components/NotificationsBell";
const logo = "https://raw.githubusercontent.com/Rainando025/ASSETS-FOTOS/refs/heads/main/icone_exacta.png";
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
import { LucideIcon } from "lucide-react";

interface NavItem {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

const PERSONAL_NAV: readonly NavGroup[] = [
  {
    title: "Geral",
    items: [
      { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
      { to: "/tasks", label: "Tarefas", icon: CheckSquare },
      { to: "/projects", label: "Projetos", icon: FolderOpen },
    ]
  },
  {
    title: "Produtividade",
    items: [
      { to: "/notes", label: "Anotações", icon: StickyNote },
      { to: "/finances", label: "Finanças", icon: Wallet },
      { to: "/reminders", label: "Lembretes", icon: BellRing },
    ]
  },
  {
    title: "Configurações",
    items: [
      { to: "/notifications", label: "Avisos", icon: Bell },
      { to: "/settings", label: "Ajustes", icon: Settings },
    ]
  }
];

const TEAM_NAV: readonly NavGroup[] = [
  {
    title: "Planejamento",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/tasks", label: "Tarefas", icon: CheckSquare },
      { to: "/projects", label: "Projetos", icon: FolderKanban },
      { to: "/okrs", label: "Metas e OKRs", icon: Target },
    ]
  },
  {
    title: "Visualização",
    items: [
      { to: "/kanban", label: "Kanban", icon: Kanban },
      { to: "/gantt", label: "Cronograma", icon: CalendarRange },
    ]
  },
  {
    title: "Colaboração",
    items: [
      { to: "/brainstorming", label: "Brainstorm", icon: Brain },
      { to: "/docs", label: "Documentos", icon: FileText },
      { to: "/whiteboards", label: "Quadros", icon: Presentation },
      { to: "/announcements", label: "Mural", icon: Megaphone },
    ]
  },
  {
    title: "Operações",
    items: [
      { to: "/automations", label: "Automação", icon: Cpu },
      { to: "/time-tracking", label: "Tempo", icon: Timer },
    ]
  },
  {
    title: "Gestão de Pessoas",
    items: [
      { to: "/team", label: "Equipe", icon: Users },
      { to: "/feedback", label: "Feedback 360°", icon: MessageSquareHeart },
    ]
  },
  {
    title: "Sistema",
    items: [
      { to: "/notifications", label: "Avisos", icon: Bell },
      { to: "/settings", label: "Ajustes", icon: Settings },
    ]
  }
];

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
      navigate({ to: "/auth", search: { invite: undefined } });
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

        <nav className="flex-1 space-y-6 p-3 overflow-y-auto">
          {NAV.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to || location.pathname.startsWith(to + "/");
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
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
              </div>
            </div>
          ))}
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
            {NAV.flatMap(g => g.items).map((item: NavItem) => (
              <CommandItem
                key={item.to}
                onSelect={() => {
                  navigate({ to: item.to as any });
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
        <header className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground px-4 py-3 sticky top-0 z-20 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            {location.pathname !== "/dashboard" ? (
              <button 
                onClick={() => navigate({ to: "/dashboard" })}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <img src={logo} alt="EXACTA" className="h-10 w-10 rounded object-contain" />
            )}
            <span className="font-display font-bold text-sm">EXACTA</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-tighter hover:bg-sidebar-accent/50"
            >
              <ModeIcon className="h-3.5 w-3.5 text-accent" />
              {modeLabel}
            </button>
            <NotificationsBell />
            <button onClick={signOut} aria-label="Sair" className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent/50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile nav */}
        <nav className="md:hidden flex gap-1 overflow-x-auto bg-sidebar/95 px-2 py-2 text-sidebar-foreground border-t border-sidebar-border scrollbar-hide">
          {NAV.flatMap(g => g.items).map((item: NavItem) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-[10px] whitespace-nowrap",
                active ? "bg-sidebar-accent text-accent" : "text-sidebar-foreground/70"
              )}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <header className="hidden md:flex items-center justify-between border-b px-6 py-3 bg-card/30 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {location.pathname !== "/dashboard" && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-accent"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs font-semibold">Voltar ao Menu</span>
              </Button>
            )}
            <div className="h-4 w-[1px] bg-border mx-2" />
            <h2 className="text-sm font-bold capitalize">
              {location.pathname.split("/").filter(Boolean).pop() || "Painel"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 bg-muted/50 border-white/5 text-xs font-medium"
              onClick={() => setOpen(true)}
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Busca rápida</span>
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-2 bg-gradient-primary text-primary-foreground shadow-elegant">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuLabel>O que deseja criar?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/tasks" })} className="gap-2">
                  <CheckSquare className="h-4 w-4 text-accent" /> Tarefa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/projects" })} className="gap-2">
                  <FolderKanban className="h-4 w-4 text-accent" /> Projeto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/notes" })} className="gap-2">
                  <StickyNote className="h-4 w-4 text-accent" /> Anotação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/docs" })} className="gap-2">
                  <FileText className="h-4 w-4 text-accent" /> Documento
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 font-semibold text-accent">
                  <Sparkles className="h-4 w-4" /> Sugestão da IA
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background/50 relative">
          {children}
          
          {/* Mobile FAB */}
          <div className="md:hidden fixed bottom-20 right-6 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" className="h-14 w-14 rounded-full bg-gradient-primary text-primary-foreground shadow-elegant scale-110">
                  <Plus className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-56 p-2 mb-4">
                <DropdownMenuLabel>Criar Novo</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/tasks" })} className="gap-2 py-3">
                  <CheckSquare className="h-4 w-4 text-accent" /> Tarefa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/projects" })} className="gap-2 py-3">
                  <FolderKanban className="h-4 w-4 text-accent" /> Projeto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/notes" })} className="gap-2 py-3">
                  <StickyNote className="h-4 w-4 text-accent" /> Anotação
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 font-semibold text-accent py-3">
                  <Sparkles className="h-4 w-4" /> Usar Inteligência Artificial
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </main>
      </div>
    </div>
  );
}
