import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useMemo, useState, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Trash2, Pencil, TrendingUp, TrendingDown, Wallet,
  ArrowUpRight, ArrowDownRight, Filter, Search, BarChart3, Download,
  CreditCard, Repeat, Check, X, AlertTriangle,
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
  recurring: string; due_date: string | null; is_credit_card: boolean;
  installments: number; installment_number: number; parent_id: string | null;
  paid: boolean;
}

const CATEGORIES = [
  "alimentação","transporte","moradia","saúde","educação",
  "lazer","salário","freelance","investimento","outros",
];
const RECURRING_OPTIONS = [
  { value: "none", label: "Não recorrente" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
];
const PIE_COLORS = [
  "#0891b2","#059669","#d97706","#dc2626","#7c3aed",
  "#db2777","#1e3a8a","#475569","#f59e0b","#10b981",
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getDefaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(dateStr: string, months: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

function FinancesPage() {
  return <AppShell><FinancesContent /></AppShell>;
}

function FinancesContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Finance[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Finance | null>(null);
  const [editingInlineId, setEditingInlineId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("despesa");
  const [category, setCategory] = useState("outros");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [dueDate, setDueDate] = useState("");
  const [isCreditCard, setIsCreditCard] = useState(false);
  const [installments, setInstallments] = useState("1");

  // Report filters
  const [reportMode, setReportMode] = useState<"month" | "range">("month");
  const [reportMonth, setReportMonth] = useState(getDefaultMonth);
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  // Inline edit state
  const [inlineTitle, setInlineTitle] = useState("");
  const [inlineAmount, setInlineAmount] = useState("");
  const [inlineCategory, setInlineCategory] = useState("");
  const [inlineDate, setInlineDate] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("personal_finances").select("*").eq("user_id", user.id)
      .order("date", { ascending: false });
    setItems((data || []) as Finance[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setTitle(""); setAmount(""); setType("despesa"); setCategory("outros");
    setDate(new Date().toISOString().split("T")[0]); setNotes(""); setEditing(null);
    setRecurring("none"); setDueDate(""); setIsCreditCard(false); setInstallments("1");
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !amount) return;
    const amountNum = parseFloat(amount);

    if (editing) {
      const payload = {
        title: title.trim(), amount: amountNum, type, category, date,
        notes: notes.trim() || null, recurring, due_date: dueDate || null,
        is_credit_card: isCreditCard, installments: isCreditCard ? parseInt(installments) : 1,
      };
      const { error } = await supabase.from("personal_finances").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Registro atualizado!");
    } else {
      // Credit card with installments
      if (isCreditCard && parseInt(installments) > 1) {
        const totalInstallments = parseInt(installments);
        const installmentAmount = Math.round((amountNum / totalInstallments) * 100) / 100;
        // Create parent
        const { data: parent, error } = await supabase.from("personal_finances").insert({
          user_id: user.id, title: `${title.trim()} (1/${totalInstallments})`,
          amount: installmentAmount, type: "despesa", category, date,
          notes: notes.trim() || null, recurring: "none",
          due_date: dueDate || null, is_credit_card: true,
          installments: totalInstallments, installment_number: 1, paid: false,
        }).select("id").single();
        if (error) { toast.error(error.message); return; }
        // Create remaining installments
        const childRows = [];
        for (let i = 2; i <= totalInstallments; i++) {
          const installDate = addMonths(date, i - 1);
          childRows.push({
            user_id: user.id,
            title: `${title.trim()} (${i}/${totalInstallments})`,
            amount: installmentAmount, type: "despesa", category,
            date: installDate, notes: notes.trim() || null,
            recurring: "none", due_date: dueDate ? addMonths(dueDate, i - 1) : null,
            is_credit_card: true, installments: totalInstallments,
            installment_number: i, parent_id: parent?.id || null, paid: false,
          });
        }
        if (childRows.length > 0) {
          const { error: e2 } = await supabase.from("personal_finances").insert(childRows);
          if (e2) { toast.error(e2.message); return; }
        }
        toast.success(`${totalInstallments} parcelas criadas!`);
      } else {
        const { error } = await supabase.from("personal_finances").insert({
          user_id: user.id, title: title.trim(), amount: amountNum, type, category, date,
          notes: notes.trim() || null, recurring,
          due_date: dueDate || null, is_credit_card: false,
          installments: 1, installment_number: 1, paid: false,
        });
        if (error) { toast.error(error.message); return; }
        toast.success("Registro adicionado!");
      }
    }
    resetForm(); setOpen(false); load();
  };

  const handleDelete = async (id: string) => {
    // Delete children if parent
    await supabase.from("personal_finances").delete().eq("parent_id", id);
    await supabase.from("personal_finances").delete().eq("id", id);
    toast.success("Removido!"); load();
  };

  const togglePaid = async (f: Finance) => {
    await supabase.from("personal_finances").update({ paid: !f.paid }).eq("id", f.id);
    load();
  };

  const openEdit = (f: Finance) => {
    setEditing(f); setTitle(f.title); setAmount(String(f.amount));
    setType(f.type); setCategory(f.category); setDate(f.date); setNotes(f.notes || "");
    setRecurring(f.recurring); setDueDate(f.due_date || "");
    setIsCreditCard(f.is_credit_card); setInstallments(String(f.installments));
    setOpen(true);
  };

  const startInlineEdit = (f: Finance) => {
    setEditingInlineId(f.id);
    setInlineTitle(f.title);
    setInlineAmount(String(f.amount));
    setInlineCategory(f.category);
    setInlineDate(f.date);
  };

  const saveInlineEdit = async (id: string) => {
    const { error } = await supabase.from("personal_finances").update({
      title: inlineTitle.trim(), amount: parseFloat(inlineAmount),
      category: inlineCategory, date: inlineDate,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setEditingInlineId(null);
    load();
  };

  const filtered = items.filter((f) => {
    if (filterType !== "all" && f.type !== filterType) return false;
    if (filterCat !== "all" && f.category !== filterCat) return false;
    if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalReceita = items.filter((f) => f.type === "receita").reduce((s, f) => s + Number(f.amount), 0);
  const totalDespesa = items.filter((f) => f.type === "despesa").reduce((s, f) => s + Number(f.amount), 0);
  const saldo = totalReceita - totalDespesa;

  // Credit card invoice for current month
  const currentMonth = getDefaultMonth();
  const ccInvoice = useMemo(() => {
    return items
      .filter((f) => f.is_credit_card && !f.paid && f.date.startsWith(currentMonth))
      .reduce((s, f) => s + Number(f.amount), 0);
  }, [items, currentMonth]);

  // Due soon alerts
  const dueSoon = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    return items.filter((f) => f.due_date && !f.paid && f.due_date >= today && f.due_date <= in3days);
  }, [items]);

  // Report items
  const reportItems = useMemo(() => {
    if (reportMode === "month") return items.filter((f) => f.date.startsWith(reportMonth));
    return items.filter((f) => {
      if (reportFrom && f.date < reportFrom) return false;
      if (reportTo && f.date > reportTo) return false;
      return true;
    });
  }, [items, reportMode, reportMonth, reportFrom, reportTo]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; receita: number; despesa: number }> = {};
    reportItems.forEach((f) => {
      const m = f.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, receita: 0, despesa: 0 };
      if (f.type === "receita") map[m].receita += Number(f.amount);
      else map[m].despesa += Number(f.amount);
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12).map((d) => ({
      ...d, saldo: d.receita - d.despesa,
      label: new Date(d.month + "-15").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    }));
  }, [reportItems]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    reportItems.filter((f) => f.type === "despesa").forEach((f) => { map[f.category] = (map[f.category] || 0) + Number(f.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportItems]);

  const categoryIncomeData = useMemo(() => {
    const map: Record<string, number> = {};
    reportItems.filter((f) => f.type === "receita").forEach((f) => { map[f.category] = (map[f.category] || 0) + Number(f.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [reportItems]);

  const reportTotalReceita = reportItems.filter((f) => f.type === "receita").reduce((s, f) => s + Number(f.amount), 0);
  const reportTotalDespesa = reportItems.filter((f) => f.type === "despesa").reduce((s, f) => s + Number(f.amount), 0);
  const reportSaldo = reportTotalReceita - reportTotalDespesa;

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const periodLabel = reportMode === "month"
      ? new Date(reportMonth + "-15").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : `${reportFrom || "início"} a ${reportTo || "hoje"}`;

    // ─── Branded header ───
    // Blue bar
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pw, 38, "F");
    // Accent cyan line
    doc.setFillColor(8, 145, 178);
    doc.rect(0, 38, pw, 2, "F");
    // Brand name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("EXACTA", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Precisão em Gestão", 14, 25);
    // Report title on the right
    doc.setFontSize(12);
    doc.text("Relatório de Finanças Pessoais", pw - 14, 18, { align: "right" });
    doc.setFontSize(9);
    doc.text(`Período: ${periodLabel}`, pw - 14, 25, { align: "right" });
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, pw - 14, 31, { align: "right" });

    // ─── Summary ───
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo", 14, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105); doc.text(`Receitas: ${fmt(reportTotalReceita)}`, 14, 58);
    doc.setTextColor(220, 38, 38); doc.text(`Despesas: ${fmt(reportTotalDespesa)}`, 80, 58);
    doc.setTextColor(reportSaldo >= 0 ? 5 : 220, reportSaldo >= 0 ? 150 : 38, reportSaldo >= 0 ? 105 : 38);
    doc.text(`Saldo: ${fmt(reportSaldo)}`, 150, 58);

    // ─── Data table ───
    doc.setTextColor(0, 0, 0);
    const rows = reportItems.map((f) => [
      f.date, f.title, f.category, f.type === "receita" ? "Receita" : "Despesa",
      f.is_credit_card ? `Cartão ${f.installment_number}/${f.installments}` : "-",
      fmt(Number(f.amount)),
    ]);
    autoTable(doc, {
      startY: 65,
      head: [["Data", "Descrição", "Categoria", "Tipo", "Cartão", "Valor"]],
      body: rows,
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 245, 255] },
    });

    // Category breakdown
    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    if (categoryData.length > 0 && finalY + 30 < 270) {
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("Despesas por Categoria", 14, finalY + 12);
      autoTable(doc, {
        startY: finalY + 16,
        head: [["Categoria", "Total"]],
        body: categoryData.map((c) => [c.name, fmt(c.value)]),
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
      });
    }

    // ─── Footer ───
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      const ph = doc.internal.pageSize.getHeight();
      doc.setFillColor(30, 58, 138);
      doc.rect(0, ph - 12, pw, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text("EXACTA — Precisão em Gestão", 14, ph - 4);
      doc.text(`Página ${i} de ${pages}`, pw - 14, ph - 4, { align: "right" });
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
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Editar registro" : "Novo registro"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Descrição</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Almoço, Salário..." /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => { setType(v); if (v === "receita") setIsCreditCard(false); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Categoria</Label>
                  <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Recorrência</Label>
                  <Select value={recurring} onValueChange={setRecurring}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{RECURRING_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
              </div>

              {type === "despesa" && (
                <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={isCreditCard} onCheckedChange={(v) => setIsCreditCard(!!v)} id="cc" />
                    <label htmlFor="cc" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                      <CreditCard className="h-4 w-4" /> Cartão de Crédito
                    </label>
                  </div>
                  {isCreditCard && (
                    <div className="space-y-2">
                      <Label className="text-xs">Parcelas</Label>
                      <Input type="number" min="1" max="48" value={installments} onChange={(e) => setInstallments(e.target.value)} placeholder="1" />
                      {parseInt(installments) > 1 && amount && (
                        <p className="text-xs text-muted-foreground">
                          {installments}x de {fmt(Math.round((parseFloat(amount) / parseInt(installments)) * 100) / 100)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2"><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
              <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground">
                {editing ? "Salvar alterações" : "Adicionar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Due soon alert */}
      {dueSoon.length > 0 && (
        <Card className="p-4 border-l-4 border-l-warning bg-warning/5 shadow-card flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Contas vencendo em breve</p>
            <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
              {dueSoon.map((f) => (
                <p key={f.id}>{f.title} — vence {formatDate(f.due_date!)} — {fmt(Number(f.amount))}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card className="p-5 shadow-card border-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-gradient-to-br from-purple-500/15 to-purple-500/5 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10"><CreditCard className="h-5 w-5 text-purple-500" /></div>
            <div><p className="text-xs text-muted-foreground">Fatura Cartão (mês)</p><p className="text-xl font-display font-bold text-purple-500">{fmt(ccInvoice)}</p></div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="list" className="space-y-6">
        <TabsList>
          <TabsTrigger value="list"><Search className="h-4 w-4 mr-1.5" />Lista</TabsTrigger>
          <TabsTrigger value="report"><BarChart3 className="h-4 w-4 mr-1.5" />Relatório</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
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

          <Card className="shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-semibold">Descrição</th>
                  <th className="text-left px-4 py-3 font-semibold">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold">Data</th>
                  <th className="text-left px-4 py-3 font-semibold">Info</th>
                  <th className="text-right px-4 py-3 font-semibold">Valor</th>
                  <th className="text-right px-4 py-3 font-semibold w-28">Ações</th>
                </tr></thead>
                <tbody className="divide-y">
                  {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Nenhum registro encontrado.</td></tr>}
                  {filtered.map((f) => (
                    <tr key={f.id} className={`hover:bg-muted/30 transition ${f.paid ? "opacity-50" : ""}`}>
                      {editingInlineId === f.id ? (
                        <>
                          <td className="px-4 py-2"><Input value={inlineTitle} onChange={(e) => setInlineTitle(e.target.value)} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2">
                            <Select value={inlineCategory} onValueChange={setInlineCategory}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="px-4 py-2"><Input type="date" value={inlineDate} onChange={(e) => setInlineDate(e.target.value)} className="h-8 text-sm" /></td>
                          <td className="px-4 py-2" />
                          <td className="px-4 py-2 text-right"><Input type="number" step="0.01" value={inlineAmount} onChange={(e) => setInlineAmount(e.target.value)} className="h-8 text-sm w-24 ml-auto" /></td>
                          <td className="px-4 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => saveInlineEdit(f.id)} className="p-1.5 rounded hover:bg-success/10 text-success"><Check className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setEditingInlineId(null)} className="p-1.5 rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3"><div className="flex items-center gap-2">
                            {f.type === "receita" ? <TrendingUp className="h-4 w-4 text-success shrink-0" /> : <TrendingDown className="h-4 w-4 text-destructive shrink-0" />}
                            <span className="font-medium">{f.title}</span>
                          </div></td>
                          <td className="px-4 py-3 capitalize text-muted-foreground">{f.category}</td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(f.date)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              {f.is_credit_card && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500"><CreditCard className="h-3 w-3" />{f.installment_number}/{f.installments}</span>}
                              {f.recurring !== "none" && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-accent/10 text-accent"><Repeat className="h-3 w-3" />{f.recurring}</span>}
                              {f.due_date && <span className="text-warning">{formatDate(f.due_date)}</span>}
                            </div>
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${f.type === "receita" ? "text-success" : "text-destructive"}`}>
                            {f.type === "receita" ? "+" : "-"}{fmt(Number(f.amount))}
                          </td>
                          <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-0.5">
                            <button onClick={() => togglePaid(f)} className={`p-1.5 rounded ${f.paid ? "text-success" : "hover:bg-muted"}`} title={f.paid ? "Marcar não pago" : "Marcar pago"}>
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => startInlineEdit(f)} className="p-1.5 rounded hover:bg-muted" title="Editar rápido"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="report" className="space-y-6">
          <Card className="p-4 shadow-card border-0">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Filtro</Label>
                <Select value={reportMode} onValueChange={(v) => setReportMode(v as "month" | "range")}>
                  <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="month">Mês</SelectItem><SelectItem value="range">Intervalo</SelectItem></SelectContent>
                </Select>
              </div>
              {reportMode === "month" ? (
                <div className="space-y-1.5"><Label className="text-xs">Mês</Label><Input type="month" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} className="w-[180px] h-9" /></div>
              ) : (
                <>
                  <div className="space-y-1.5"><Label className="text-xs">De</Label><Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} className="w-[160px] h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Até</Label><Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} className="w-[160px] h-9" /></div>
                </>
              )}
              <div className="ml-auto flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  <span className="text-success font-semibold">{fmt(reportTotalReceita)}</span>{" · "}
                  <span className="text-destructive font-semibold">{fmt(reportTotalDespesa)}</span>{" · Saldo "}
                  <span className={reportSaldo >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>{fmt(reportSaldo)}</span>
                </p>
                <Button size="sm" variant="outline" onClick={exportPDF}><Download className="h-4 w-4 mr-1.5" /> PDF</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <h3 className="font-display font-bold text-lg mb-4">Receitas vs Despesas por Mês</h3>
            {monthlyData.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Sem dados.</p> : (
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

          <Card className="p-6 shadow-card">
            <h3 className="font-display font-bold text-lg mb-4">Evolução do Saldo</h3>
            {monthlyData.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Sem dados.</p> : (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-card">
              <h3 className="font-display font-bold text-lg mb-4">Despesas por Categoria</h3>
              {categoryData.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Sem despesas.</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart><Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(p: any) => `${p.name ?? ""} ${((p.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v) => fmt(Number(v))} /><Legend /></PieChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card className="p-6 shadow-card">
              <h3 className="font-display font-bold text-lg mb-4">Receitas por Categoria</h3>
              {categoryIncomeData.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">Sem receitas.</p> : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart><Pie data={categoryIncomeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(p: any) => `${p.name ?? ""} ${((p.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryIncomeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie><Tooltip formatter={(v) => fmt(Number(v))} /><Legend /></PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
