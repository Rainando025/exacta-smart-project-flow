import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Kanban, CalendarRange,
  Megaphone, Users, LogOut, Bell, MessageSquareHeart, Wallet,
  StickyNote, FolderOpen, Building2, UserCircle, ChevronDown, BellRing, Settings,
  Moon, Sun, Command, Search, Target, Brain, FileText, Presentation, Cpu, Timer,
  Plus, ArrowLeft, Sparkles, MessageSquare, PanelLeftClose, PanelLeftOpen, CalendarPlus
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
      { to: "/calendar", label: "Calendário", icon: CalendarPlus },
    ]
  },
  {
    title: "Visualização",
    items: [
      { to: "/kanban", label: "Kanban", icon: Kanban },
      { to: "/gantt", label: "Cronograma", icon: CalendarRange },
      { to: "/visual-management", label: "Gestão Visual", icon: Presentation },
    ]
  },
  {
    title: "Colaboração",
    items: [
      { to: "/chat", label: "Chat da Equipe", icon: MessageSquare },
      { to: "/brainstorming", label: "Brainstorm", icon: Brain },
      { to: "/docs", label: "Documentos", icon: FileText },
      { to: "/whiteboards", label: "Quadros", icon: Presentation },
      { to: "/announcements", label: "Mural", icon: Megaphone },
      { to: "/notifications", label: "Avisos", icon: Bell },
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
  }
];

type AppMode = "personal" | "team";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-collapsed");
      return saved !== null ? saved === "true" : true; // Default to true (collapsed)
    }
    return true;
  });
  const [mode, setMode] = useState<AppMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("exacta-mode") as AppMode) || "team";
    }
    return "team";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

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

  // Current page label for breadcrumb
  const pageName = location.pathname.split("/").filter(Boolean).pop() || "painel";
  const pageLabels: Record<string, string> = {
    dashboard: "Dashboard", tasks: "Tarefas", projects: "Projetos",
    kanban: "Kanban", gantt: "Cronograma", notes: "Anotações",
    finances: "Finanças", reminders: "Lembretes", notifications: "Avisos",
    settings: "Ajustes", okrs: "Metas e OKRs", brainstorming: "Brainstorm",
    docs: "Documentos", whiteboards: "Quadros", announcements: "Mural",
    automations: "Automação", "time-tracking": "Rastreamento", team: "Equipe",
    feedback: "Feedback 360°", chat: "Chat da Equipe", painel: "Painel",
    calendar: "Calendário", "visual-management": "Gestão Visual",
  };
  const currentPageLabel = pageLabels[pageName] ?? pageName;

  return (
    <div className="flex min-h-screen bg-background">

      {/* ─── SIDEBAR DESKTOP ─── */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground shrink-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          sidebarCollapsed ? "flex-col py-4 gap-3" : "justify-between px-4 py-4 gap-2"
        )}>
          <div className={cn(
            "flex items-center gap-3",
            sidebarCollapsed ? "justify-center" : ""
          )}>
            <img src={logo} alt="EXACTA" className="h-10 w-10 rounded-lg object-contain shrink-0" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-display text-base font-bold tracking-tight leading-tight">EXACTA</h1>
                <p className="text-[10px] uppercase tracking-widest text-accent leading-tight">Precisão em gestão</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            className="flex items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground shrink-0"
          >
            {sidebarCollapsed
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Mode switcher */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent/60 px-3 py-2 text-sm font-medium transition-all hover:bg-sidebar-accent"
            >
              <div className="flex items-center gap-2">
                <ModeIcon className="h-4 w-4 text-accent shrink-0" />
                <span>Modo {modeLabel}</span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
            </button>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="px-2 pt-3 pb-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              title={`Modo ${modeLabel}`}
              className="flex w-full items-center justify-center rounded-lg bg-sidebar-accent/60 p-2 transition-all hover:bg-sidebar-accent"
            >
              <ModeIcon className="h-4 w-4 text-accent" />
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-2 p-2 overflow-y-auto">
          {NAV.map((group) => (
            <div key={group.title} className="space-y-0.5">
              {!sidebarCollapsed && (
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40 mb-1">
                  {group.title}
                </h3>
              )}
              {sidebarCollapsed && <div className="border-t border-sidebar-border/40 my-1" />}
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to || location.pathname.startsWith(to + "/");
                  return (
                    <Link
                      key={to}
                      to={to}
                      title={sidebarCollapsed ? label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        sidebarCollapsed ? "justify-center px-2" : "",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-glow"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && label}
                      {!sidebarCollapsed && active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: profile + actions */}
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {/* Settings moved here to balance space */}
          <Link
            to="/settings"
            title={sidebarCollapsed ? "Ajustes" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              sidebarCollapsed ? "justify-center px-2" : "",
              location.pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && "Ajustes"}
          </Link>

          <div className="h-px bg-sidebar-border/40 my-1" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              sidebarCollapsed ? "justify-center px-2" : ""
            )}
          >
            {theme === "light" ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
            {!sidebarCollapsed && (theme === "light" ? "Modo Escuro" : "Modo Claro")}
          </button>

          {/* Profile */}
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5",
            sidebarCollapsed ? "justify-center" : ""
          )}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-accent font-bold text-accent-foreground text-xs">
              {(profile?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold leading-tight">{profile?.full_name || user.email}</p>
                <p className="truncate text-[10px] text-sidebar-foreground/60">{profile?.job_title || "Colaborador"}</p>
              </div>
            )}
          </div>

          {/* Logout */}
          <div className="flex gap-1 mt-1">
            <button
              onClick={signOut}
              title="Sair"
              className={cn(
                "flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                sidebarCollapsed ? "justify-center px-2" : ""
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && "Sair"}
            </button>
          </div>
        </div>
      </aside>

      {/* ─── COMMAND PALETTE ─── */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou busque..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Páginas">
            {NAV.flatMap(g => g.items).map((item: NavItem) => (
              <CommandItem
                key={item.to}
                onSelect={() => { navigate({ to: item.to as any }); setOpen(false); }}
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

      {/* ─── MAIN CONTENT ─── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground px-3 py-2.5 sticky top-0 z-20 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            {location.pathname !== "/dashboard" ? (
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <img src={logo} alt="EXACTA" className="h-8 w-8 rounded object-contain" />
            )}
            <span className="font-display font-bold text-sm">EXACTA</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-tighter hover:bg-sidebar-accent/50"
            >
              <ModeIcon className="h-3.5 w-3.5 text-accent" />
              {modeLabel}
            </button>
            <button onClick={toggleTheme} className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent/50">
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <NotificationsBell />
            <button onClick={signOut} aria-label="Sair" className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent/50">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden flex gap-0.5 overflow-x-auto bg-sidebar/95 px-2 py-1.5 text-sidebar-foreground border-b border-sidebar-border scrollbar-hide sticky top-[49px] z-10">
          {NAV.flatMap(g => g.items).map((item: NavItem) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to} className={cn(
                "flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1 text-[10px] whitespace-nowrap",
                active ? "bg-sidebar-accent text-accent" : "text-sidebar-foreground/70"
              )}>
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between border-b px-4 py-2.5 bg-card/30 backdrop-blur-md sticky top-0 z-10 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {location.pathname !== "/dashboard" && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-accent h-8 px-2"
                onClick={() => navigate({ to: "/dashboard" })}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold hidden sm:inline">Voltar</span>
              </Button>
            )}
            <h2 className="text-sm font-bold capitalize truncate">{currentPageLabel}</h2>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick search */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 bg-muted/50 border-white/5 text-xs font-medium"
              onClick={() => setOpen(true)}
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Busca rápida</span>
              <kbd className="ml-1 hidden sm:inline-flex pointer-events-none h-4 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleTheme}
              title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            {/* Bell */}
            <NotificationsBell />

            {/* New dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 bg-gradient-primary text-primary-foreground shadow-elegant">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Novo</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 p-2">
                <DropdownMenuLabel>O que deseja criar?</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: "/tasks" })} className="gap-2">
                  <CheckSquare className="h-4 w-4 text-accent" /> Tarefa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/projects" })} className="gap-2">
                  <FolderKanban className="h-4 w-4 text-accent" /> Projeto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/gantt" })} className="gap-2">
                  <CalendarPlus className="h-4 w-4 text-accent" /> Gantt
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

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background/50 relative">
          {children}
        </main>

        {/* Mobile FAB */}
        <div className="md:hidden fixed bottom-6 right-4 z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" className="h-12 w-12 rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
                <Plus className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-52 p-2 mb-3">
              <DropdownMenuLabel>Criar Novo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/tasks" })} className="gap-2 py-2.5">
                <CheckSquare className="h-4 w-4 text-accent" /> Tarefa
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/projects" })} className="gap-2 py-2.5">
                <FolderKanban className="h-4 w-4 text-accent" /> Projeto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/notes" })} className="gap-2 py-2.5">
                <StickyNote className="h-4 w-4 text-accent" /> Anotação
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 font-semibold text-accent py-2.5">
                <Sparkles className="h-4 w-4" /> Usar IA
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
