import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  LayoutDashboard, CheckSquare, FolderKanban, Kanban, CalendarRange,
  Megaphone, Users, LogOut, Bell, MessageSquareHeart, Wallet,
  StickyNote, FolderOpen, Building2, UserCircle, ChevronDown, ChevronRight, ChevronUp, BellRing, Settings,
  Moon, Sun, Command, Search, Target, Brain, FileText, Presentation, Cpu, Timer,
  Plus, ArrowLeft, Sparkles, MessageSquare, PanelLeftClose, PanelLeftOpen, CalendarPlus,
  Network, BarChart3, GraduationCap, Menu, X
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
import { useRole } from "@/hooks/useRole";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationsBell } from "@/components/NotificationsBell";
import { AIChat } from "@/components/AIChat";
import { SplashScreen } from "@/components/SplashScreen";
import { ProjectSelector } from "@/components/ProjectSelector";
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
      { to: "/training", label: "Treinamentos", icon: GraduationCap },
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
      { to: "/okrs", label: "OKRs & Metas", icon: Target },
      { to: "/calendar", label: "Calendário", icon: CalendarPlus },
      { to: "/reminders", label: "Lembretes", icon: BellRing },
    ]
  },
  {
    title: "Visualização",
    items: [
      { to: "/kanban", label: "Kanban", icon: Kanban },
      { to: "/gantt", label: "Cronograma", icon: CalendarRange },
      { to: "/visual-management", label: "Gestão Visual", icon: Presentation },
      { to: "/neural-map", label: "Mapa Neural", icon: Network },
      { to: "/analyze", label: "BI & Análise", icon: BarChart3 },
    ]
  },
  {
    title: "Colaboração",
    items: [
      { to: "/chat", label: "Chat", icon: MessageSquare },
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
      { to: "/feedback", label: "Feedback", icon: MessageSquareHeart },
      { to: "/training", label: "Treinamentos", icon: GraduationCap },
    ]
  }
];

type AppMode = "personal" | "team";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, loading, signOut } = useAuth();
  const { isGestor } = useRole();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const navScrollTopRef = useRef<number>(0);

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

  // State to collapse/expand groups in sidebar
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("exacta-collapsed-sections");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => {
      const updated = { ...prev, [title]: !prev[title] };
      localStorage.setItem("exacta-collapsed-sections", JSON.stringify(updated));
      return updated;
    });
  };

  const handleNavScroll = (e: React.UIEvent<HTMLElement>) => {
    navScrollTopRef.current = e.currentTarget.scrollTop;
  };

  // Mantem a rolagem do menu lateral congelada na posicao onde o usuario estava
  useEffect(() => {
    if (navRef.current && navScrollTopRef.current > 0) {
      navRef.current.scrollTop = navScrollTopRef.current;
    }
  }, [location.pathname]);

  // Fecha o drawer mobile ao mudar de rota
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

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
    return null;
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
    settings: "Ajustes", okrs: "OKRs & Metas", brainstorming: "Brainstorm",
    docs: "Documentos", whiteboards: "Quadros", announcements: "Mural",
    automations: "Automação", "time-tracking": "Tempo", team: "Equipe",
    feedback: "Feedback", chat: "Chat", painel: "Painel",
    calendar: "Calendário", "visual-management": "Gestão Visual",
    "neural-map": "Mapa Neural", analyze: "BI & Análise", training: "Treinamentos"
  };
  const currentPageLabel = pageLabels[pageName] ?? pageName;

  return (
    <div className="flex min-h-screen bg-background">

      {/* ─── SIDEBAR DESKTOP (CONGELADA / STICKY) ─── */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-sidebar text-sidebar-foreground shrink-0 transition-all duration-300 ease-in-out sticky top-0 h-screen overflow-hidden border-r border-sidebar-border z-30 select-none",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo & Toggle */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300",
          sidebarCollapsed ? "flex-col py-3.5 gap-2" : "justify-between px-4 py-3.5 gap-2"
        )}>
          <div className={cn(
            "flex items-center gap-2.5",
            sidebarCollapsed ? "justify-center" : ""
          )}>
            <img src={logo} alt="EXACTA" className="h-9 w-9 rounded-lg object-contain shrink-0" />
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-display text-base font-bold tracking-tight leading-tight">EXACTA</h1>
                <p className="text-[10px] uppercase tracking-widest text-accent leading-tight font-medium">Gestão & Inteligência</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            className="flex items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground shrink-0"
          >
            {sidebarCollapsed
              ? <PanelLeftOpen className="h-4 w-4" />
              : <PanelLeftClose className="h-4 w-4" />
            }
          </button>
        </div>

        {/* Mode switcher */}
        {!sidebarCollapsed ? (
          <div className="px-3 pt-2.5 pb-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent/50 px-3 py-1.5 text-xs font-semibold transition-all hover:bg-sidebar-accent text-sidebar-foreground"
            >
              <div className="flex items-center gap-2">
                <ModeIcon className="h-3.5 w-3.5 text-accent shrink-0" />
                <span>Modo {modeLabel}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-sidebar-foreground/50" />
            </button>
          </div>
        ) : (
          <div className="px-2 pt-2.5 pb-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              title={`Modo ${modeLabel}`}
              className="flex w-full items-center justify-center rounded-lg bg-sidebar-accent/50 p-2 transition-all hover:bg-sidebar-accent"
            >
              <ModeIcon className="h-4 w-4 text-accent" />
            </button>
          </div>
        )}

        {/* Nav list - Scroll interno preservado e congelado */}
        <nav
          ref={navRef}
          onScroll={handleNavScroll}
          className="flex-1 space-y-3 p-2 overflow-y-auto scrollbar-hide"
        >
          {NAV.map((group) => {
            const isCollapsed = Boolean(collapsedSections[group.title]);
            return (
              <div key={group.title} className="space-y-0.5">
                {!sidebarCollapsed ? (
                  <button
                    type="button"
                    onClick={() => toggleSection(group.title)}
                    className="flex items-center justify-between w-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/45 hover:text-sidebar-foreground/80 transition-colors"
                  >
                    <span>{group.title}</span>
                    <span className="text-sidebar-foreground/30">
                      {isCollapsed ? <ChevronRight className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                    </span>
                  </button>
                ) : (
                  <div className="border-t border-sidebar-border/40 my-1.5" />
                )}

                {(!isCollapsed || sidebarCollapsed) && (
                  <div className="space-y-0.5">
                    {group.items.map(({ to, label, icon: Icon }) => {
                      const active = location.pathname === to || location.pathname.startsWith(to + "/");
                      return (
                        <Link
                          key={to}
                          to={to}
                          resetScroll={false}
                          title={sidebarCollapsed ? label : undefined}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            sidebarCollapsed ? "justify-center px-2 py-2" : "",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                              : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-sidebar-foreground/65")} />
                          {!sidebarCollapsed && <span className="truncate">{label}</span>}
                          {!sidebarCollapsed && active && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom: profile + actions */}
        <div className="border-t border-sidebar-border p-2 space-y-1 bg-sidebar/80">
          <Link
            to="/settings"
            resetScroll={false}
            title={sidebarCollapsed ? (isGestor ? "Configurações" : "Meu Perfil") : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
              sidebarCollapsed ? "justify-center px-2 py-2" : "",
              location.pathname === "/settings"
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            {isGestor ? <Settings className="h-4 w-4 shrink-0" /> : <UserCircle className="h-4 w-4 shrink-0" />}
            {!sidebarCollapsed && <span>{isGestor ? "Configurações" : "Meu Perfil"}</span>}
          </Link>

          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              sidebarCollapsed ? "justify-center px-2 py-2" : ""
            )}
          >
            {theme === "light" ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
            {!sidebarCollapsed && <span>{theme === "light" ? "Modo Escuro" : "Modo Claro"}</span>}
          </button>

          <div className="h-px bg-sidebar-border/40 my-1" />

          {/* Profile card */}
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1",
            sidebarCollapsed ? "justify-center" : ""
          )}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-accent font-bold text-accent-foreground text-xs shadow-xs">
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
          <button
            onClick={signOut}
            title="Sair"
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive",
              sidebarCollapsed ? "justify-center px-2 py-2" : ""
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ÔöÇÔöÇÔöÇ COMMAND PALETTE ÔöÇÔöÇÔöÇ */}
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

        {/* Mobile top bar (HUD Mobile Limpo) */}
        <header className="md:hidden flex items-center justify-between bg-sidebar text-sidebar-foreground px-3.5 py-2.5 sticky top-0 z-20 border-b border-sidebar-border shadow-xs">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sidebar-accent/60 text-sidebar-foreground transition-colors"
              title="Abrir menu de navegação"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="EXACTA" className="h-7 w-7 rounded object-contain shrink-0" />
              <span className="font-display font-bold text-sm tracking-tight truncate max-w-[120px] sm:max-w-[180px]">
                {currentPageLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setMode(mode === "personal" ? "team" : "personal")}
              className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[10px] font-bold uppercase tracking-tight bg-sidebar-accent/50 text-accent"
              title={`Alternar para modo ${mode === "personal" ? "Equipe" : "Pessoal"}`}
            >
              <ModeIcon className="h-3.5 w-3.5" />
              <span>{modeLabel}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
              title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <NotificationsBell />
          </div>
        </header>

        {/* Mobile Drawer (Gaveta Lateral Completa) */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground flex flex-col h-full shadow-2xl z-50">
              {/* Header do Drawer */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-sidebar-border">
                <div className="flex items-center gap-2.5">
                  <img src={logo} alt="EXACTA" className="h-8 w-8 rounded-lg object-contain shrink-0" />
                  <div>
                    <h2 className="font-display text-sm font-bold leading-tight">EXACTA</h2>
                    <p className="text-[10px] text-accent font-medium leading-tight">Modo {modeLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Seletor de Modo no Drawer */}
              <div className="p-3 border-b border-sidebar-border/40">
                <button
                  onClick={() => setMode(mode === "personal" ? "team" : "personal")}
                  className="flex w-full items-center justify-between rounded-lg bg-sidebar-accent/60 px-3 py-2 text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <ModeIcon className="h-4 w-4 text-accent" />
                    <span>Alternar Modo ({modeLabel})</span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                </button>
              </div>

              {/* Lista de Navegação Mobile */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-hide">
                {NAV.map((group) => (
                  <div key={group.title} className="space-y-1">
                    <h3 className="px-2 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
                      {group.title}
                    </h3>
                    <div className="space-y-0.5">
                      {group.items.map(({ to, label, icon: Icon }) => {
                        const active = location.pathname === to || location.pathname.startsWith(to + "/");
                        return (
                          <Link
                            key={to}
                            to={to}
                            resetScroll={false}
                            onClick={() => setMobileDrawerOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                              active
                                ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                            )}
                          >
                            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-accent" : "text-sidebar-foreground/60")} />
                            <span className="truncate">{label}</span>
                            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Rodapé do Drawer */}
              <div className="border-t border-sidebar-border p-3 space-y-2 bg-sidebar/95">
                <Link
                  to="/settings"
                  resetScroll={false}
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span>Configurações</span>
                </Link>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Header (HUD Superior Limpo & Moderno) */}
        <header className="hidden md:flex items-center justify-between border-b border-border/40 px-5 py-2.5 bg-card/40 backdrop-blur-md sticky top-0 z-20 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {location.pathname !== "/dashboard" && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground hover:text-accent h-8 px-2"
                onClick={() => navigate({ to: "/dashboard" })}
                title="Ir para o Dashboard"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="text-xs font-semibold">Painel</span>
              </Button>
            )}

            {/* Breadcrumb refinado */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                <ModeIcon className="h-3 w-3" />
                <span>{modeLabel}</span>
              </span>
              <span className="text-muted-foreground/40 font-light">/</span>
              <h2 className="text-sm font-bold tracking-tight text-foreground truncate">
                {currentPageLabel}
              </h2>
            </div>

            <div className="h-4 w-px bg-border/60 mx-1" />
            <ProjectSelector />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick search */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 bg-muted/30 hover:bg-muted/60 border-border/50 text-xs font-medium px-2.5"
              onClick={() => setOpen(true)}
              title="Busca rápida (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden lg:inline text-muted-foreground">Buscar...</span>
              <kbd className="hidden sm:inline-flex pointer-events-none h-4 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
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
                <Button size="sm" className="h-8 gap-1.5 bg-gradient-primary text-primary-foreground shadow-xs hover:opacity-95">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-xs font-semibold">Novo</span>
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
        <main className="flex-1 overflow-auto bg-background/50 relative pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Atalhos rápidos limpos) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar/95 backdrop-blur-md border-t border-sidebar-border px-3 py-1.5 flex items-center justify-around shadow-lg">
          <Link
            to="/dashboard"
            resetScroll={false}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium rounded-lg transition-colors",
              location.pathname === "/dashboard" ? "text-accent font-semibold" : "text-sidebar-foreground/70"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Painel</span>
          </Link>
          <Link
            to="/tasks"
            resetScroll={false}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium rounded-lg transition-colors",
              location.pathname === "/tasks" ? "text-accent font-semibold" : "text-sidebar-foreground/70"
            )}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Tarefas</span>
          </Link>
          <Link
            to="/projects"
            resetScroll={false}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium rounded-lg transition-colors",
              location.pathname === "/projects" ? "text-accent font-semibold" : "text-sidebar-foreground/70"
            )}
          >
            <FolderKanban className="h-4 w-4" />
            <span>Projetos</span>
          </Link>
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium rounded-lg text-sidebar-foreground/70 hover:text-accent transition-colors"
          >
            <Menu className="h-4 w-4" />
            <span>Mais</span>
          </button>
        </nav>

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

        {/* Global AI Assistant Floating Component */}
        <AIChat />
      </div>
    </div>
  );
}
