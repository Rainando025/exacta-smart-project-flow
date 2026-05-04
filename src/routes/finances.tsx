import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown, Wallet,
  ArrowUpRight, ArrowDownRight, Filter, Search, BarChart3, Download,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/exacta";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/finances")({ component: FinancesPage });

interface Finance {
  id: string; title: string; amount: number; type: string;
  category: string; date: string; notes: string | null; created_at: string;
}

const CATEGORIES = [
  "alimentação","transporte","moradia","saúde","educação",
  "lazer","salário","freelance","investimento","outros",
];

const PIE_COLORS = [
  "#0891b2","#059669","#d97706","#dc2626","#7c3aed",
  "#db2777","#1e3a8a","#475569","#f59e0b","#10b981",
];

function FinancesPage() {
  return <AppShell><FinancesContent /></AppShell>;
}

// helpers
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getDefaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function FinancesContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Finance[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Finance | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("despesa");
  const [category, setCategory] = useState("outros");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Report filters
  const [reportMode, setReportMode] = useState<"month" | "range">("month");
  const [reportMonth, setReportMonth] = useState(getDefaultMonth);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("personal_finances").select("*").eq("user_id", user.id)
      .order("date", { ascending: false });
    setItems((data || []) as Finance[]);
  };

  useEffect(() => { load(); }, [user?.id]);

  const resetForm = () => {
    setTitle(""); setAmount(""); setType("despesa"); setCategory("outros");
    setDate(new Date().toISOString().split("T")[0]); setNotes(""); setEditing(null);
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !amount) return;
    const payload = {
      user_id: user.id, title: title.trim(), amount: parseFloat(amount),
      type, category, date, notes: notes.trim() || null,
    };
    if (editing) {
      const { error } = await supabase.from("personal_finances").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Registro atualizado!");
    } else {
      const { error } = await supabase.from("personal_finances").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("Registro adicionado!");
    }
    resetForm(); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("personal_finances").delete().eq("id", id);
    toast.success("Removido!"); load();
  };

  const openEdit = (f: Finance) => {
    setEditing(f); setTitle(f.title); setAmount(String(f.amount));
    setType(f.type); setCategory(f.category); setDate(f.date); setNotes(f.notes || ""); setOpen(true);
  };

  const filtered = items.filter((f) => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (filterCat !== "all" && f.category !== filterCat) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Items filtered by report period
  const reportItems = useMemo(() => {
    if (reportMode === "month") {
      return items.filter((f) => f.date.startsWith(reportMonth));
    }
    return items.filter((f) => {
      if (reportFrom && f.date < reportFrom) return false;
      if (reportTo && f.date > reportTo) return false;
      return true;
    });
  }, [items, reportMode, reportMonth, reportFrom, reportTo]);

  const totalReceita = items.filter((f) => f.type === "receita").reduce((s, f) => s + Number(f.amount), 0);
  const totalDespesa = items.filter((f) => f.type === "despesa").reduce((s, f) => s + Number(f.amount), 0);
  const saldo = totalReceita - totalDespesa;

  // ---- Chart data (based on reportItems) ----
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; receita: number; despesa: number }> = {};
    reportItems.forEach((f) => {
      const m = f.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, receita: 0, despesa: 0 };
      if (f.type === "receita") map[m].receita += Number(f.amount);
      else map[m].despesa += Number(f.amount);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12).map((d) => ({
      ...d,
      saldo: d.receita - d.despesa,
      label: new Date(d.month + "-15").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    }));
  }, [reportItems]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    reportItems.filter((f) => f.type === "despesa").forEach((f) => {
      map[f.category] = (map[f.category] || 0) + Number(f.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportItems]);

  const categoryIncomeData = useMemo(() => {
    const map: Record<string, number> = {};
    reportItems.filter((f) => f.type === "receita").forEach((f) => {
      map[f.category] = (map[f.category] || 0) + Number(f.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportItems]);

  const reportTotalReceita = reportItems.filter((f) => f.type === "receita").reduce((s, f) => s + Number(f.amount), 0);
  const reportTotalDespesa = reportItems.filter((f) => f.type === "despesa").reduce((s, f) => s + Number(f.amount), 0);
  const reportSaldo = reportTotalReceita - reportTotalDespesa;

  // PDF Export
  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const periodLabel = reportMode === "month"
      ? new Date(reportMonth + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : `${reportFrom || "início"} a ${reportTo || "hoje"}`;

    doc.setFontSize(18);
    doc.text("Relatório de Finanças Pessoais", 14, 20);
    doc.setFontSize(11);
    doc.text(`Período: ${periodLabel}`, 14, 28);

    // Summary
    doc.setFontSize(12);
    doc.text(`Receitas: ${fmt(reportTotalReceita)}`, 14, 40);
    doc.text(`Despesas: ${fmt(reportTotalDespesa)}`, 14, 48);
    doc.text(`Saldo: ${fmt(reportSaldo)}`, 14, 56);

    // Table
    const rows = reportItems.map((f) => [
      f.date, f.title, f.category, f.type === "receita" ? "Receita" : "Despesa",
      fmt(Number(f.amount)),
    ]);

    autoTable(doc, {
      startY: 65,
      head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    // Category breakdown
    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    if (categoryData.length > 0 && finalY + 30 < 270) {
      doc.setFontSize(12);
      doc.text("Despesas por Categoria", 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 16,
        head: [["Categoria", "Total"]],
        body: categoryData.map((c) => [c.name, fmt(c.value)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [220, 38, 38] },
      });
    }

    doc.save(`financas-${reportMode === "month" ? reportMonth : "periodo"}.pdf`);
    toast.success("PDF exportado!");
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-accent font-medium uppercase tracking-wider">Modo Pessoal</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-1">Finanças</h1>
          <p className="text-muted-foreground mt-1">Controle suas receitas e despesas pessoais.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary text-primary-foreground shadow-elegant">
              <Plus className="h-4 w-4 mr-2" /> Novo registro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar registro" : "Novo registro"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Descrição</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Almoço, Salário..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Categoria</Label>
                  <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground">
                {editing ? "Salvar alterações" : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 shadow-card border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-br from-success/15 to-success/5 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><ArrowUpRight className="h-5 w-5 text-success" /></div>
            <div><p className="text-xs text-muted-foreground">Receitas</p><p className="text-xl font-display font-bold text-success">{fmt(totalReceita)}</p></div>
          </div>
        </Card>
        <Card className="p-5 shadow-card border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-br from-destructive/15 to-destructive/5 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><ArrowDownRight className="h-5 w-5 text-destructive" /></div>
            <div><p className="text-xs text-muted-foreground">Despesas</p><p className="text-xl font-display font-bold text-destructive">{fmt(totalDespesa)}</p></div>
          </div>
        </Card>
        <Card className="p-5 shadow-card border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-br from-accent/15 to-accent/5 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Wallet className="h-5 w-5 text-accent" /></div>
            <div><p className="text-xs text-muted-foreground">Saldo</p><p className={`text-xl font-display font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldo)}</p></div>
          </div>
        </Card>
      </div>

      {/* Tabs: Lista / Relatório */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list"><Search className="h-4 w-4 mr-1.5" />Lista</TabsTrigger>
          <TabsTrigger value="report"><BarChart3 className="h-4 w-4 mr-1.5" />Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="receita">Receitas</SelectItem><SelectItem value="despesa">Despesas</SelectItem></SelectContent>
            </Select>
            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold">Descrição</th>
                  <th className="text-left px-4 py-3 font-semibold">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor</th>
                  <th className="text-right px-4 py-3 font-semibold w-24">Ações</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</td></tr>}
                  {filtered.map((f) => (
                    <tr key={f.id} className="hover:bg-muted/30 transition">
                      <td className="px-4 py-3"><div className="flex items-center gap-2">
                        {f.type === "receita" ? <TrendingUp className="h-4 w-4 text-success shrink-0" /> : <TrendingDown className="h-4 w-4 text-destructive shrink-0" />}
                        <span className="font-medium">{f.title}</span>
                      </div></td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{f.category}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(f.date)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${f.type === "receita" ? "text-success" : "text-destructive"}`}>
                        {f.type === "receita" ? "+" : "-"}{fmt(Number(f.amount))}
                      </td>
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded hover:bg-muted" title="Editar"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          {/* Period filter + export */}
          <Card className="p-4 shadow-card border-0">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Filtro</Label>
                <Select value={reportMode} onValueChange={(v) => setReportMode(v as "month" | "range")}>
                  <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mês</SelectItem>
                    <SelectItem value="range">Intervalo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {reportMode === "month" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Mês</Label>
                  <Input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="w-[180px] h-9" />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">De</Label>
                    <Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="w-[160px] h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Até</Label>
                    <Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="w-[160px] h-9" />
                  </div>
                </>
              )}
              <div className="ml-auto flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="text-success font-semibold">{fmt(reportTotalReceita)}</span>
                  {" · "}
                  <span className="text-destructive font-semibold">{fmt(reportTotalDespesa)}</span>
                  {" · Saldo "}
                  <span className={reportSaldo >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>{fmt(reportSaldo)}</span>
                </p>
                <Button size="sm" variant="outline" onClick={exportPDF}>
                  <Download className="h-4 w-4 mr-1.5" /> PDF
                </Button>
              </div>
            </div>
          </Card>

          {/* Monthly bar chart */}
          <Card className="p-6 shadow-card">
            <h3 className="font-display font-bold text-lg mb-4">Receitas vs Despesas por Mês</h3>
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sem dados suficientes para gráfico.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="receita" name="Receitas" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Saldo evolution */}
          <Card className="p-6 shadow-card">
            <h3 className="font-display font-bold text-lg mb-4">Evolução do Saldo</h3>
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Category pie charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-card">
              <h3 className="font-display font-bold text-lg mb-4">Despesas por Categoria</h3>
              {categoryData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Sem despesas.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(props: any) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="p-6 shadow-card">
              <h3 className="font-display font-bold text-lg mb-4">Receitas por Categoria</h3>
              {categoryIncomeData.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">Sem receitas.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryIncomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(props: any) => `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {categoryIncomeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
