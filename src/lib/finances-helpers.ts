/**
 * Helpers para o Módulo de Finanças Pessoais EXACTA
 */

export interface ParsedNotes {
  cleanNotes: string;
  cardName: string | null;
  paymentDate: string | null;
}

/**
 * Extrai tags especiais dos campos de observação como [Cartão: Nubank] e [Pago em: 2026-11-12]
 */
export function parseFinanceNotes(notes: string | null | undefined): ParsedNotes {
  if (!notes) {
    return { cleanNotes: "", cardName: null, paymentDate: null };
  }

  let text = notes;
  let cardName: string | null = null;
  let paymentDate: string | null = null;

  // Extrai nome do cartão
  const cardMatch = text.match(/\[(?:Cartão|Cartao):\s*([^\]]+)\]/i);
  if (cardMatch) {
    cardName = cardMatch[1].trim();
    text = text.replace(cardMatch[0], "").trim();
  }

  // Extrai data de pagamento/recebimento
  const payMatch = text.match(/\[(?:Pago em|Recebido em):\s*([^\]]+)\]/i);
  if (payMatch) {
    paymentDate = payMatch[1].trim();
    text = text.replace(payMatch[0], "").trim();
  }

  return {
    cleanNotes: text.trim(),
    cardName,
    paymentDate,
  };
}

/**
 * Constrói string de notas com metadados estruturados
 */
export function buildFinanceNotes(
  cleanNotes: string,
  cardName?: string | null,
  paymentDate?: string | null
): string | null {
  const tags: string[] = [];

  if (cardName && cardName.trim()) {
    tags.push(`[Cartão: ${cardName.trim()}]`);
  }

  if (paymentDate && paymentDate.trim()) {
    tags.push(`[Pago em: ${paymentDate.trim()}]`);
  }

  const trimmedNotes = (cleanNotes || "").trim();
  if (trimmedNotes) {
    tags.push(trimmedNotes);
  }

  const result = tags.join(" ").trim();
  return result || null;
}

/**
 * Navegação e formatação de mês
 */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr || !monthStr.includes("-")) return monthStr;
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1, 15);
  const name = date.toLocaleDateString("pt-BR", { month: "long" });
  return `${name.charAt(0).toUpperCase() + name.slice(1)} de ${year}`;
}

export function getPrevMonth(currentMonthStr: string): string {
  const [y, m] = currentMonthStr.split("-").map(Number);
  const d = new Date(y, m - 2, 15);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getNextMonth(currentMonthStr: string): string {
  const [y, m] = currentMonthStr.split("-").map(Number);
  const d = new Date(y, m, 15);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Gera arquivo modelo CSV para download
 */
export function generateCsvTemplate(): string {
  const headers = [
    "descricao",
    "valor",
    "tipo",
    "categoria",
    "vencimento",
    "recorrente",
    "cartao_credito",
    "cartao_nome",
    "parcelas",
    "observacoes",
  ];

  const samples = [
    [
      "Salário Empresa",
      "5000.00",
      "receita",
      "salário",
      "2026-11-05",
      "monthly",
      "nao",
      "",
      "1",
      "Recebimento mensal CLT",
    ],
    [
      "Aluguel Apartamento",
      "1600.00",
      "despesa",
      "moradia",
      "2026-11-10",
      "monthly",
      "nao",
      "",
      "1",
      "Boleto condomínio e aluguel",
    ],
    [
      "Supermercado Mensal",
      "650.00",
      "despesa",
      "alimentação",
      "2026-11-15",
      "none",
      "sim",
      "Nubank",
      "3",
      "Compras parceladas no cartão",
    ],
    [
      "Consultoria / Freelance",
      "1200.00",
      "receita",
      "freelance",
      "2026-11-20",
      "none",
      "nao",
      "",
      "1",
      "A receber pelo projeto web",
    ],
    [
      "Internet Fibra",
      "99.90",
      "despesa",
      "moradia",
      "2026-11-25",
      "monthly",
      "nao",
      "",
      "1",
      "Mensalidade internet",
    ],
  ];

  // Adiciona BOM UTF-8 (\uFEFF) para abrir com acentuação correta no Excel brasileiro
  const content = [
    headers.join(";"),
    ...samples.map((row) => row.join(";")),
  ].join("\r\n");

  return "\uFEFF" + content;
}

export interface CsvParsedRow {
  title: string;
  amount: number;
  type: "receita" | "despesa";
  category: string;
  dueDate: string;
  recurring: "none" | "monthly" | "weekly";
  isCreditCard: boolean;
  cardName: string;
  installments: number;
  notes: string;
  isValid: boolean;
  error?: string;
}

/**
 * Lê e interpreta conteúdo de arquivo CSV
 */
export function parseFinancesCsv(csvText: string): CsvParsedRow[] {
  // Remove BOM se presente
  const cleanText = csvText.replace(/^\uFEFF/, "").trim();
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) return [];

  // Detecta separador (; ou ,)
  const headerLine = lines[0];
  const sep = headerLine.includes(";") ? ";" : ",";

  const rows: CsvParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(sep).map((c) => c.replace(/^["']|["']$/g, "").trim());

    const title = cols[0] || `Lançamento ${i}`;
    const rawAmount = cols[1] || "0";
    const rawType = (cols[2] || "despesa").toLowerCase();
    const category = (cols[3] || "outros").toLowerCase();
    const dueDate = cols[4] || new Date().toISOString().split("T")[0];
    const rawRec = (cols[5] || "none").toLowerCase();
    const rawCc = (cols[6] || "").toLowerCase();
    const cardName = cols[7] || "Nubank";
    const rawInst = parseInt(cols[8] || "1", 10);
    const notes = cols[9] || "";

    // Parse amount
    const cleanAmount = rawAmount
      .replace(/R\$\s?/gi, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const amount = parseFloat(cleanAmount);

    let type: "receita" | "despesa" = "despesa";
    if (rawType.includes("receit") || rawType.includes("entrada") || rawType.includes("receber")) {
      type = "receita";
    }

    let recurring: "none" | "monthly" | "weekly" = "none";
    if (rawRec === "monthly" || rawRec === "mensal") recurring = "monthly";
    if (rawRec === "weekly" || rawRec === "semanal") recurring = "weekly";

    const isCreditCard =
      type === "despesa" &&
      (rawCc === "sim" || rawCc === "s" || rawCc === "true" || rawCc === "1" || cardName.length > 0);

    const installments = isNaN(rawInst) || rawInst < 1 ? 1 : rawInst;

    const isValid = !isNaN(amount) && amount > 0 && title.length > 0;

    rows.push({
      title,
      amount: isNaN(amount) ? 0 : amount,
      type,
      category,
      dueDate,
      recurring,
      isCreditCard,
      cardName,
      installments,
      notes,
      isValid,
      error: !isValid ? "Valor ou descrição inválida" : undefined,
    });
  }

  return rows;
}

/**
 * Calcula o saldo que sobrou em conta no fechamento do mês anterior (ou histórico acumulado)
 */
export function calculateCarriedOverBalance(
  items: Array<{ amount: number; type: string; paid: boolean; due_date: string | null; date: string }>,
  currentMonth: string
): { carriedBalance: number; prevMonthSurplus: number; prevMonth: string } {
  const prevMonth = getPrevMonth(currentMonth);

  // 1. Itens exclusivamente do mês imediatamente anterior
  const prevItems = items.filter((f) => {
    const d = f.due_date || f.date;
    return d && d.startsWith(prevMonth);
  });
  const recPagasPrev = prevItems
    .filter((f) => f.type === "receita" && f.paid)
    .reduce((s, f) => s + Number(f.amount), 0);
  const despPagasPrev = prevItems
    .filter((f) => f.type === "despesa" && f.paid)
    .reduce((s, f) => s + Number(f.amount), 0);
  const prevMonthSurplus = recPagasPrev - despPagasPrev;

  // 2. Itens quitados acumulados antes do mês atual (saldo geral em caixa que transitou)
  const allPastItems = items.filter((f) => {
    const d = f.due_date || f.date;
    return d && d < currentMonth;
  });
  const totalRecPast = allPastItems
    .filter((f) => f.type === "receita" && f.paid)
    .reduce((s, f) => s + Number(f.amount), 0);
  const totalDespPast = allPastItems
    .filter((f) => f.type === "despesa" && f.paid)
    .reduce((s, f) => s + Number(f.amount), 0);
  const accumulatedPast = totalRecPast - totalDespPast;

  // Se houver saldo positivo acumulado no histórico, esse é o saldo real transportado em caixa.
  // Caso contrário, se o mês imediatamente anterior foi positivo, usamos ele.
  let carried = 0;
  if (accumulatedPast > 0) {
    carried = accumulatedPast;
  } else if (prevMonthSurplus > 0) {
    carried = prevMonthSurplus;
  }

  return {
    carriedBalance: Math.round(carried * 100) / 100,
    prevMonthSurplus: Math.round(prevMonthSurplus * 100) / 100,
    prevMonth,
  };
}


