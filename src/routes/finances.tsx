import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import logoUrl from "@/assets/exacta_logo.png";
import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  BarChart3,
  Download,
  CreditCard,
  Repeat,
  Check,
  X,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Upload,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Calculator,
  PiggyBank,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/exacta";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { addBrandedHeader, addBrandedFooter } from "@/lib/pdf";
import {
  parseFinanceNotes,
  buildFinanceNotes,
  formatMonthYear,
  getPrevMonth,
  getNextMonth,
  calculateCarriedOverBalance,
  type CsvParsedRow,
} from "@/lib/finances-helpers";
import { ImportCsvDialog } from "@/components/finances/ImportCsvDialog";

export const Route = createFileRoute("/finances")({ component: FinancesPage });

export interface Finance {
  id: string;
  title: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  notes: string | null;
  created_at: string;
  recurring: string;
  due_date: string | null;
  is_credit_card: boolean;
  installments: number;
  installment_number: number;
  parent_id: string | null;
  paid: boolean;
}

const CATEGORIES = [
  "alimentação",
  "transporte",
  "moradia",
  "saúde",
  "educação",
  "lazer",
  "salário",
  "freelance",
  "investimento",
  "outros",
];

const RECURRING_OPTIONS = [
  { value: "none", label: "Não recorrente" },
  { value: "monthly", label: "Mensal (12 meses)" },
  { value: "weekly", label: "Semanal (52 semanas)" },
];

const CREDIT_CARDS = [
  "Nubank",
  "Itaú",
  "Inter",
  "Bradesco",
  "Santander",
  "C6 Bank",
  "Banco do Brasil",
  "Caixa",
  "XP",
  "Outro",
];

const PIE_COLORS = [
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#7c3aed",
  "#db2777",
  "#1e3a8a",
  "#475569",
  "#f59e0b",
  "#10b981",
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

function addWeeks(dateStr: string, weeks: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().split("T")[0];
}

function FinancesPage() {
  return (
    <AppShell>
      <FinancesContent />
    </AppShell>
  );
}

function FinancesContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<Finance[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all"); // all, paid, pending
  const [filterCost, setFilterCost] = useState("all"); // all, fixo, variavel
  const [open, setOpen] = useState(false);
  const [importCsvOpen, setImportCsvOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearScope, setClearScope] = useState<"month" | "all">("month");
  const [clearing, setClearing] = useState(false);
  const [editing, setEditing] = useState<Finance | null>(null);
  const [editingInlineId, setEditingInlineId] = useState<string | null>(null);
  const [editRecurringScope, setEditRecurringScope] = useState<"single" | "all_future">("single");

  // Month navigation state & carried over balance
  const [currentMonth, setCurrentMonth] = useState<string>(getDefaultMonth);
  const [monthViewMode, setMonthViewMode] = useState<"month" | "all">("month");
  const [includeCarriedOver, setIncludeCarriedOver] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"despesa" | "receita">("despesa");
  const [costType, setCostType] = useState<"fixo" | "variavel">("variavel");
  const [category, setCategory] = useState("outros");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [isCreditCard, setIsCreditCard] = useState(false);
  const [cardName, setCardName] = useState("Nubank");
  const [installments, setInstallments] = useState("1");
  const [isInitialPaid, setIsInitialPaid] = useState(false);

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
    const { data, error } = await supabase
      .from("personal_finances")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: false });

    if (error) {
      console.error("Erro ao carregar finanças:", error);
      toast.error("Erro ao carregar registros de finanças: " + error.message);
      return;
    }
    setItems((data || []) as Finance[]);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setType("despesa");
    setCostType("variavel");
    setCategory("outros");
    setDueDate("");
    setNotes("");
    setEditing(null);
    setEditRecurringScope("single");
    setRecurring("none");
    setIsCreditCard(false);
    setCardName("Nubank");
    setInstallments("1");
    setIsInitialPaid(false);
  };

  const parseAmount = (val: string): number => {
    if (!val) return NaN;
    const cleaned = String(val).replace(/R\$\s?/gi, "").replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned);
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !amount) return;
    const amountNum = parseAmount(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Por favor, informe um valor numérico válido.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const defaultReceitaDate = currentMonth ? `${currentMonth}-10` : today;
    const effectiveDate = type === "receita" ? (editing?.date || defaultReceitaDate) : (dueDate ? dueDate : today);
    // Receitas nunca possuem data de vencimento (vencimento é apenas para despesas/contas a pagar)
    const finalDueDate = type === "receita" ? null : (dueDate ? dueDate : null);
    const computedNotes = buildFinanceNotes(
      notes,
      isCreditCard ? cardName : null,
      isInitialPaid ? today : null,
      costType
    );

    if (editing) {
      const isRecurringItem =
        editing.recurring !== "none" ||
        !!editing.parent_id ||
        items.some((x) => x.parent_id === editing.id);

      if (isRecurringItem && editRecurringScope === "all_future") {
        const rootId = editing.parent_id || editing.id;
        const targetDate = editing.due_date || editing.date;

        // Atualiza o item do mês atual
        const payloadCurrent = {
          title: title.trim(),
          amount: amountNum,
          type,
          category,
          date: effectiveDate,
          due_date: finalDueDate,
          notes: computedNotes,
          paid: isInitialPaid,
        };

        const { error: errCurrent } = await supabase
          .from("personal_finances")
          .update(payloadCurrent)
          .eq("id", editing.id)
          .eq("user_id", user.id);

        if (errCurrent) {
          toast.error(errCurrent.message);
          return;
        }

        // Replica a alteração para os meses futuros vinculados
        const { error: errFuture } = await supabase
          .from("personal_finances")
          .update({
            title: title.trim(),
            amount: amountNum,
            type,
            category,
          })
          .eq("user_id", user.id)
          .or(`parent_id.eq.${rootId},id.eq.${rootId}`)
          .gt("due_date", targetDate);

        if (errFuture) {
          console.warn("Aviso ao atualizar meses futuros:", errFuture);
        }

        toast.success("Lançamento e meses futuros atualizados!");
      } else {
        // Altera exclusivamente para este mês selecionado
        const payload = {
          title: title.trim(),
          amount: amountNum,
          type,
          category,
          date: effectiveDate,
          due_date: finalDueDate,
          notes: computedNotes,
          recurring: editing.recurring,
          is_credit_card: isCreditCard,
          installments: editing.installments || 1,
          paid: isInitialPaid,
        };

        const { error } = await supabase
          .from("personal_finances")
          .update(payload)
          .eq("id", editing.id)
          .eq("user_id", user.id);

        if (error) {
          toast.error(error.message);
          return;
        }

        if (isRecurringItem) {
          toast.success(
            `Valor atualizado exclusivamente para este mês (${formatMonthYear(currentMonth)})!`
          );
        } else {
          toast.success("Registro financeiro atualizado!");
        }
      }
    } else {
      // Credit card with installments
      if (isCreditCard && parseInt(installments, 10) > 1) {
        const totalInstallments = parseInt(installments, 10);
        const installmentAmount = Math.round((amountNum / totalInstallments) * 100) / 100;

        // Create parent (parcela 1)
        const parentPayload = {
          user_id: user.id,
          title: `${title.trim()} (1/${totalInstallments})`,
          amount: installmentAmount,
          type: "despesa",
          category,
          date: effectiveDate,
          due_date: finalDueDate,
          notes: computedNotes,
          recurring: "none",
          is_credit_card: true,
          installments: totalInstallments,
          installment_number: 1,
          paid: isInitialPaid,
        };

        const { data: parent, error } = await supabase
          .from("personal_finances")
          .insert(parentPayload)
          .select("id")
          .single();

        if (error) {
          toast.error(error.message);
          return;
        }

        // Create remaining installments (parcelas 2..N)
        const childRows = [];
        for (let i = 2; i <= totalInstallments; i++) {
          const installDate = addMonths(effectiveDate, i - 1);
          const installDueDate = finalDueDate ? addMonths(finalDueDate, i - 1) : null;
          childRows.push({
            user_id: user.id,
            title: `${title.trim()} (${i}/${totalInstallments})`,
            amount: installmentAmount,
            type: "despesa",
            category,
            date: installDate,
            due_date: installDueDate,
            notes: buildFinanceNotes(notes, cardName, null, costType),
            recurring: "none",
            is_credit_card: true,
            installments: totalInstallments,
            installment_number: i,
            parent_id: parent?.id || null,
            paid: false,
          });
        }

        if (childRows.length > 0) {
          const { error: e2 } = await supabase.from("personal_finances").insert(childRows);
          if (e2) {
            toast.error(e2.message);
            return;
          }
        }

        toast.success(`${totalInstallments} parcelas adicionadas na fatura do cartão ${cardName}!`);
      } else if (recurring !== "none") {
        const occurrences = recurring === "monthly" ? 12 : 52;
        const parentRes = await supabase
          .from("personal_finances")
          .insert({
            user_id: user.id,
            title: title.trim(),
            amount: amountNum,
            type,
            category,
            date: effectiveDate,
            due_date: finalDueDate,
            notes: computedNotes,
            recurring,
            is_credit_card: isCreditCard,
            installments: occurrences,
            installment_number: 1,
            paid: isInitialPaid,
          })
          .select("id")
          .single();

        if (parentRes.error) {
          toast.error(parentRes.error.message);
          return;
        }

        const childRows = [];
        for (let i = 2; i <= occurrences; i++) {
          const nextDate = recurring === "monthly" ? addMonths(effectiveDate, i - 1) : addWeeks(effectiveDate, i - 1);
          const nextDueDate =
            type === "receita" || !finalDueDate
              ? null
              : recurring === "monthly"
              ? addMonths(finalDueDate, i - 1)
              : addWeeks(finalDueDate, i - 1);

          childRows.push({
            user_id: user.id,
            title: title.trim(),
            amount: amountNum,
            type,
            category,
            date: nextDate,
            due_date: nextDueDate,
            notes: buildFinanceNotes(notes, isCreditCard ? cardName : null, null, costType),
            recurring,
            is_credit_card: isCreditCard,
            installments: occurrences,
            installment_number: i,
            parent_id: parentRes.data.id,
            paid: false,
          });
        }

        if (childRows.length > 0) {
          const { error: e2 } = await supabase.from("personal_finances").insert(childRows);
          if (e2) {
            toast.error(e2.message);
            return;
          }
        }

        toast.success(`Lançamento recorrente adicionado para os próximos ${occurrences} períodos!`);
      } else {
        const { error } = await supabase.from("personal_finances").insert({
          user_id: user.id,
          title: title.trim(),
          amount: amountNum,
          type,
          category,
          date: effectiveDate,
          due_date: finalDueDate,
          notes: computedNotes,
          recurring: "none",
          is_credit_card: isCreditCard,
          installments: 1,
          installment_number: 1,
          paid: isInitialPaid,
        });

        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success(type === "receita" ? "Receita adicionada!" : "Despesa adicionada!");
      }
    }

    resetForm();
    setOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("personal_finances").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Lançamento removido deste mês!");
    load();
  };

  /**
   * Exclui lançamentos: ou apenas do mês atual ou zera todo o banco de finanças
   */
  const handleClearFinances = async () => {
    if (!user) return;
    setClearing(true);
    try {
      if (clearScope === "all") {
        // Exclui primeiro os registros dependentes (filhos com parent_id)
        const { error: errChildren } = await supabase
          .from("personal_finances")
          .delete()
          .eq("user_id", user.id)
          .not("parent_id", "is", null);

        if (errChildren) throw errChildren;

        // Exclui todos os registros restantes do usuário
        const { error: errAll } = await supabase
          .from("personal_finances")
          .delete()
          .eq("user_id", user.id);

        if (errAll) throw errAll;

        toast.success(`Todos os ${items.length} lançamentos foram excluídos do banco de dados com sucesso!`);
      } else {
        const monthIds = monthItems.map((m) => m.id);
        if (monthIds.length === 0) {
          toast.info("Não há lançamentos neste mês para excluir.");
          setClearDialogOpen(false);
          return;
        }

        // Exclui dependentes deste mês primeiro
        const { error: errChildren } = await supabase
          .from("personal_finances")
          .delete()
          .in("id", monthIds)
          .not("parent_id", "is", null);

        if (errChildren) throw errChildren;

        // Exclui lançamentos deste mês
        const { error: errMonth } = await supabase
          .from("personal_finances")
          .delete()
          .in("id", monthIds);

        if (errMonth) throw errMonth;

        toast.success(
          `${monthIds.length} lançamento(s) de ${formatMonthYear(currentMonth)} excluído(s) com sucesso!`
        );
      }

      setClearDialogOpen(false);
      await load();
    } catch (e: any) {
      toast.error("Erro ao excluir lançamentos: " + (e?.message || e));
    } finally {
      setClearing(false);
    }
  };

  /**
   * Marca como PAGO ou RECEBIDO capturando a data exata do clique
   */
  const handleTogglePaidWithDate = async (f: Finance, targetPaidState?: boolean) => {
    if (!user) return;
    const isNowPaid = targetPaidState !== undefined ? targetPaidState : !f.paid;
    const today = new Date().toISOString().split("T")[0];

    const parsed = parseFinanceNotes(f.notes);
    const updatedNotes = buildFinanceNotes(
      parsed.cleanNotes,
      parsed.cardName,
      isNowPaid ? today : null
    );

    const { error } = await supabase
      .from("personal_finances")
      .update({
        paid: isNowPaid,
        notes: updatedNotes,
      })
      .eq("id", f.id)
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (isNowPaid) {
      if (f.type === "receita") {
        toast.success("Receita marcada como RECEBIDA!", {
          description: `Registrado em ${formatDate(today)}`,
        });
      } else {
        toast.success("Despesa marcada como PAGA!", {
          description: `Registrado em ${formatDate(today)}`,
        });
      }
    } else {
      toast.info(
        f.type === "receita"
          ? "Receita revertida para 'A RECEBER'"
          : "Despesa revertida para 'A PAGAR'"
      );
    }

    load();
  };

  /**
   * Paga a fatura completa de um cartão no mês atual
   */
  const handlePayCardInvoice = async (targetCardName: string) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const cardExpenses = items.filter(
      (f) =>
        f.is_credit_card &&
        f.type === "despesa" &&
        !f.paid &&
        (f.date.startsWith(currentMonth) || (f.due_date && f.due_date.startsWith(currentMonth))) &&
        (parseFinanceNotes(f.notes).cardName || "Nubank").toLowerCase() === targetCardName.toLowerCase()
    );

    if (cardExpenses.length === 0) {
      toast.info(`A fatura do ${targetCardName} já está totalmente paga!`);
      return;
    }

    try {
      for (const item of cardExpenses) {
        const parsed = parseFinanceNotes(item.notes);
        const updatedNotes = buildFinanceNotes(parsed.cleanNotes, targetCardName, today);
        await supabase
          .from("personal_finances")
          .update({
            paid: true,
            notes: updatedNotes,
          })
          .eq("id", item.id)
          .eq("user_id", user.id);
      }

      toast.success(`Fatura do cartão ${targetCardName} paga com sucesso!`, {
        description: `${cardExpenses.length} parcela(s)/compra(s) quitadas em ${formatDate(today)}`,
      });
      load();
    } catch (e: any) {
      toast.error("Erro ao pagar fatura do cartão", { description: e?.message });
    }
  };

  /**
   * Importação em lote por CSV
   */
  const handleImportCsv = async (rows: CsvParsedRow[]) => {
    if (!user) return;
    const directInserts: any[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    for (const r of rows) {
      if (!r.isValid) continue;

      // Se dueDate for null (ou se for receita), due_date vai null para o banco!
      const baseDate = r.dueDate || todayStr;
      const initialDueDate = r.type === "receita" ? null : (r.dueDate || null);

      if (r.isCreditCard && r.installments > 1) {
        const totalInst = r.installments;
        const instAmount = Math.round((r.amount / totalInst) * 100) / 100;
        const parentRes = await supabase
          .from("personal_finances")
          .insert({
            user_id: user.id,
            title: `${r.title.trim()} (1/${totalInst})`,
            amount: instAmount,
            type: "despesa",
            category: r.category,
            date: baseDate,
            due_date: initialDueDate,
            notes: buildFinanceNotes(r.notes, r.cardName || "Nubank", null, r.costType),
            recurring: "none",
            is_credit_card: true,
            installments: totalInst,
            installment_number: 1,
            paid: false,
          })
          .select("id")
          .single();

        if (parentRes.error) throw new Error(parentRes.error.message);

        const childRows = [];
        for (let i = 2; i <= totalInst; i++) {
          const nextDate = addMonths(baseDate, i - 1);
          const nextDueDate = r.dueDate ? addMonths(r.dueDate, i - 1) : null;
          childRows.push({
            user_id: user.id,
            title: `${r.title.trim()} (${i}/${totalInst})`,
            amount: instAmount,
            type: "despesa",
            category: r.category,
            date: nextDate,
            due_date: nextDueDate,
            notes: buildFinanceNotes(r.notes, r.cardName || "Nubank", null, r.costType),
            recurring: "none",
            is_credit_card: true,
            installments: totalInst,
            installment_number: i,
            parent_id: parentRes.data.id,
            paid: false,
          });
        }
        if (childRows.length > 0) {
          const { error: e2 } = await supabase.from("personal_finances").insert(childRows);
          if (e2) throw new Error(e2.message);
        }
      } else if (r.recurring !== "none") {
        const occurrences = r.recurring === "monthly" ? 12 : 52;
        const parentRes = await supabase
          .from("personal_finances")
          .insert({
            user_id: user.id,
            title: r.title.trim(),
            amount: r.amount,
            type: r.type,
            category: r.category,
            date: baseDate,
            due_date: initialDueDate,
            notes: buildFinanceNotes(r.notes, r.isCreditCard ? r.cardName || "Nubank" : null, null, r.costType),
            recurring: r.recurring,
            is_credit_card: r.isCreditCard,
            installments: occurrences,
            installment_number: 1,
            paid: false,
          })
          .select("id")
          .single();

        if (parentRes.error) throw new Error(parentRes.error.message);

        const childRows = [];
        for (let i = 2; i <= occurrences; i++) {
          const nextDate = r.recurring === "monthly" ? addMonths(baseDate, i - 1) : addWeeks(baseDate, i - 1);
          const nextDueDate =
            r.type === "receita" || !r.dueDate
              ? null
              : r.recurring === "monthly"
              ? addMonths(r.dueDate, i - 1)
              : addWeeks(r.dueDate, i - 1);

          childRows.push({
            user_id: user.id,
            title: r.title.trim(),
            amount: r.amount,
            type: r.type,
            category: r.category,
            date: nextDate,
            due_date: nextDueDate,
            notes: buildFinanceNotes(r.notes, r.isCreditCard ? r.cardName || "Nubank" : null, null, r.costType),
            recurring: r.recurring,
            is_credit_card: r.isCreditCard,
            installments: occurrences,
            installment_number: i,
            parent_id: parentRes.data.id,
            paid: false,
          });
        }
        if (childRows.length > 0) {
          const { error: e2 } = await supabase.from("personal_finances").insert(childRows);
          if (e2) throw new Error(e2.message);
        }
      } else {
        directInserts.push({
          user_id: user.id,
          title: r.title.trim(),
          amount: r.amount,
          type: r.type,
          category: r.category,
          date: baseDate,
          due_date: initialDueDate,
          notes: buildFinanceNotes(r.notes, r.isCreditCard ? r.cardName || "Nubank" : null, null, r.costType),
          recurring: "none",
          is_credit_card: r.isCreditCard,
          installments: 1,
          installment_number: 1,
          paid: false,
        });
      }
    }

    if (directInserts.length > 0) {
      const { error } = await supabase.from("personal_finances").insert(directInserts);
      if (error) throw new Error(error.message);
    }

    await load();
  };

  const openEdit = (f: Finance) => {
    setEditing(f);
    setTitle(f.title);
    setAmount(String(f.amount));
    setType((f.type === "receita" ? "receita" : "despesa") as any);
    setCategory(f.category);
    setDueDate(f.type === "receita" ? "" : (f.due_date || ""));
    const parsed = parseFinanceNotes(f.notes);
    setCostType(parsed.costType || (f.recurring !== "none" ? "fixo" : "variavel"));
    setNotes(parsed.cleanNotes);
    setRecurring(f.recurring);
    setIsCreditCard(f.is_credit_card);
    setCardName(parsed.cardName || "Nubank");
    setInstallments(String(f.installments || 1));
    setIsInitialPaid(f.paid);
    setEditRecurringScope("single");
    setOpen(true);
  };

  const startInlineEdit = (f: Finance) => {
    setEditingInlineId(f.id);
    setInlineTitle(f.title);
    setInlineAmount(String(f.amount));
    setInlineCategory(f.category);
    setInlineDate(f.due_date || f.date);
  };

  const saveInlineEdit = async (id: string) => {
    if (!user) return;
    const amountNum = parseAmount(inlineAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Por favor, informe um valor numérico válido.");
      return;
    }
    const { error } = await supabase
      .from("personal_finances")
      .update({
        title: inlineTitle.trim(),
        amount: amountNum,
        category: inlineCategory,
        date: inlineDate,
        due_date: inlineDate,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    setEditingInlineId(null);
    toast.success("Valor atualizado exclusivamente para este mês!");
    load();
  };

  // Month-filtered items
  const monthItems = useMemo(() => {
    if (monthViewMode === "all") return items;
    return items.filter((f) => {
      const targetDate = f.due_date || f.date;
      return targetDate && targetDate.startsWith(currentMonth);
    });
  }, [items, currentMonth, monthViewMode]);

  // Search & Type Filters
  const filtered = useMemo(() => {
    return monthItems.filter((f) => {
      if (filterType !== "all" && f.type !== filterType) return false;
      if (filterCat !== "all" && f.category !== filterCat) return false;
      if (filterStatus === "paid" && !f.paid) return false;
      if (filterStatus === "pending" && f.paid) return false;
      if (filterCost !== "all") {
        const parsed = parseFinanceNotes(f.notes);
        const itemCost = parsed.costType || (f.recurring !== "none" ? "fixo" : "variavel");
        if (itemCost !== filterCost) return false;
      }
      if (search && !f.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [monthItems, filterType, filterCat, filterStatus, filterCost, search]);

  // Saldo transportado do mês anterior / histórico acumulado
  const carriedOverData = useMemo(
    () => calculateCarriedOverBalance(items, currentMonth),
    [items, currentMonth]
  );
  const saldoTransportado = carriedOverData.carriedBalance;
  const prevMonthStr = carriedOverData.prevMonth;

  // Aggregated calculations for selected month view
  const receitasRecebidas = useMemo(
    () => monthItems.filter((f) => f.type === "receita" && f.paid).reduce((s, f) => s + Number(f.amount), 0),
    [monthItems]
  );
  const receitasAReceber = useMemo(
    () => monthItems.filter((f) => f.type === "receita" && !f.paid).reduce((s, f) => s + Number(f.amount), 0),
    [monthItems]
  );
  const totalReceitasLancamentos = receitasRecebidas + receitasAReceber;

  // Sobra positiva do mês anterior incorporada como receita no mês atual
  const saldoAnteriorAplicado = includeCarriedOver && saldoTransportado > 0 ? saldoTransportado : 0;
  const receitasRealizadasComSobra = receitasRecebidas + saldoAnteriorAplicado;
  const totalReceitasProjetadasMes = totalReceitasLancamentos + saldoAnteriorAplicado;

  const despesasPagas = useMemo(
    () => monthItems.filter((f) => f.type === "despesa" && f.paid).reduce((s, f) => s + Number(f.amount), 0),
    [monthItems]
  );
  const despesasAPagar = useMemo(
    () => monthItems.filter((f) => f.type === "despesa" && !f.paid).reduce((s, f) => s + Number(f.amount), 0),
    [monthItems]
  );
  const totalDespesasMes = despesasPagas + despesasAPagar;

  // Despesas Fixas / Recorrentes do mês atual
  const despesasRecorrentesMes = useMemo(
    () =>
      monthItems.filter((f) => {
        if (f.type !== "despesa") return false;
        const parsed = parseFinanceNotes(f.notes);
        return parsed.costType === "fixo" || f.recurring !== "none" || f.parent_id !== null;
      }),
    [monthItems]
  );
  const totalDespesasRecorrentes = useMemo(
    () => despesasRecorrentesMes.reduce((s, f) => s + Number(f.amount), 0),
    [despesasRecorrentesMes]
  );

  // Despesas Variáveis do mês atual
  const despesasVariaveisMes = useMemo(
    () =>
      monthItems.filter((f) => {
        if (f.type !== "despesa") return false;
        const parsed = parseFinanceNotes(f.notes);
        return (
          parsed.costType === "variavel" ||
          (f.recurring === "none" && !f.parent_id && !f.is_credit_card && !parsed.costType)
        );
      }),
    [monthItems]
  );
  const totalDespesasVariaveis = useMemo(
    () => despesasVariaveisMes.reduce((s, f) => s + Number(f.amount), 0),
    [despesasVariaveisMes]
  );

  // Saldo em caixa realizado
  const saldoRealizado = receitasRealizadasComSobra - despesasPagas;

  // Previsão de quanto vai sobrar no final do mês:
  // (Receitas Previstas + Sobra do Mês Anterior) - (Despesas Fixas, Faturas e Contas do Mês)
  const previsaoSobraFinal = totalReceitasProjetadasMes - totalDespesasMes;

  // Taxa de comprometimento da renda (%)
  const taxaComprometimento = totalReceitasProjetadasMes > 0
    ? Math.min(100, Math.round((totalDespesasMes / totalReceitasProjetadasMes) * 100))
    : 0;

  // Credit card grouping by card name in active month
  const creditCardInvoices = useMemo(() => {
    const map: Record<
      string,
      {
        cardName: string;
        totalAmount: number;
        paidAmount: number;
        openAmount: number;
        items: Finance[];
        allPaid: boolean;
      }
    > = {};

    monthItems
      .filter((f) => f.is_credit_card && f.type === "despesa")
      .forEach((f) => {
        const parsed = parseFinanceNotes(f.notes);
        const cName = parsed.cardName || "Nubank";
        if (!map[cName]) {
          map[cName] = {
            cardName: cName,
            totalAmount: 0,
            paidAmount: 0,
            openAmount: 0,
            items: [],
            allPaid: true,
          };
        }
        const amt = Number(f.amount);
        map[cName].totalAmount += amt;
        if (f.paid) {
          map[cName].paidAmount += amt;
        } else {
          map[cName].openAmount += amt;
          map[cName].allPaid = false;
        }
        map[cName].items.push(f);
      });

    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [monthItems]);

  const totalFaturasCartao = creditCardInvoices.reduce((s, c) => s + c.totalAmount, 0);

  // Due soon alerts (Apenas despesas com vencimento próximo, receitas nunca possuem vencimento)
  const dueSoon = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const in3days = new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];
    return items.filter(
      (f) => f.type === "despesa" && f.due_date && !f.paid && f.due_date >= today && f.due_date <= in3days
    );
  }, [items]);

  // Report items
  const reportItems = useMemo(() => {
    if (reportMode === "month") {
      return items.filter((f) => (f.due_date || f.date).startsWith(reportMonth));
    }
    return items.filter((f) => {
      const d = f.due_date || f.date;
      if (reportFrom && d < reportFrom) return false;
      if (reportTo && d > reportTo) return false;
      return true;
    });
  }, [items, reportMode, reportMonth, reportFrom, reportTo]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; receita: number; despesa: number }> = {};
    items.forEach((f) => {
      const m = (f.due_date || f.date).slice(0, 7);
      if (!map[m]) map[m] = { month: m, receita: 0, despesa: 0 };
      if (f.type === "receita") map[m].receita += Number(f.amount);
      else map[m].despesa += Number(f.amount);
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((d) => ({
        ...d,
        saldo: d.receita - d.despesa,
        label: new Date(d.month + "-15").toLocaleDateString("pt-BR", {
          month: "short",
          year: "2-digit",
        }),
      }));
  }, [items]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    reportItems
      .filter((f) => f.type === "despesa")
      .forEach((f) => {
        map[f.category] = (map[f.category] || 0) + Number(f.amount);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reportItems]);

  const categoryIncomeData = useMemo(() => {
    const map: Record<string, number> = {};
    reportItems
      .filter((f) => f.type === "receita")
      .forEach((f) => {
        map[f.category] = (map[f.category] || 0) + Number(f.amount);
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [reportItems]);

  const reportTotalReceita = reportItems
    .filter((f) => f.type === "receita")
    .reduce((s, f) => s + Number(f.amount), 0);
  const reportTotalDespesa = reportItems
    .filter((f) => f.type === "despesa")
    .reduce((s, f) => s + Number(f.amount), 0);
  const reportSaldo = reportTotalReceita - reportTotalDespesa;

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const periodLabel =
      reportMode === "month"
        ? new Date(reportMonth + "-15").toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })
        : `${reportFrom || "início"} a ${reportTo || "hoje"}`;

    let y = await addBrandedHeader(
      doc,
      "Relatório de Finanças Pessoais",
      `Período: ${periodLabel}`,
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`
    );

    // Summary Cards
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Financeiro", 14, y);
    y += 10;

    const boxW = (pw - 42) / 3;
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(14, y, boxW, 22, 3, 3, "F");
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(9);
    doc.text("Receitas", 18, y + 8);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(reportTotalReceita), 18, y + 17);

    doc.setFillColor(254, 242, 242);
    doc.roundedRect(14 + boxW + 7, y, boxW, 22, 3, 3, "F");
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Despesas", 18 + boxW + 7, y + 8);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(reportTotalDespesa), 18 + boxW + 7, y + 17);

    const balColor = reportSaldo >= 0 ? [236, 253, 245] : [254, 242, 242];
    doc.setFillColor(balColor[0], balColor[1], balColor[2]);
    doc.roundedRect(14 + (boxW + 7) * 2, y, boxW, 22, 3, 3, "F");
    doc.setTextColor(reportSaldo >= 0 ? 5 : 220, reportSaldo >= 0 ? 150 : 38, reportSaldo >= 0 ? 105 : 38);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Saldo", 18 + (boxW + 7) * 2, y + 8);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(fmt(reportSaldo), 18 + (boxW + 7) * 2, y + 17);
    y += 30;

    // Top categories
    if (categoryData.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Top Categorias de Despesa", 14, y);
      y += 6;
      const top5 = categoryData.slice(0, 5);
      const maxVal = top5[0]?.value || 1;
      const barMaxW = pw - 80;
      top5.forEach((c) => {
        const pct = c.value / maxVal;
        doc.setFillColor(240, 245, 255);
        doc.rect(14, y, barMaxW + 40, 8, "F");
        doc.setFillColor(30, 58, 138);
        doc.rect(14, y, pct * barMaxW, 8, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        if (pct > 0.15) doc.text(c.name, 16, y + 5.5);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(fmt(c.value), pw - 14, y + 5.5, { align: "right" });
        y += 10;
      });
      y += 4;
    }

    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Lançamentos Detalhados", 14, y);
    y += 2;
    const rows = reportItems.map((f) => {
      const parsed = parseFinanceNotes(f.notes);
      return [
        f.due_date ? formatDate(f.due_date) : "Sem vencimento",
        f.title,
        f.category,
        f.type === "receita" ? (f.paid ? "Recebido" : "A Receber") : f.paid ? "Pago" : "A Pagar",
        f.is_credit_card ? `${parsed.cardName || "Cartão"} (${f.installment_number}/${f.installments})` : "-",
        fmt(Number(f.amount)),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Vencimento", "Descrição", "Categoria", "Status", "Cartão", "Valor"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 245, 255] },
    });

    addBrandedFooter(doc);
    doc.save(`financas-${reportMode === "month" ? reportMonth : "periodo"}.pdf`);
    toast.success("PDF exportado!");
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Módulo Pessoal</p>
          <h1 className="font-display text-3xl lg:text-4xl font-bold mt-0.5">Finanças Pessoais</h1>
          <p className="text-muted-foreground text-xs mt-1">
            Planejamento mensal, gestão de receitas a receber, despesas a pagar e faturas de cartão.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Botão Limpar / Excluir Lançamentos */}
          <Button
            variant="outline"
            onClick={() => setClearDialogOpen(true)}
            disabled={items.length === 0}
            className="text-xs gap-1.5 shadow-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/60 font-medium"
            title="Excluir lançamentos do mês ou limpar todo o banco de dados"
          >
            <Trash2 className="size-3.5" /> Excluir Lançamentos
          </Button>

          {/* Botão Importar CSV */}
          <Button
            variant="outline"
            onClick={() => setImportCsvOpen(true)}
            className="text-xs gap-1.5 shadow-sm border-border hover:bg-muted font-medium"
          >
            <Upload className="size-3.5 text-primary" /> Importar CSV
          </Button>

          {/* Botão Novo Registro */}
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary text-primary-foreground shadow-elegant text-xs gap-1.5 font-medium">
                <Plus className="size-4" /> Novo Lançamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-y-auto max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar Lançamento" : "Novo Lançamento Financeiro"}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Descrição</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Salário, Aluguel, Supermercado..."
                    className="h-9 text-xs"
                  />
                </div>

                {type === "despesa" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className="h-9 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Data de Vencimento</Label>
                        <span className="text-[10px] text-muted-foreground italic">Opcional</span>
                      </div>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        placeholder="Deixe em branco se não tiver vencimento"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Valor da Receita (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      className="h-9 text-xs font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      💡 Receitas não possuem data de vencimento. O valor constará como disponível no caixa ou a receber.
                    </p>
                  </div>
                )}

                {/* Classificação: Custo Fixo ou Variável */}
                <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Classificação de Custo / Despesa
                    </Label>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${
                        costType === "fixo"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                          : "bg-muted text-muted-foreground border-border/60"
                      }`}
                    >
                      {costType === "fixo" ? "Custo Fixo" : "Custo Variável"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCostType("fixo")}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-between ${
                        costType === "fixo"
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600 font-semibold"
                          : "border-border/60 hover:bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      <span>Custo Fixo</span>
                      {costType === "fixo" && <Check className="size-3.5 text-blue-600" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCostType("variavel")}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-between ${
                        costType === "variavel"
                          ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600 font-semibold"
                          : "border-border/60 hover:bg-muted/60 text-muted-foreground"
                      }`}
                    >
                      <span>Custo Variável</span>
                      {costType === "variavel" && <Check className="size-3.5 text-blue-600" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {costType === "fixo"
                      ? "📌 Custo Fixo: Compromissos que ocorrem todo mês (aluguel, condomínio, internet, salário fixo)."
                      : "🛒 Custo Variável: Despesas flexíveis do dia a dia (supermercado, lazer, combustível, extras)."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Tipo</Label>
                    <Select
                      value={type}
                      onValueChange={(v: "despesa" | "receita") => {
                        setType(v);
                        if (v === "receita") {
                          setIsCreditCard(false);
                          setDueDate(""); // Receitas nunca têm vencimento
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="despesa">Despesa (A Pagar)</SelectItem>
                        <SelectItem value="receita">Receita (A Receber)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Categoria</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-9 text-xs capitalize">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="capitalize text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Recorrência / Escopo de Edição */}
                {editing ? (
                  (editing.recurring !== "none" ||
                    !!editing.parent_id ||
                    items.some((x) => x.parent_id === editing.id)) && (
                    <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                          <Repeat className="size-3.5 text-blue-600" />
                          Lançamento Recorrente
                        </Label>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium"
                        >
                          {editing.recurring === "monthly"
                            ? "Mensal"
                            : editing.recurring === "weekly"
                            ? "Semanal"
                            : "Série"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Como deseja aplicar a edição deste valor?
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setEditRecurringScope("single")}
                          className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                            editRecurringScope === "single"
                              ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600"
                              : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium text-xs">
                            <span>Apenas neste mês</span>
                            {editRecurringScope === "single" && (
                              <Check className="size-3.5 text-blue-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            Altera o valor apenas em {formatMonthYear(currentMonth)}. Os outros meses continuam com o valor original.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditRecurringScope("all_future")}
                          className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                            editRecurringScope === "all_future"
                              ? "border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600"
                              : "border-border/60 hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium text-xs">
                            <span>Este e meses futuros</span>
                            {editRecurringScope === "all_future" && (
                              <Check className="size-3.5 text-blue-600" />
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1">
                            Atualiza este mês e replica o novo valor para todos os meses seguintes desta recorrência.
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Recorrência Mensal / Semanal</Label>
                    <Select
                      value={recurring}
                      onValueChange={(v) => {
                        setRecurring(v);
                        if (v !== "none" && costType === "variavel") {
                          setCostType("fixo");
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRING_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value} className="text-xs">
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {recurring !== "none" && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        💡 Ao passar os meses na navegação, este lançamento já estará presente nos próximos períodos.
                      </p>
                    )}
                  </div>
                )}

                {/* Opções de Cartão de Crédito (apenas para despesa) */}
                {type === "despesa" && (
                  <div className="space-y-3 rounded-xl border p-3.5 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isCreditCard}
                        onCheckedChange={(v) => setIsCreditCard(!!v)}
                        id="form-cc"
                      />
                      <label
                        htmlFor="form-cc"
                        className="text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-foreground"
                      >
                        <CreditCard className="size-4 text-purple-500" /> Compra em Cartão de Crédito
                      </label>
                    </div>

                    {isCreditCard && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Qual Cartão?</Label>
                            <Select value={cardName} onValueChange={setCardName}>
                              <SelectTrigger className="h-8 text-xs font-medium">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CREDIT_CARDS.map((c) => (
                                  <SelectItem key={c} value={c} className="text-xs">
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs">Parcelas</Label>
                            <Input
                              type="number"
                              min="1"
                              max="48"
                              value={installments}
                              onChange={(e) => setInstallments(e.target.value)}
                              placeholder="1"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>

                        {parseInt(installments, 10) > 1 && amount && (
                          <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300">
                            <strong>{installments}x</strong> de{" "}
                            {fmt(
                              Math.round((parseFloat(amount) / parseInt(installments, 10)) * 100) / 100
                            )}{" "}
                            na fatura do cartão <strong>{cardName}</strong>. Cada parcela cairá no mês correspondente!
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status Inicial: Já Pago / Já Recebido */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/20 text-xs">
                  <div>
                    <span className="font-medium text-foreground">
                      {type === "receita" ? "Já foi recebido?" : "Já foi pago?"}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {isInitialPaid
                        ? "O sistema captará a data de hoje como data de quitação."
                        : "Ficará como 'A Receber' ou 'A Pagar' até você clicar no botão da tabela."}
                    </p>
                  </div>
                  <Checkbox
                    checked={isInitialPaid}
                    onCheckedChange={(v) => setIsInitialPaid(!!v)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Observações (Opcional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Notas ou detalhes adicionais..."
                    className="text-xs resize-none"
                  />
                </div>

                <Button onClick={handleSave} className="w-full bg-gradient-primary text-primary-foreground text-xs font-medium">
                  {editing ? "Salvar Alterações" : "Adicionar Lançamento"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Month Navigator Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth((m) => getPrevMonth(m))}
            className="h-8 px-2.5 text-xs gap-1 hover:bg-muted font-medium"
            title="Mês Anterior"
          >
            <ChevronLeft className="size-3.5" /> Mês Anterior
          </Button>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20 font-semibold text-xs text-primary min-w-[190px] justify-center">
            <CalendarDays className="size-3.5" />
            <span>{formatMonthYear(currentMonth)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth((m) => getNextMonth(m))}
            className="h-8 px-2.5 text-xs gap-1 hover:bg-muted font-medium"
            title="Próximo Mês"
          >
            Próximo Mês <ChevronRight className="size-3.5" />
          </Button>

          {currentMonth !== getDefaultMonth() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentMonth(getDefaultMonth())}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <RotateCcw className="size-3" /> Mês Atual
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5 text-xs">
            <button
              onClick={() => setMonthViewMode("month")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                monthViewMode === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lançamentos do Mês
            </button>
            <button
              onClick={() => setMonthViewMode("all")}
              className={`px-3 py-1 rounded-md font-medium transition ${
                monthViewMode === "all"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Todos ({items.length})
            </button>
          </div>
        </div>
      </div>

      {/* Due soon alert */}
      {dueSoon.length > 0 && (
        <Card className="p-4 border-l-4 border-l-warning bg-warning/5 shadow-card flex items-start gap-3">
          <AlertTriangle className="size-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-xs text-foreground">
              {dueSoon.length} conta(s) com vencimento próximo (próximos 3 dias)
            </p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              {dueSoon.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span>
                    <strong>{f.title}</strong> — vence {formatDate(f.due_date!)} — {fmt(Number(f.amount))}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePaidWithDate(f, true)}
                    className="h-5 px-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10 font-medium"
                  >
                    Marcar Pago
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Card Executivo de Previsão de Sobra no Final do Mês (Projeção Financeira) */}
      <Card className="p-5 lg:p-6 shadow-card border border-border/80 bg-gradient-to-br from-card via-card to-muted/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <div className="relative space-y-4">
          {/* Header do Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-base lg:text-lg text-foreground">
                    Previsão de Fechamento do Mês
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
                    {formatMonthYear(currentMonth)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Projeção automática calculada com base nos lançamentos recorrentes, faturas de cartão e sobra do mês anterior
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {previsaoSobraFinal > 0 ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs py-1 px-2.5 font-semibold gap-1.5 shadow-xs">
                  <TrendingUp className="size-3.5" /> Superávit Previsto
                </Badge>
              ) : previsaoSobraFinal === 0 ? (
                <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 text-xs py-1 px-2.5 font-semibold gap-1.5 shadow-xs">
                  <Calculator className="size-3.5" /> Equilíbrio Orçamentário
                </Badge>
              ) : (
                <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 text-xs py-1 px-2.5 font-semibold gap-1.5 shadow-xs">
                  <AlertTriangle className="size-3.5" /> Déficit Previsto
                </Badge>
              )}
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            {/* Coluna Esquerda: Valor da Previsão de Sobra */}
            <div className="lg:col-span-5 space-y-2.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Previsão de sobra no final do mês:
              </span>
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-3xl sm:text-4xl font-display font-extrabold tracking-tight ${
                    previsaoSobraFinal >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {fmt(previsaoSobraFinal)}
                </p>
                {previsaoSobraFinal > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    de economia prevista
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {previsaoSobraFinal > 0 ? (
                  <>
                    Quitando todos os fixos recorrentes, parcelas de faturas e contas previstas, você terá uma sobra estimada de{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(previsaoSobraFinal)}</strong> livre na conta ao fechar o mês.
                  </>
                ) : previsaoSobraFinal === 0 ? (
                  <>
                    Suas receitas projetadas cobrem exatamente o montante de despesas programadas para este mês.
                  </>
                ) : (
                  <>
                    As despesas comprometidas excedem a receita total prevista em{" "}
                    <strong className="text-rose-600 dark:text-rose-400 font-semibold">{fmt(Math.abs(previsaoSobraFinal))}</strong>. Ajuste os fixos pontualmente ou preveja novas receitas.
                  </>
                )}
              </p>

              {/* Barra de comprometimento */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Renda Comprometida</span>
                  <span className="font-semibold text-foreground">{taxaComprometimento}%</span>
                </div>
                <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      taxaComprometimento > 90
                        ? "bg-rose-500"
                        : taxaComprometimento > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, taxaComprometimento)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Coluna Direita: Métricas Detalhadas dos Fixos e Fontes */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Receitas Projetadas */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Receitas Previstas</span>
                  <ArrowUpRight className="size-3.5 text-emerald-600" />
                </div>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {fmt(totalReceitasProjetadasMes)}
                </p>
                <div className="text-[10px] text-muted-foreground space-y-0.5">
                  <div>Lançamentos: {fmt(totalReceitasLancamentos)}</div>
                  {saldoAnteriorAplicado > 0 && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                      + {fmt(saldoAnteriorAplicado)} mês anterior
                    </div>
                  )}
                </div>
              </div>

              {/* Despesas Fixas / Recorrentes */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Despesas Fixas</span>
                  <Repeat className="size-3.5 text-blue-600" />
                </div>
                <p className="text-lg font-bold font-mono text-foreground">
                  {fmt(totalDespesasRecorrentes)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {despesasRecorrentesMes.length} conta(s) recorrente(s) no mês
                </p>
              </div>

              {/* Faturas de Cartão */}
              <div className="p-3.5 rounded-xl border border-border/70 bg-card/80 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Faturas de Cartão</span>
                  <CreditCard className="size-3.5 text-purple-600" />
                </div>
                <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                  {fmt(totalFaturasCartao)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {creditCardInvoices.length} fatura(s) cadastrada(s)
                </p>
              </div>
            </div>
          </div>

          {/* Barra inferior com toggle de saldo transportado */}
          {saldoTransportado > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <PiggyBank className="size-4 text-emerald-600" />
                <span>
                  Sobra do mês anterior ({formatMonthYear(prevMonthStr)}):{" "}
                  <strong className="text-foreground">{fmt(saldoTransportado)}</strong>
                </span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-foreground hover:text-primary transition">
                <Checkbox
                  checked={includeCarriedOver}
                  onCheckedChange={(v) => setIncludeCarriedOver(!!v)}
                />
                <span>Incorporar sobra como receita disponível no mês</span>
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receitas */}
        <Card className="p-5 shadow-card border border-border/60 relative overflow-hidden bg-card">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Receitas (Mês)</span>
              <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400">
                {fmt(receitasRealizadasComSobra)}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {saldoAnteriorAplicado > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    <PiggyBank className="size-2.5 mr-1 text-emerald-600" /> +{fmt(saldoAnteriorAplicado)} anterior
                  </Badge>
                )}
                {receitasAReceber > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                    <Clock className="size-2.5 mr-1" /> +{fmt(receitasAReceber)} a receber
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
              <ArrowUpRight className="size-5" />
            </div>
          </div>
        </Card>

        {/* Despesas */}
        <Card className="p-5 shadow-card border border-border/60 relative overflow-hidden bg-card">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-rose-500/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Despesas (Mês)</span>
              <p className="text-2xl font-display font-bold text-rose-600 dark:text-rose-400">
                {fmt(despesasPagas)}
              </p>
              <div className="flex items-center gap-1.5 pt-0.5">
                <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                  <Clock className="size-2.5 mr-1" /> +{fmt(despesasAPagar)} a pagar
                </Badge>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
              <ArrowDownRight className="size-5" />
            </div>
          </div>
        </Card>

        {/* Saldo Líquido Realizado */}
        <Card className="p-5 shadow-card border border-border/60 relative overflow-hidden bg-card">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Saldo em Caixa (Realizado)</span>
              <p
                className={`text-2xl font-display font-bold ${
                  saldoRealizado >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {fmt(saldoRealizado)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Previsão no fim do mês: <strong className={previsaoSobraFinal >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>{fmt(previsaoSobraFinal)}</strong>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
          </div>
        </Card>

        {/* Fatura de Cartões de Crédito */}
        <Card className="p-5 shadow-card border border-border/60 relative overflow-hidden bg-card">
          <div className="absolute top-0 right-0 h-20 w-20 rounded-full bg-purple-500/10 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Faturas de Cartão (Mês)</span>
              <p className="text-2xl font-display font-bold text-purple-600 dark:text-purple-400">
                {fmt(totalFaturasCartao)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {creditCardInvoices.length} cartão(ões) com lançamentos
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600">
              <CreditCard className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Credit Card Invoices Breakdown Widget */}
      {creditCardInvoices.length > 0 && (
        <Card className="p-4 shadow-card border border-purple-500/30 bg-purple-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-purple-600" />
              <h3 className="text-xs font-semibold text-foreground">
                Faturas de Cartão em {formatMonthYear(currentMonth)}
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Total Faturas: {fmt(totalFaturasCartao)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {creditCardInvoices.map((inv) => (
              <div
                key={inv.cardName}
                className="p-3 rounded-xl border border-border/70 bg-background/80 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-0.5 truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground truncate">{inv.cardName}</span>
                    {inv.allPaid ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-normal">
                        Fatura Paga
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 font-normal">
                        Aberta
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {fmt(inv.totalAmount)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {inv.items.length} compra(s)/parcela(s)
                  </p>
                </div>

                {!inv.allPaid ? (
                  <Button
                    size="sm"
                    onClick={() => handlePayCardInvoice(inv.cardName)}
                    className="h-7 text-xs px-2.5 gap-1 bg-purple-600 hover:bg-purple-700 text-white font-medium shrink-0"
                  >
                    <Check className="size-3" /> Pagar Fatura
                  </Button>
                ) : (
                  <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                    <CheckCircle2 className="size-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Tabs: List & Report */}
      <Tabs defaultValue="list" className="space-y-6">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="list" className="text-xs gap-1.5 px-3">
            <Search className="size-3.5" /> Lançamentos ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="report" className="text-xs gap-1.5 px-3">
            <BarChart3 className="size-3.5" /> Gráficos & Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Tab: List */}
        <TabsContent value="list" className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por descrição..."
                className="pl-9 h-8 text-xs bg-background"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Filter className="size-3 mr-1 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos os Tipos</SelectItem>
                <SelectItem value="receita" className="text-xs">Receitas (+)</SelectItem>
                <SelectItem value="despesa" className="text-xs">Despesas (-)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos os Status</SelectItem>
                <SelectItem value="pending" className="text-xs">A Pagar / A Receber</SelectItem>
                <SelectItem value="paid" className="text-xs">Pago / Recebido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCat} onValueChange={setFilterCat}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todas as Categorias</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize text-xs">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCost} onValueChange={setFilterCost}>
              <SelectTrigger className="w-[145px] h-8 text-xs">
                <SelectValue placeholder="Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Todos os Custos</SelectItem>
                <SelectItem value="fixo" className="text-xs">Custo Fixo</SelectItem>
                <SelectItem value="variavel" className="text-xs">Custo Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="shadow-card overflow-hidden border border-border">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                    <th className="text-left px-4 py-3">Descrição / Lançamento</th>
                    <th className="text-left px-4 py-3">Categoria</th>
                    <th className="text-left px-4 py-3">Vencimento / Quitação</th>
                    <th className="text-center px-4 py-3">Status & Ação</th>
                    <th className="text-right px-4 py-3">Valor</th>
                    <th className="text-right px-4 py-3 w-28">Opções</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Saldo Transportado do Mês Anterior (entra como receita disponível no mês atual) */}
                  {includeCarriedOver && saldoTransportado > 0 && (filterType === "all" || filterType === "receita") && (
                    <tr className="bg-emerald-500/10 dark:bg-emerald-950/25 border-b border-emerald-500/30 hover:bg-emerald-500/15 transition">
                      {/* Descrição */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                              <PiggyBank className="size-3.5" />
                            </div>
                            <span className="font-semibold text-emerald-950 dark:text-emerald-100">
                              Saldo Transportado do Mês Anterior
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 font-medium text-[10px]">
                              Sobra em Conta
                            </span>
                            <span>
                              • Sobra de {formatMonthYear(prevMonthStr)} integrada como receita disponível no caixa
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        <Badge variant="outline" className="text-[11px] font-normal capitalize bg-background">
                          Saldo Inicial
                        </Badge>
                      </td>

                      {/* Vencimento e Fechamento */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground block text-xs">
                            Fechamento {prevMonthStr}
                          </span>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Disponível no Caixa
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-emerald-500/30 text-[10px] font-semibold">
                            <Check className="size-3 mr-0.5" /> EM CAIXA
                          </Badge>
                        </div>
                      </td>

                      {/* Valor */}
                      <td className="px-4 py-3 text-right font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                        +{fmt(saldoTransportado)}
                      </td>

                      {/* Opções */}
                      <td className="px-4 py-3 text-right">
                        <Badge variant="secondary" className="text-[10px] font-normal text-muted-foreground">
                          Automático
                        </Badge>
                      </td>
                    </tr>
                  )}

                  {filtered.length === 0 && (!includeCarriedOver || saldoTransportado <= 0 || filterType === "despesa") && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                        Nenhum lançamento encontrado para o período selecionado.
                      </td>
                    </tr>
                  )}
                  {filtered.map((f) => {
                    const parsed = parseFinanceNotes(f.notes);
                    const isReceita = f.type === "receita";

                    return (
                      <tr
                        key={f.id}
                        className={`hover:bg-muted/20 transition ${
                          f.paid ? "bg-muted/5 opacity-80" : ""
                        }`}
                      >
                        {editingInlineId === f.id ? (
                          <>
                            <td className="px-4 py-2">
                              <Input
                                value={inlineTitle}
                                onChange={(e) => setInlineTitle(e.target.value)}
                                className="h-7 text-xs"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <Select value={inlineCategory} onValueChange={setInlineCategory}>
                                <SelectTrigger className="h-7 text-xs capitalize">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c} className="capitalize text-xs">
                                      {c}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-4 py-2">
                              <Input
                                type="date"
                                value={inlineDate}
                                onChange={(e) => setInlineDate(e.target.value)}
                                className="h-7 text-xs"
                              />
                            </td>
                            <td className="px-4 py-2" />
                            <td className="px-4 py-2 text-right">
                              <Input
                                type="number"
                                step="0.01"
                                value={inlineAmount}
                                onChange={(e) => setInlineAmount(e.target.value)}
                                className="h-7 text-xs w-24 ml-auto font-mono"
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => saveInlineEdit(f.id)}
                                  className="p-1 rounded hover:bg-emerald-500/10 text-emerald-600"
                                  title="Confirmar"
                                >
                                  <Check className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingInlineId(null)}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground"
                                  title="Cancelar"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Descrição */}
                            <td className="px-4 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  {isReceita ? (
                                    <TrendingUp className="size-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <TrendingDown className="size-3.5 text-rose-600 shrink-0" />
                                  )}
                                  <span className="font-semibold text-foreground">{f.title}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                  {f.is_credit_card && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-medium">
                                      <CreditCard className="size-3" />
                                      {parsed.cardName || "Cartão"}
                                      {f.installments > 1
                                        ? ` (${f.installment_number}/${f.installments})`
                                        : ""}
                                    </span>
                                  )}
                                  {f.recurring !== "none" && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                                      <Repeat className="size-3" />
                                      {f.recurring === "monthly" ? "Mensal" : "Semanal"}
                                    </span>
                                  )}
                                  {/* Classificação Fixo / Variável */}
                                  {(() => {
                                    const cost = parsed.costType || (f.recurring !== "none" ? "fixo" : "variavel");
                                    return (
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium text-[10px] ${
                                          cost === "fixo"
                                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                                            : "bg-muted text-muted-foreground border border-border/60"
                                        }`}
                                      >
                                        {cost === "fixo" ? "Fixo" : "Variável"}
                                      </span>
                                    );
                                  })()}
                                  {parsed.cleanNotes && (
                                    <span className="truncate max-w-[220px]" title={parsed.cleanNotes}>
                                      • {parsed.cleanNotes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Categoria */}
                            <td className="px-4 py-3 capitalize text-muted-foreground">
                              <Badge variant="outline" className="text-[11px] font-normal capitalize">
                                {f.category}
                              </Badge>
                            </td>

                            {/* Vencimento e Data de Quitação */}
                            <td className="px-4 py-3">
                              <div className="space-y-0.5">
                                {isReceita ? (
                                  <span className="text-muted-foreground/60 block text-[11px]">
                                    Sem vencimento (Receita)
                                  </span>
                                ) : f.due_date ? (
                                  <span className="text-muted-foreground block text-xs">
                                    Venc: {formatDate(f.due_date)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/60 block text-[11px] italic">
                                    Sem vencimento
                                  </span>
                                )}
                                {f.paid ? (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="size-3" />
                                    {isReceita ? "Recebido em " : "Pago em "}
                                    {formatDate(parsed.paymentDate || f.date)}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <Clock className="size-3" /> {isReceita ? "Aguardando Recebimento" : "Pendente"}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Status & Botão de Ação Rápida */}
                            <td className="px-4 py-3 text-center">
                              {f.paid ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] font-medium hover:bg-emerald-500/20">
                                    <Check className="size-3 mr-0.5" /> {isReceita ? "RECEBIDO" : "PAGO"}
                                  </Badge>
                                  <button
                                    onClick={() => handleTogglePaidWithDate(f, false)}
                                    className="text-[10px] text-muted-foreground hover:text-foreground underline ml-1"
                                    title="Desmarcar quitação"
                                  >
                                    Reverter
                                  </button>
                                </div>
                              ) : isReceita ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px]">
                                    A RECEBER
                                  </Badge>
                                  <Button
                                    size="sm"
                                    onClick={() => handleTogglePaidWithDate(f, true)}
                                    className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 shadow-xs"
                                  >
                                    <Check className="size-3" /> RECEBIDO
                                  </Button>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5">
                                  <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 text-[10px]">
                                    A PAGAR
                                  </Badge>
                                  <Button
                                    size="sm"
                                    onClick={() => handleTogglePaidWithDate(f, true)}
                                    className="h-6 px-2 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 shadow-xs"
                                  >
                                    <Check className="size-3" /> PAGO
                                  </Button>
                                </div>
                              )}
                            </td>

                            {/* Valor */}
                            <td
                              className={`px-4 py-3 text-right font-bold font-mono text-sm ${
                                isReceita ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                              }`}
                            >
                              {isReceita ? "+" : "-"}
                              {fmt(Number(f.amount))}
                            </td>

                            {/* Opções */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => startInlineEdit(f)}
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Editar rápido"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => openEdit(f)}
                                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Editar completo"
                                >
                                  <CreditCard className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(f.id)}
                                  className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                                  title="Excluir lançamento"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab: Report */}
        <TabsContent value="report" className="space-y-6">
          <Card className="p-4 shadow-card border border-border">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Filtro de Período</Label>
                <Select value={reportMode} onValueChange={(v) => setReportMode(v as "month" | "range")}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month" className="text-xs">Mês</SelectItem>
                    <SelectItem value="range" className="text-xs">Intervalo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportMode === "month" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Mês de Referência</Label>
                  <Input
                    type="month"
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-[180px] h-8 text-xs"
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">De</Label>
                    <Input
                      type="date"
                      value={reportFrom}
                      onChange={(e) => setReportFrom(e.target.value)}
                      className="w-[150px] h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Até</Label>
                    <Input
                      type="date"
                      value={reportTo}
                      onChange={(e) => setReportTo(e.target.value)}
                      className="w-[150px] h-8 text-xs"
                    />
                  </div>
                </>
              )}

              <div className="ml-auto flex items-center gap-3">
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-600 font-semibold">{fmt(reportTotalReceita)}</span>
                  {" · "}
                  <span className="text-rose-600 font-semibold">{fmt(reportTotalDespesa)}</span>
                  {" · Saldo "}
                  <span
                    className={
                      reportSaldo >= 0
                        ? "text-emerald-600 font-bold"
                        : "text-rose-600 font-bold"
                    }
                  >
                    {fmt(reportSaldo)}
                  </span>
                </p>
                <Button size="sm" variant="outline" onClick={exportPDF} className="h-8 text-xs gap-1.5">
                  <Download className="size-3.5" /> Exportar PDF
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-card border border-border">
            <h3 className="font-display font-bold text-base mb-4">Receitas vs Despesas (Histórico Mensal)</h3>
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground text-xs text-center py-8">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Bar dataKey="receita" name="Receitas" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6 shadow-card border border-border">
            <h3 className="font-display font-bold text-base mb-4">Evolução do Saldo</h3>
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground text-xs text-center py-8">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#0891b2" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 shadow-card border border-border">
              <h3 className="font-display font-bold text-base mb-4">Despesas por Categoria</h3>
              {categoryData.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-8">Sem despesas no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={(p: any) => `${p.name ?? ""} ${((p.percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-6 shadow-card border border-border">
              <h3 className="font-display font-bold text-base mb-4">Receitas por Categoria</h3>
              {categoryIncomeData.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-8">Sem receitas no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryIncomeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      label={(p: any) => `${p.name ?? ""} ${((p.percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {categoryIncomeData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
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

      {/* Dialog de Importação CSV */}
      <ImportCsvDialog
        open={importCsvOpen}
        onOpenChange={setImportCsvOpen}
        onImport={handleImportCsv}
      />

      {/* Dialog para Excluir / Limpar Lançamentos */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-destructive mb-1">
              <div className="p-2 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="size-5" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                Excluir Lançamentos Financeiros
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecione se deseja remover apenas os lançamentos deste mês ou limpar completamente todo o banco de dados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            {/* Opção 1: Apenas do mês atual */}
            <div
              onClick={() => setClearScope("month")}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                clearScope === "month"
                  ? "border-destructive bg-destructive/5 ring-1 ring-destructive/40"
                  : "border-border/70 hover:bg-muted/40"
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`size-4 rounded-full border flex items-center justify-center ${
                    clearScope === "month"
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {clearScope === "month" && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-foreground">
                    Excluir apenas de {formatMonthYear(currentMonth)}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {monthItems.length} lançamento(s)
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Remove somente as despesas e receitas cadastradas para este mês. Os outros meses permanecem intactos.
                </p>
              </div>
            </div>

            {/* Opção 2: Limpar todo o banco de dados */}
            <div
              onClick={() => setClearScope("all")}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                clearScope === "all"
                  ? "border-destructive bg-destructive/10 ring-2 ring-destructive"
                  : "border-border/70 hover:bg-muted/40"
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`size-4 rounded-full border flex items-center justify-center ${
                    clearScope === "all"
                      ? "border-destructive bg-destructive text-destructive-foreground"
                      : "border-muted-foreground/40"
                  }`}
                >
                  {clearScope === "all" && <div className="size-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-destructive flex items-center gap-1">
                    <Trash2 className="size-3" /> Limpar TODO o banco de dados (Zerar tudo)
                  </span>
                  <Badge variant="destructive" className="text-[10px]">
                    {items.length} total
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Apaga <strong>todos os meses</strong> e todo o histórico financeiro da sua conta. Ideal para reiniciar os lançamentos do zero.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>Esta operação é permanente e não poderá ser desfeita após a confirmação.</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={clearing}
              onClick={() => setClearDialogOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={
                clearing ||
                (clearScope === "month" && monthItems.length === 0) ||
                (clearScope === "all" && items.length === 0)
              }
              onClick={handleClearFinances}
              className="text-xs gap-1.5 font-semibold"
            >
              {clearing ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="size-3.5" />
                  {clearScope === "all" ? "Sim, Limpar Todo o Banco" : "Sim, Excluir Deste Mês"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
