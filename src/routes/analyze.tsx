import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  ShieldCheck,
  FileSpreadsheet,
  Filter,
  GripVertical,
  History,
  Keyboard,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Share2,
  Monitor,
  Moon,
  Pencil,
  Play,
  Plus,
  Layers,
  Printer,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Upload,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartRenderer } from "@/components/analyze/ChartRenderer";
import { ChartEditor } from "@/components/analyze/ChartEditor";
import { DrillDialog } from "@/components/analyze/DrillDialog";
import { FieldPanel } from "@/components/analyze/FieldPanel";
import { PageTabs, pickIcon } from "@/components/analyze/PageTabs";
import { ViewsMenu } from "@/components/analyze/ViewsMenu";
import { NotesDialog } from "@/components/analyze/NotesDialog";
import { HistoryDialog } from "@/components/analyze/HistoryDialog";
import { ShareDialog } from "@/components/analyze/ShareDialog";
import { AlertsDialog } from "@/components/analyze/AlertsDialog";
import { MergeDatasetsDialog } from "@/components/analyze/MergeDatasetsDialog";
import { KpiEditorDialog } from "@/components/analyze/KpiEditorDialog";
import { RemindersDialog } from "@/components/analyze/RemindersDialog";
import { buildAlertEvents, evaluateAlerts, type AlertEvent, type AlertRule } from "@/lib/analyze/alerts";
import { dispatchAlertNotification } from "@/lib/analyze/notify.functions";
import { aggregateKpi, formatNumber, formatKpiValue, buildHeuristicDashboard } from "@/lib/analyze/aggregate";
import { isAudioEnabled, setAudioEnabled, playChime, playWarning } from "@/lib/analyze/audio";
import { buildDataset, fileToBase64, mergeDataset, parseCsvText, parseWorkbook } from "@/lib/analyze/parse-file";
import { extractDocument, generateDashboard } from "@/lib/analyze/ai.functions";
import { buildShareUrl, readStateFromUrl } from "@/lib/analyze/share";
import {
  fetchCloudPages,
  getNotifyPrefs,
  logActivity,
  publishPage,
  resolveRoles,
  savePageContent,
  saveNotifyPrefs,
  type NotifyPrefs,
} from "@/lib/analyze/cloud";
import { supabase } from "@/integrations/supabase/client";
import type {
  Annotation,
  ChartSpec,
  Dashboard,
  Dataset,
  ImportEntry,
  Page,
  Row,
  SavedView,
  ViewState,
  Reminder,
  KpiSpec,
} from "@/lib/analyze/types";



export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "NEXUS BI · Dashboards automáticos com IA" },
      {
        name: "description",
        content:
          "Importe CSV, XLSX ou PDF e receba dashboards analíticos gerados por IA, com páginas, filtros cruzados, gráficos arrastáveis e modo claro.",
      },
      { property: "og:title", content: "NEXUS BI · Dashboards automáticos com IA" },
      {
        property: "og:description",
        content: "Análise de dados instantânea: importe seus arquivos e visualize KPIs e gráficos em tempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const ACCENTS = ["neon-blue", "neon-red", "neon-cyan", "neon-purple", "neon-orange", "neon-green"];
const STORAGE_KEY = "nexus-bi-workspace-v1";
const THEME_KEY = "nexus-bi-theme";

type Cross = { field: string; value: string } | null;

function Index() {
  const navigate = useNavigate();
  const [pages, setPages] = useState<Page[]>([]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [loading, setLoading] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [editing, setEditing] = useState<ChartSpec | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [hiddenCols, setHiddenCols] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [cross, setCross] = useState<Cross>(null);
  const [drill, setDrill] = useState<{ spec: ChartSpec; label: string; rows: Row[] } | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [notesFor, setNotesFor] = useState<{ id: string; title: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [notifyPrefs, setNotifyPrefs] = useState<NotifyPrefs | null>(null);
  
  // New States
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState<KpiSpec | null>(null);
  const [kpiEditorOpen, setKpiEditorOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isAudioEnabled());

  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<"replace" | "append">("replace");
  const dragIndex = useRef<number | null>(null);
  const pendingView = useRef<ViewState | null>(null);
  const syncRef = useRef<Record<string, string>>({});



  /* ---------------- tema ---------------- */
  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as "dark" | "light" | null) ?? "light";
    setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  /* ---------------- persistência ---------------- */
  useEffect(() => {
    const shared = readStateFromUrl();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { pages: Page[]; activeId: string | null };
      if (saved.pages?.length) {
        setPages(saved.pages);
        const target = shared?.pageName ? saved.pages.find((p) => p.name === shared.pageName) : null;
        setActiveId(target?.id ?? saved.activeId ?? saved.pages[0]?.id ?? null);
      }
    } catch {
      /* ignore */
    } finally {
      if (shared) {
        pendingView.current = shared;
        toast.success("Visão compartilhada aplicada");
      }
    }
  }, []);

  useEffect(() => {
    if (!pages.length) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          activeId,
          pages: pages.map((p) => ({ ...p, dataset: { ...p.dataset, rows: p.dataset.rows.slice(0, 20000) } })),
        }),
      );
    } catch {
      /* storage cheio */
    }
  }, [pages, activeId]);

  useEffect(() => {
    const pv = pendingView.current;
    if (pv) {
      pendingView.current = null;
      setHiddenCols(pv.hiddenCols);
      setFilters(pv.filters);
      setCross(pv.cross);
      setOrientation(pv.orientation);
      return;
    }
    setHiddenCols([]);
    setFilters({});
    setCross(null);
  }, [activeId]);

  /* ---------------- lembretes ---------------- */
  useEffect(() => {
    const raw = localStorage.getItem("nexus-bi-reminders");
    if (raw) {
      try {
        setReminders(JSON.parse(raw));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveRemindersToStorage = (list: Reminder[]) => {
    setReminders(list);
    localStorage.setItem("nexus-bi-reminders", JSON.stringify(list));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const due = reminders.find(
        (r) => !r.completed && !r.triggered && new Date(r.datetime) <= now
      );
      if (due) {
        const updated = reminders.map((r) => (r.id === due.id ? { ...r, triggered: true } : r));
        saveRemindersToStorage(updated);
        
        playWarning();
        
        const targetPage = pages.find((p) => p.id === due.pageId);
        
        toast.info(`🔔 Lembrete: ${due.title}`, {
          description: targetPage ? `Agendado para a página "${targetPage.name}"` : "",
          duration: 10000,
          action: targetPage
            ? {
                label: "Ir para a página",
                onClick: () => {
                  setActiveId(due.pageId);
                  if (due.chartId) {
                    setTimeout(() => {
                      const el = document.getElementById(due.chartId!);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        el.classList.add("ring-4", "ring-primary", "transition-all");
                        setTimeout(() => el.classList.remove("ring-4", "ring-primary"), 3000);
                      }
                    }, 500);
                  }
                },
              }
            : undefined,
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [reminders, pages]);


  /* ---------------- sessão e nuvem ---------------- */
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? null } : null),
    );
    void supabase.auth
      .getSession()
      .then(({ data }) =>
        setUser(data.session?.user ? { id: data.session.user.id, email: data.session.user.email ?? null } : null),
      );
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        const cloud = await fetchCloudPages(user.id);
        const roles = await resolveRoles(cloud, user.email ?? "");
        if (cancelled || !cloud.length) return;
        const withRoles = cloud.map((p) => ({
          ...p,
          cloud: { role: roles[p.id] ?? "viewer", ownerEmail: p.cloud?.ownerEmail ?? null },
        }));
        withRoles.forEach((p) => (syncRef.current[p.id] = JSON.stringify(p)));
        setPages((prev) => {
          const map = new Map(prev.map((p) => [p.id, p] as const));
          for (const p of withRoles) map.set(p.id, p);
          return [...map.values()];
        });
      } catch (e) {
        toast.error("Falha ao carregar páginas compartilhadas", { description: (e as Error).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      for (const p of pages) {
        if (!p.cloud || p.cloud.role === "viewer") continue;
        const snap = JSON.stringify(p);
        if (syncRef.current[p.id] === snap) continue;
        syncRef.current[p.id] = snap;
        void savePageContent(p).catch(() => undefined);
      }
    }, 1500);
    return () => clearTimeout(t);
  }, [pages, user]);

  const page = useMemo(() => pages.find((p) => p.id === activeId) ?? null, [pages, activeId]);
  const dataset = page?.dataset ?? null;
  const dashboard = page?.dashboard ?? null;
  const role = page?.cloud?.role ?? null;
  const canEdit = !page?.cloud || page.cloud.role !== "viewer";

  const track = useCallback(
    (action: string, detail?: string) => {
      if (!user || !page?.cloud) return;
      void logActivity(page.id, user.id, user.email, action, detail).catch(() => undefined);
    },
    [user, page],
  );

  const patchPage = useCallback(
    (id: string, patch: Partial<Page>) => setPages((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [],
  );

  const publishCurrent = useCallback(async () => {
    if (!page || !user) return;
    try {
      await publishPage(page, user.id, user.email);
      patchPage(page.id, { cloud: { role: "owner", ownerEmail: user.email } });
      await logActivity(page.id, user.id, user.email, "publicou a página", page.name);
      toast.success("Página publicada na nuvem");
    } catch (e) {
      toast.error("Falha ao publicar", { description: (e as Error).message });
    }
  }, [page, user, patchPage]);


  /* ---------------- IA ---------------- */
  const analyze = useCallback(
    async (pageId: string, ds: Dataset) => {
      setLoading("Gerando dashboard com IA...");
      try {
        let spec: Dashboard | null = null;
        try {
          spec = await generateDashboard({
            data: { name: ds.name, fields: ds.fields, sample: ds.rows.slice(0, 40), rowCount: ds.rows.length },
          });
        } catch (err) {
          console.warn("Provedor de IA indisponível ou sem resposta, usando gerador heurístico:", err);
        }

        if (!spec || !spec.charts || spec.charts.length === 0) {
          spec = buildHeuristicDashboard(ds.name, ds.fields, ds.rows, ds.rows.length);
        } else {
          const valid = new Set(ds.fields.map((f) => f.name));
          spec.charts = spec.charts.filter((c) => valid.has(c.dimension));
          spec.kpis = spec.kpis.filter((k) => !k.field || valid.has(k.field));
          if (spec.charts.length === 0) {
            const fallback = buildHeuristicDashboard(ds.name, ds.fields, ds.rows, ds.rows.length);
            spec.charts = fallback.charts;
            if (spec.kpis.length === 0) spec.kpis = fallback.kpis;
          }
        }

        patchPage(pageId, { dashboard: spec });
        toast.success("Dashboard gerado com sucesso!", { description: `${spec.charts.length} gráficos e ${spec.kpis.length} indicadores criados` });
      } catch (e) {
        toast.error("Falha ao analisar", { description: (e as Error).message });
      } finally {
        setLoading(null);
      }
    },
    [patchPage],
  );

  /* ---------------- importação ---------------- */
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      const ext = file.name.split(".").pop()?.toLowerCase();
      try {
        setLoading("Lendo arquivo...");
        let rows;
        if (ext === "csv" || ext === "txt") {
          rows = parseCsvText(await file.text());
        } else if (ext === "xlsx" || ext === "xls") {
          rows = parseWorkbook(await file.arrayBuffer());
        } else if (ext === "pdf") {
          setLoading("Extraindo dados do PDF com IA...");
          const base64 = await fileToBase64(file);
          const res = await extractDocument({
            data: { filename: file.name, mime: file.type || "application/pdf", base64 },
          });
          rows = res.rows;
        } else {
          toast.error("Formato não suportado", { description: "Use CSV, XLSX ou PDF." });
          setLoading(null);
          return;
        }
        if (!rows.length) {
          toast.error("Nenhum dado encontrado no arquivo");
          setLoading(null);
          return;
        }
        if (modeRef.current === "append" && page) {
          const { dataset: merged, added, duplicates } = mergeDataset(page.dataset, file.name, rows);
          const entry: ImportEntry = {
            id: `imp-${Date.now()}`,
            at: new Date().toISOString(),
            mode: "append",
            filename: file.name,
            rowCount: merged.rows.length,
            added,
            duplicates,
            previous: page.dataset,
          };
          patchPage(page.id, { dataset: merged, history: [...(page.history ?? []), entry] });
          setLoading(null);
          toast.success("Base atualizada", {
            description: `${added.toLocaleString("pt-BR")} novos registros${
              duplicates ? ` · ${duplicates.toLocaleString("pt-BR")} duplicados ignorados` : ""
            } · total ${merged.rows.length.toLocaleString("pt-BR")}`,
          });
          return;
        }

        const ds = buildDataset(file.name, rows);
        const name = file.name.replace(/\.[^.]+$/, "");
        const autoDashboard = buildHeuristicDashboard(name, ds.fields, ds.rows, ds.rows.length);
        const newPage: Page = {
          id: `page-${Date.now()}`,
          name,
          icon: pickIcon(name),
          dataset: ds,
          dashboard: autoDashboard,
          views: [],
          annotations: [],
          history: [
            {
              id: `imp-${Date.now()}`,
              at: new Date().toISOString(),
              mode: "create",
              filename: file.name,
              rowCount: ds.rows.length,
            },
          ],
        };

        setPages((ps) => [...ps, newPage]);
        setActiveId(newPage.id);
        await analyze(newPage.id, ds);
      } catch (e) {
        toast.error("Erro ao importar", { description: (e as Error).message });
        setLoading(null);
      }
    },
    [analyze, page, patchPage],
  );

  /* ---------------- gráficos ---------------- */
  const denyRead = () => toast.error("Acesso somente leitura", { description: "Peça edição ao dono da página." });

  const upsertChart = (spec: ChartSpec) => {
    if (!page?.dashboard) return;
    if (!canEdit) {
      denyRead();
      return;
    }

    const exists = page.dashboard.charts.some((c) => c.id === spec.id);
    const charts = exists
      ? page.dashboard.charts.map((c) => (c.id === spec.id ? spec : c))
      : [...page.dashboard.charts, spec];
    patchPage(page.id, { dashboard: { ...page.dashboard, charts } });
    track(exists ? "editou um gráfico" : "adicionou um gráfico", spec.title);
  };

  const removeChart = (id: string) => {
    if (!page?.dashboard) return;
    if (!canEdit) {
      denyRead();
      return;
    }

    patchPage(page.id, { dashboard: { ...page.dashboard, charts: page.dashboard.charts.filter((c) => c.id !== id) } });
    setEditing(null);
    track("removeu um gráfico");
  };

  const reorderCharts = (from: number, to: number) => {
    if (!page?.dashboard || from === to || !canEdit) return;
    const charts = [...page.dashboard.charts];
    const [moved] = charts.splice(from, 1);
    if (!moved) return;
    charts.splice(to, 0, moved);
    patchPage(page.id, { dashboard: { ...page.dashboard, charts } });
    track("reordenou os gráficos");
  };


  const addChart = () => {
    if (!dataset) return;
    const dim = dataset.fields.find((f) => f.type === "string") ?? dataset.fields[0];
    if (!dim) return;
    setEditing({
      id: `chart-${Date.now()}`,
      title: "Novo gráfico",
      type: "bar",
      dimension: dim.name,
      measure: null,
      agg: "count",
      series: null,
      limit: 10,
      span: 2,
      palette: Math.floor(Math.random() * 6),
    });
  };

  /* ---------------- kpi e lembretes handlers ---------------- */
  const handleSaveKpi = (spec: KpiSpec) => {
    if (!page?.dashboard) return;
    const exists = page.dashboard.kpis.some((k) => k.id === spec.id);
    const kpis = exists
      ? page.dashboard.kpis.map((k) => (k.id === spec.id ? spec : k))
      : [...page.dashboard.kpis, spec];
    patchPage(page.id, { dashboard: { ...page.dashboard, kpis } });
    track(exists ? "editou kpi" : "adicionou kpi", spec.label);
    toast.success("Card de KPI salvo");
  };

  const handleDeleteKpi = (id: string) => {
    if (!page?.dashboard) return;
    const kpis = page.dashboard.kpis.filter((k) => k.id !== id);
    patchPage(page.id, { dashboard: { ...page.dashboard, kpis } });
    setEditingKpi(null);
    track("removeu kpi");
    toast.success("Card de KPI removido");
  };

  const handleAddReminder = (title: string, datetime: string, chartId: string | null) => {
    if (!page) return;
    const newRem: Reminder = {
      id: `rem-${Date.now()}`,
      title,
      datetime,
      pageId: page.id,
      chartId,
      triggered: false,
      completed: false,
    };
    saveRemindersToStorage([...reminders, newRem]);
    toast.success("Lembrete agendado com sucesso!");
  };

  const handleToggleReminderComplete = (id: string) => {
    const next = reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r));
    saveRemindersToStorage(next);
  };

  const handleDeleteReminder = (id: string) => {
    const next = reminders.filter((r) => r.id !== id);
    saveRemindersToStorage(next);
    toast.success("Lembrete excluído");
  };

  const handleMergeDatasets = async (newPage: Page) => {
    setPages((ps) => [...ps, newPage]);
    setActiveId(newPage.id);
    await analyze(newPage.id, newPage.dataset);
  };

  /* ---------------- visões salvas e link compartilhável ---------------- */
  const currentState = useCallback(
    (): ViewState => ({
      ...(page ? { pageName: page.name } : {}),
      hiddenCols,
      filters,
      cross,
      orientation,
    }),
    [page, hiddenCols, filters, cross, orientation],
  );

  const copyLink = useCallback(
    async (state: ViewState) => {
      const url = buildShareUrl(state);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado", { description: "Abra o link para ver o dashboard neste estado." });
      } catch {
        window.prompt("Copie o link da visão:", url);
      }
    },
    [],
  );

  const applyView = (view: SavedView) => {
    setHiddenCols(view.state.hiddenCols);
    setFilters(view.state.filters);
    setCross(view.state.cross);
    setOrientation(view.state.orientation);
    toast.success(`Visão "${view.name}" aplicada`);
  };

  const saveView = () => {
    if (!page) return;
    if (!canEdit) {
      denyRead();
      return;
    }
    const name = window.prompt("Nome da visão", `Visão ${(page.views?.length ?? 0) + 1}`);
    if (!name?.trim()) return;
    const view: SavedView = {
      id: `view-${Date.now()}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      state: currentState(),
    };
    patchPage(page.id, { views: [...(page.views ?? []), view] });
    track("salvou uma visão", view.name);
    toast.success("Visão salva");
  };

  /* ---------------- anotações ---------------- */
  const annotations = page?.annotations ?? [];
  const notesOf = (chartId: string) => annotations.filter((a) => a.chartId === chartId);

  const addNote = (chartId: string, text: string) => {
    if (!page) return;
    if (!canEdit) {
      denyRead();
      return;
    }
    const note: Annotation = {
      id: `note-${Date.now()}`,
      chartId,
      text,
      ...(user?.email ? { author: user.email } : {}),
      createdAt: new Date().toISOString(),
    };
    patchPage(page.id, { annotations: [...annotations, note] });
    track("adicionou uma anotação");
  };

  const deleteNote = (id: string) => {
    if (!page) return;
    if (!canEdit) {
      denyRead();
      return;
    }
    patchPage(page.id, { annotations: annotations.filter((a) => a.id !== id) });
    track("removeu uma anotação");
  };


  /* ---------------- histórico ---------------- */
  const restoreImport = (entry: ImportEntry) => {
    if (!page || !entry.previous) return;
    const rollback: ImportEntry = {
      id: `imp-${Date.now()}`,
      at: new Date().toISOString(),
      mode: "replace",
      filename: `Reversão para ${new Date(entry.at).toLocaleString("pt-BR")}`,
      rowCount: entry.previous.rows.length,
      previous: page.dataset,
    };
    patchPage(page.id, { dataset: entry.previous, history: [...(page.history ?? []), rollback] });
    setHistoryOpen(false);
    toast.success("Versão anterior restaurada", {
      description: `${entry.previous.rows.length.toLocaleString("pt-BR")} registros`,
    });
  };

  /* ---------------- atalhos de teclado ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = pages.findIndex((p) => p.id === activeId);
      const go = (i: number) => {
        const next = pages[(i + pages.length) % pages.length];
        if (next) setActiveId(next.id);
      };
      const k = e.key.toLowerCase();
      if (k === "p") {
        e.preventDefault();
        setPresenting((v) => !v);
      } else if (e.key === "Escape") {
        if (presenting) setPresenting(false);
        else if (cross) setCross(null);
      } else if ((e.key === "ArrowRight" || e.key === "PageDown") && pages.length) {
        e.preventDefault();
        go(idx + 1);
      } else if ((e.key === "ArrowLeft" || e.key === "PageUp") && pages.length) {
        e.preventDefault();
        go(idx - 1);
      } else if (/^[1-9]$/.test(e.key)) {
        const target = pages[Number(e.key) - 1];
        if (target) setActiveId(target.id);
      } else if (k === "f") {
        e.preventDefault();
        setFilters({});
        setCross(null);
        toast.info("Filtros limpos");
      } else if (k === "c") {
        setPanelOpen((v) => !v);
      } else if (k === "n") {
        e.preventDefault();
        setNotesFor({ id: "page", title: page?.name ?? "Página" });
      } else if (e.key === "?") {
        setShortcutsOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pages, activeId, presenting, cross, page]);


  /* ---------------- dados filtrados ---------------- */
  const allRows = dataset?.rows ?? [];
  const activeFilters = useMemo(() => Object.entries(filters).filter(([, v]) => v), [filters]);
  const baseRows = useMemo(
    () =>
      activeFilters.length
        ? allRows.filter((r) => activeFilters.every(([k, v]) => String(r[k] ?? "") === v))
        : allRows,
    [allRows, activeFilters],
  );
  const rows = useMemo(
    () => (cross ? baseRows.filter((r) => String(r[cross.field] ?? "") === cross.value) : baseRows),
    [baseRows, cross],
  );

  const alertRules = useMemo(() => page?.alerts ?? [], [page]);
  const alertHits = useMemo(() => evaluateAlerts(alertRules, rows), [alertRules, rows]);
  const criticalCount = alertHits.filter((h) => h.rule.severity === "critical").length;
  const notifiedRef = useRef<string>("");
  const pageRef = useRef(page);
  pageRef.current = page;
  const prefsRef = useRef(notifyPrefs);
  prefsRef.current = notifyPrefs;
  useEffect(() => {
    const key = `${activeId}:${alertHits.map((h) => `${h.rule.id}=${h.count}`).join("|")}`;
    if (!alertHits.length || notifiedRef.current === key) {
      if (!alertHits.length) notifiedRef.current = key;
      return;
    }
    notifiedRef.current = key;
    const first = alertHits[0];
    if (!first) return;
    playWarning();
    toast.warning(`${alertHits.length} não conformidade(s) detectada(s)`, {
      description: `${first.rule.name} · ${first.count.toLocaleString("pt-BR")} registros`,
      action: { label: "Ver", onClick: () => setAlertsOpen(true) },
    });

    const current = pageRef.current;
    if (!current) return;
    const created = buildAlertEvents(alertHits, current.alertLog ?? []);
    if (!created.length) return;
    patchPage(current.id, { alertLog: [...created, ...(current.alertLog ?? [])].slice(0, 200) });

    const prefs = prefsRef.current;
    if (!prefs?.enabled) return;
    for (const ev of created) {
      if (prefs.rule_ids.length && !prefs.rule_ids.includes(ev.ruleId)) continue;
      void dispatchAlertNotification({
        data: {
          pageName: current.name,
          ruleName: ev.ruleName,
          description: ev.description,
          severity: ev.severity,
          count: ev.count,
          total: ev.total,
          at: ev.at,
        },
      }).catch(() => undefined);
    }
  }, [alertHits, activeId]);

  useEffect(() => {
    if (!user) {
      setNotifyPrefs(null);
      return;
    }
    void getNotifyPrefs(user.id)
      .then(setNotifyPrefs)
      .catch(() => setNotifyPrefs(null));
  }, [user]);

  const fieldNames = useMemo(() => (dataset?.fields ?? []).map((f) => f.name), [dataset]);
  const visibleCols = useMemo(() => fieldNames.filter((n) => !hiddenCols.includes(n)), [fieldNames, hiddenCols]);
  const visibleCharts = useMemo(
    () =>
      (dashboard?.charts ?? []).filter(
        (c) => !hiddenCols.includes(c.dimension) && (!c.measure || !hiddenCols.includes(c.measure)),
      ),
    [dashboard, hiddenCols],
  );
  const cols = orientation === "landscape" ? "lg:grid-cols-6" : "lg:grid-cols-4";
  const shell = orientation === "landscape" ? "max-w-[1800px]" : "max-w-[980px]";

  const kpiCards = useMemo(
    () =>
      (dashboard?.kpis ?? []).map((k, i) => ({
        ...k,
        value: aggregateKpi(rows, k.field, k.agg, { field: k.filterField, value: k.filterValue }),
        accent: ACCENTS[i % ACCENTS.length] as string,
      })),
    [dashboard, rows],
  );

  const handleChartSelect = (spec: ChartSpec, value: string) => {
    const isSame = cross?.field === spec.dimension && cross?.value === value;
    setCross(isSame ? null : { field: spec.dimension, value });
    if (spec.drillType) {
      const scoped = baseRows.filter((r) => String(r[spec.dimension] ?? "") === value);
      setDrill({
        label: `${spec.dimension}: ${value}`,
        rows: scoped,
        spec: {
          ...spec,
          id: `${spec.id}-drill`,
          type: spec.drillType,
          dimension: spec.drillDimension ?? spec.dimension,
          drillType: null,
          drillDimension: null,
          title: `Detalhe de ${value}`,
        },
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" theme={theme} />

      <header
        className={`no-print sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl ${
          presenting ? "hidden" : ""
        }`}
      >
        <div className={`mx-auto flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-border/40 ${shell}`}>
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/15 panel-glow-blue">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div className="leading-tight">
              <p className="label-eyebrow">Business Intelligence</p>
              <h1 className="font-display text-base font-semibold tracking-wide">
                {dashboard?.title ?? page?.name ?? "NEXUS BI · Análise Inteligente"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {role && (
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wide ${
                  role === "viewer"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                    : "border-primary/40 bg-primary/10 text-primary"
                }`}
              >
                {role === "owner" ? "Dono" : role === "editor" ? "Edição" : "Somente leitura"}
              </span>
            )}

            {/* Menu Dropdown de Utilitários & Ajustes Rápidos */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium border-border/60 bg-background/50 hover:bg-accent">
                  <Settings className="size-3.5 text-primary" />
                  <span className="hidden sm:inline">Ajustes & Ferramentas</span>
                  {reminders.filter(r => r.pageId === page?.id && !r.completed).length > 0 && (
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Ajustes da Interface</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    setAudioEnabled(next);
                    if (next) playChime();
                  }}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {soundOn ? <Volume2 className="size-4 text-primary" /> : <VolumeX className="size-4 text-muted-foreground" />}
                    <span>Efeitos Sonoros</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{soundOn ? "ON" : "OFF"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
                  className="cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-indigo-400" />}
                    <span>Modo de Exibição</span>
                  </div>
                  <span className="text-[10px] capitalize text-muted-foreground">{theme === "dark" ? "Escuro" : "Claro"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Ferramentas Rápidas</DropdownMenuLabel>

                <DropdownMenuItem onClick={() => setRemindersOpen(true)} className="cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="size-4 text-primary" />
                    <span>Lembretes & Agenda</span>
                  </div>
                  {reminders.filter(r => r.pageId === page?.id && !r.completed).length > 0 && (
                    <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[10px] font-semibold">
                      {reminders.filter(r => r.pageId === page?.id && !r.completed).length}
                    </span>
                  )}
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setHistoryOpen(true)} className="cursor-pointer gap-2">
                  <History className="size-4 text-muted-foreground" />
                  <span>Histórico de Dados</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setShortcutsOpen(true)} className="cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="size-4 text-muted-foreground" />
                    <span>Atalhos do Teclado</span>
                  </div>
                  <span className="text-[10px] font-mono bg-muted px-1 rounded text-muted-foreground">?</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
                  <ShieldCheck className="size-4" /> Acessos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title={user.email ?? "Conta"}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    toast.success("Sessão encerrada");
                  }}
                >
                  <LogOut className="size-4" /> Sair
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => { window.location.href = "/auth"; }}>
                <LogIn className="size-4" /> Entrar
              </Button>
            )}
          </div>
        </div>

        {/* Tab-based Ribbon Menu (PowerBI style) */}
        {dashboard && (
          <Tabs defaultValue="inicio" className="w-full border-b border-border/40 bg-secondary/15">
            <div className={`mx-auto flex flex-wrap items-center justify-between px-5 ${shell}`}>
              <TabsList className="bg-transparent border-none p-0 h-10 gap-1">
                <TabsTrigger value="inicio" className="text-xs h-10 border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Página Inicial
                </TabsTrigger>
                <TabsTrigger value="visualizacoes" className="text-xs h-10 border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Visualizações e Cards
                </TabsTrigger>
                <TabsTrigger value="alertas" className="text-xs h-10 border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Filtros e Alertas
                </TabsTrigger>
                <TabsTrigger value="colaboracao" className="text-xs h-10 border-b-2 border-transparent rounded-none data-[state=active]:border-primary data-[state=active]:bg-transparent">
                  Compartilhar e Ajuda
                </TabsTrigger>
              </TabsList>

              <div className="flex rounded-md bg-secondary/80 p-0.5 border border-border/50 scale-90">
                <button
                  onClick={() => setOrientation("landscape")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors ${
                    orientation === "landscape" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <Monitor className="size-3" /> Paisagem
                </button>
                <button
                  onClick={() => setOrientation("portrait")}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors ${
                    orientation === "portrait" ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  <Smartphone className="size-3" /> Retrato
                </button>
              </div>
            </div>

            <div className="bg-background/40 py-2 border-t border-border/30">
              <div className={`mx-auto px-5 ${shell}`}>
                <TabsContent value="inicio" className="mt-0 flex flex-wrap items-center gap-1.5">
                  <Button variant="secondary" size="sm" onClick={() => {
                    modeRef.current = "replace";
                    inputRef.current?.click();
                  }}>
                    <Upload className="size-3.5" /> Nova página
                  </Button>
                  
                  {dataset && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => {
                        modeRef.current = "append";
                        inputRef.current?.click();
                      }}>
                        <Layers className="size-3.5" /> Acrescentar dados
                      </Button>
                      
                      <Button variant="secondary" size="sm" onClick={() => setMergeOpen(true)}>
                        <Layers className="size-3.5" /> Mesclar dados (JOIN)
                      </Button>
                    </>
                  )}
                  
                  <div className="h-6 w-px bg-border/85 mx-1" />
                  
                  <Button variant={panelOpen ? "default" : "secondary"} size="sm" onClick={() => setPanelOpen((v) => !v)}>
                    <SlidersHorizontal className="size-3.5" /> Campos lateral
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setPresenting(true)}>
                    <Play className="size-3.5" /> Apresentar (F11)
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => window.print()}>
                    <Printer className="size-3.5" /> Imprimir
                  </Button>
                </TabsContent>

                <TabsContent value="visualizacoes" className="mt-0 flex flex-wrap items-center gap-1.5">
                  {canEdit && (
                    <Button variant="secondary" size="sm" onClick={addChart}>
                      <Plus className="size-3.5" /> Novo Gráfico
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (dashboard.kpis?.length) {
                        setEditingKpi(dashboard.kpis[0]!);
                        setKpiEditorOpen(true);
                      } else {
                        toast.info("Nenhum KPI para editar. Crie um indicador usando o botão '+' na seção de KPI.");
                      }
                    }}
                  >
                    <Pencil className="size-3.5" /> Editar Cards de KPI
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => page && dataset && canEdit && analyze(page.id, dataset)}
                    disabled={!!loading || !canEdit}
                  >
                    <RefreshCw className="size-3.5" /> Reanalisar base com IA
                  </Button>
                </TabsContent>

                <TabsContent value="alertas" className="mt-0 flex flex-wrap items-center gap-1.5">
                  <Button
                    variant={criticalCount ? "destructive" : "secondary"}
                    size="sm"
                    onClick={() => setAlertsOpen(true)}
                  >
                    <Bell className="size-3.5" /> Regras de Alertas
                    {alertHits.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-background/30 px-1.5 py-0.5 text-[10px]">{alertHits.length}</span>
                    )}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => {
                    setFilters({});
                    setCross(null);
                    toast.info("Filtros limpos");
                  }}>
                    <Filter className="size-3.5" /> Limpar filtros (F)
                  </Button>
                  
                  <div className="h-6 w-px bg-border/85 mx-1" />
                  
                  <ViewsMenu
                    views={page?.views ?? []}
                    onSave={saveView}
                    onApply={applyView}
                    onDelete={(id) =>
                      page && patchPage(page.id, { views: (page.views ?? []).filter((v) => v.id !== id) })
                    }
                    onShare={() => void copyLink(currentState())}
                    onShareView={(v) => void copyLink({ ...v.state, ...(page ? { pageName: page.name } : {}) })}
                  />
                </TabsContent>

                <TabsContent value="colaboracao" className="mt-0 flex flex-wrap items-center gap-1.5">
                  {page && (
                    <Button variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
                      <Share2 className="size-3.5" /> Compartilhar página
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setNotesFor({ id: "page", title: page?.name ?? "Página" })}
                  >
                    <MessageSquare className="size-3.5" /> Anotações (N)
                    {annotations.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px]">{annotations.length}</span>
                    )}
                  </Button>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        )}

        {pages.length > 0 && (
          <div className={`mx-auto flex flex-wrap items-center gap-2 px-5 py-2.5 ${shell}`}>
            <PageTabs
              pages={pages}
              activeId={activeId}
              onSelect={setActiveId}
              onRename={(id, name) => patchPage(id, { name, icon: pickIcon(name) })}
              onRemove={(id) => {
                setPages((ps) => {
                  const next = ps.filter((p) => p.id !== id);
                  if (id === activeId) setActiveId(next[0]?.id ?? null);
                  if (!next.length) localStorage.removeItem(STORAGE_KEY);
                  return next;
                });
              }}
              onAdd={() => {
                modeRef.current = "replace";
                inputRef.current?.click();
              }}
            />
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf,.txt"
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </header>

      {presenting && (
        <div className="no-print sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-5 py-2 text-xs backdrop-blur-xl">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="label-eyebrow">Apresentação</span>
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`rounded-md px-2 py-1 ${
                  p.id === activeId ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {i + 1}. {p.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="hidden md:inline">← → páginas · 1-9 ir · F limpar filtros · Esc sair</span>
            <Button size="sm" variant="secondary" onClick={() => setPresenting(false)}>
              <X className="size-3.5" /> Sair
            </Button>
          </div>
        </div>
      )}

      <main className={`mx-auto px-5 py-6 ${shell}`}>

        {loading && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
            <Loader2 className="size-4 animate-spin text-primary" />
            {loading}
          </div>
        )}

        {!dashboard && !loading && (
          <EmptyState
            onPick={() => {
              modeRef.current = "replace";
              inputRef.current?.click();
            }}
            onDrop={(f) => {
              modeRef.current = "replace";
              void handleFiles(f);
            }}
          />
        )}

        {dashboard && (
          <div className="flex items-start gap-4">
            {panelOpen && dataset && (
              <div className="sticky top-20 hidden lg:block">
                <FieldPanel
                  fields={dataset.fields}
                  rows={allRows}
                  visible={visibleCols}
                  onToggleVisible={(name) =>
                    setHiddenCols((h) => (h.includes(name) ? h.filter((n) => n !== name) : [...h, name]))
                  }
                  filters={filters}
                  onFilter={(name, value) =>
                    setFilters((f) => {
                      const next = { ...f };
                      if (value === null) delete next[name];
                      else next[name] = value;
                      return next;
                    })
                  }
                  onCreate={(spec) => {
                    upsertChart(spec);
                    toast.success("Análise criada");
                  }}
                  onClose={() => setPanelOpen(false)}
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {cross && (
                <div className="no-print mb-3 flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1">
                    <Filter className="size-3 text-primary" />
                    {cross.field}: <strong className="font-semibold">{cross.value}</strong>
                    <button onClick={() => setCross(null)} aria-label="Limpar filtro cruzado">
                      <X className="size-3" />
                    </button>
                  </span>
                  <span className="text-muted-foreground">filtro cruzado aplicado a todos os visuais</span>
                </div>
              )}

              <section
                className={`grid grid-cols-2 gap-3 ${
                  orientation === "landscape" ? "lg:grid-cols-5" : "lg:grid-cols-3"
                }`}
              >
                {kpiCards.map((k) => (
                  <div key={k.id} className="panel relative overflow-hidden px-4 py-3 group">
                    <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: `var(--${k.accent})` }} />
                    <p className="label-eyebrow" style={{ color: `var(--${k.accent})` }}>
                      {k.label}
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold tabular-nums truncate">{formatKpiValue(k.value, k.format)}</p>
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingKpi(k);
                          setKpiEditorOpen(true);
                        }}
                        className="absolute right-2 top-2 no-print rounded p-1 text-muted-foreground opacity-70 hover:bg-accent hover:text-primary group-hover:opacity-100 transition"
                        title="Editar card"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {canEdit && (
                  <button
                    onClick={() => {
                      const newKpi: KpiSpec = {
                        id: `kpi-${Date.now()}`,
                        label: "Novo Indicador",
                        field: null,
                        agg: "count",
                        format: "compact",
                      };
                      setEditingKpi(newKpi);
                      setKpiEditorOpen(true);
                    }}
                    className="panel border-dashed border-2 hover:border-primary/50 hover:bg-secondary/15 transition flex items-center justify-center gap-1.5 text-muted-foreground text-xs font-semibold py-3"
                  >
                    <Plus className="size-4" /> Adicionar Card
                  </button>
                )}
              </section>

              <section className={`mt-4 grid grid-cols-1 gap-4 ${cols}`}>
                {visibleCharts.map((c, idx) => (
                  <article
                    key={c.id}
                    id={c.id}
                    draggable
                    onDragStart={() => (dragIndex.current = idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragIndex.current !== null) reorderCharts(dragIndex.current, idx);
                      dragIndex.current = null;
                    }}
                    className="panel group relative flex flex-col p-4"
                    style={{
                      gridColumn: `span ${Math.min(Math.max(c.span ?? 2, 2), orientation === "landscape" ? 6 : 4)} / span ${Math.min(
                        Math.max(c.span ?? 2, 2),
                        orientation === "landscape" ? 6 : 4,
                      )}`,
                      minHeight: 300,
                    }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="no-print size-3.5 cursor-grab text-muted-foreground opacity-0 transition group-hover:opacity-70" />
                        <span
                          className="size-1.5 rounded-full"
                          style={{ background: `var(--${ACCENTS[(c.palette ?? 0) % ACCENTS.length]})` }}
                        />
                        <h2 className="label-eyebrow !text-foreground">{c.title}</h2>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setNotesFor({ id: c.id, title: c.title })}
                          className={`no-print flex items-center gap-1 rounded-md p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground ${
                            notesOf(c.id).length ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100"
                          }`}
                          aria-label="Anotações do gráfico"
                        >
                          <MessageSquare className="size-3.5" />
                          {notesOf(c.id).length > 0 && (
                            <span className="text-[10px] tabular-nums">{notesOf(c.id).length}</span>
                          )}
                        </button>
                        <button
                          onClick={() => setEditing(c)}
                          className="no-print flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground opacity-70 transition hover:bg-accent hover:text-primary hover:opacity-100"
                          title="Editar gráfico"
                          aria-label="Editar gráfico"
                        >
                          <Pencil className="size-3" />
                          <span className="text-[10px] font-medium hidden sm:inline">Editar</span>
                        </button>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1">
                      <ChartRenderer
                        spec={c}
                        rows={cross && cross.field === c.dimension ? baseRows : rows}
                        onSelect={(v) => handleChartSelect(c, v)}
                        active={cross && cross.field === c.dimension ? cross.value : null}
                      />
                    </div>
                    {notesOf(c.id).length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
                        {notesOf(c.id)
                          .slice(-2)
                          .map((n) => (
                            <li key={n.id} className="line-clamp-2">
                              • {n.text}
                            </li>
                          ))}
                      </ul>
                    )}
                  </article>

                ))}
              </section>

              {dashboard.insights.length > 0 && (
                <section className="panel mt-4 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="size-4 text-primary" />
                    <h2 className="label-eyebrow !text-foreground">Insights da IA</h2>
                  </div>
                  <ul className="grid gap-2 md:grid-cols-2">
                    {dashboard.insights.map((i, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <footer className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="size-3.5" />
                {dataset?.name} · {rows.length.toLocaleString("pt-BR")} registros · {dataset?.fields.length} colunas
                {dataset?.sources && dataset.sources.length > 1 && ` · fontes: ${dataset.sources.join(", ")}`}
              </footer>
            </div>
          </div>
        )}
      </main>

      <ChartEditor
        spec={editing}
        fields={dataset?.fields ?? []}
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        onSave={upsertChart}
        onDelete={removeChart}
      />

      <DrillDialog
        spec={drill?.spec ?? null}
        rows={drill?.rows ?? []}
        label={drill?.label ?? null}
        onOpenChange={(v) => !v && setDrill(null)}
      />

      <NotesDialog
        open={!!notesFor}
        title={notesFor?.title ?? ""}
        notes={notesFor ? notesOf(notesFor.id) : []}
        onOpenChange={(v) => !v && setNotesFor(null)}
        onAdd={(text) => notesFor && addNote(notesFor.id, text)}
        onDelete={deleteNote}
      />

      <HistoryDialog
        open={historyOpen}
        entries={page?.history ?? []}
        onOpenChange={setHistoryOpen}
        onRestore={restoreImport}
      />

      <AlertsDialog
        open={alertsOpen}
        fields={dataset?.fields ?? []}
        rules={alertRules}
        hits={alertHits}
        events={page?.alertLog ?? []}
        prefs={notifyPrefs}
        canEdit={canEdit}
        onOpenChange={setAlertsOpen}
        onChange={(next: AlertRule[]) => {
          if (!page) return;
          patchPage(page.id, { alerts: next });
          track("atualizou alertas", page.name);
        }}
        onEventsChange={(next: AlertEvent[]) => {
          if (!page) return;
          patchPage(page.id, { alertLog: next });
        }}
        onPrefsChange={(next) => {
          setNotifyPrefs(next);
          if (user) void saveNotifyPrefs(user.id, next).catch(() => undefined);
        }}
      />

      <MergeDatasetsDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        pages={pages}
        activePage={page}
        onMerge={handleMergeDatasets}
      />

      <KpiEditorDialog
        open={kpiEditorOpen}
        onOpenChange={setKpiEditorOpen}
        kpi={editingKpi}
        fields={dataset?.fields ?? []}
        onSave={handleSaveKpi}
        onDelete={handleDeleteKpi}
      />

      <RemindersDialog
        open={remindersOpen}
        onOpenChange={setRemindersOpen}
        page={page}
        reminders={reminders}
        onAdd={handleAddReminder}
        onToggleComplete={handleToggleReminderComplete}
        onDelete={handleDeleteReminder}
      />

      {user && (
        <ShareDialog
          open={shareOpen}
          pageId={page?.id ?? null}
          pageName={page?.name ?? "Página"}
          role={role}
          published={!!page?.cloud}
          userId={user.id}
          onOpenChange={setShareOpen}
          onPublish={publishCurrent}
        />
      )}


      <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Keyboard className="size-4" /> Atalhos de teclado
            </DialogTitle>
          </DialogHeader>
          <ul className="space-y-1.5 text-sm">
            {[
              ["P", "Entrar/sair do modo apresentação"],
              ["← / →", "Página anterior / próxima"],
              ["1 – 9", "Ir direto para a página"],
              ["F", "Limpar todos os filtros"],
              ["C", "Mostrar/ocultar painel de campos"],
              ["N", "Nova anotação da página"],
              ["Esc", "Sair da apresentação / limpar filtro cruzado"],
              ["?", "Abrir esta lista"],
            ].map(([k, d]) => (
              <li key={k} className="flex items-center justify-between gap-3">
                <kbd className="rounded border border-border bg-secondary px-2 py-0.5 text-xs">{k}</kbd>
                <span className="text-muted-foreground">{d}</span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>

  );
}

function EmptyState({ onPick, onDrop }: { onPick: () => void; onDrop: (files: FileList | null) => void }) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void onDrop(e.dataTransfer.files);
      }}
      className={`grid-backdrop panel flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center transition ${
        over ? "panel-glow-blue" : ""
      }`}
    >
      <div className="grid size-16 place-items-center rounded-2xl bg-primary/15 panel-glow-blue">
        <Upload className="size-7 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-wide">Importe seus dados</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Arraste um arquivo CSV, XLSX ou PDF aqui. Cada base vira uma página com menu e ícone automáticos, e a IA monta
          o dashboard sozinha.
        </p>
      </div>
      <Button size="lg" onClick={onPick}>
        <Upload className="size-4" /> Selecionar arquivo
      </Button>
      <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
        {["CSV", "XLSX", "XLS", "PDF"].map((f) => (
          <span key={f} className="rounded-full border border-border px-3 py-1">
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}
