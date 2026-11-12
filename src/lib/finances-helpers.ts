/**
 * Helpers para o Módulo de Finanças Pessoais EXACTA
 */

export interface ParsedNotes {
  cleanNotes: string;
  cardName: string | null;
  paymentDate: string | null;
  costType: "fixo" | "variavel" | null;
}

/**
 * Extrai tags especiais dos campos de observação como [Custo: Fixo], [Cartão: Nubank] e [Pago em: 2026-11-12]
 */
export function parseFinanceNotes(notes: string | null | undefined): ParsedNotes {
  if (!notes) {
    return { cleanNotes: "", cardName: null, paymentDate: null, costType: null };
  }

  let text = notes;
  let cardName: string | null = null;
  let paymentDate: string | null = null;
  let costType: "fixo" | "variavel" | null = null;

  // Extrai classificação de custo (Fixo ou Variável)
  const costMatch = text.match(/\[(?:Custo|TipoCusto):\s*([^\]]+)\]/i);
  if (costMatch) {
    const raw = costMatch[1].trim().toLowerCase();
    costType = raw.includes("fix") ? "fixo" : "variavel";
    text = text.replace(costMatch[0], "").trim();
  }

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
    costType,
  };
}

/**
 * Constrói string de notas com metadados estruturados
 */
export function buildFinanceNotes(
  cleanNotes: string,
  cardName?: string | null,
  paymentDate?: string | null,
  costType?: "fixo" | "variavel" | null
): string | null {
  const tags: string[] = [];

  if (costType) {
    tags.push(`[Custo: ${costType === "fixo" ? "Fixo" : "Variável"}]`);
  }

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
    "custo", // fixo ou variavel
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
      "fixo",
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
      "fixo",
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
      "variavel",
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
      "variavel",
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
      "fixo",
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
  rowNumber: number;
  title: string;
  amount: number;
  type: "receita" | "despesa";
  category: string;
  dueDate: string | null;
  costType: "fixo" | "variavel";
  recurring: "none" | "monthly" | "weekly";
  isCreditCard: boolean;
  cardName: string;
  installments: number;
  notes: string;
  isValid: boolean;
  error?: string;
}

/**
 * Converte datas brasileiras (DD/MM/AAAA) ou ISO (AAAA-MM-DD) para padrão AAAA-MM-DD
 * Se vazio, retorna null (indicando ausência intencional de data de vencimento)
 */
export function normalizeCsvDate(rawDate?: string | null): { date: string | null; isValid: boolean } {
  if (!rawDate) return { date: null, isValid: true };
  const cleaned = rawDate.trim();
  if (!cleaned) return { date: null, isValid: true };

  // Já está em YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return { date: cleaned, isValid: true };
  }

  // Formato brasileiro DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, "0");
    const month = brMatch[2].padStart(2, "0");
    const year = brMatch[3];
    return { date: `${year}-${month}-${day}`, isValid: true };
  }

  // Tenta converter date genérica
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return { date: parsed.toISOString().split("T")[0], isValid: true };
  }

  return { date: null, isValid: false };
}

/**
 * Divide linha de CSV respeitando aspas duplas escapadas
 */
function splitCsvLine(line: string, sep: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // pula aspas escapadas
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === sep && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map((c) => c.replace(/^["']|["']$/g, "").trim());
}

/**
 * Lê e interpreta conteúdo de arquivo CSV com diagnóstico preciso de inconsistências
 */
export function parseFinancesCsv(csvText: string): CsvParsedRow[] {
  // Remove BOM se presente
  const cleanText = csvText.replace(/^\uFEFF/, "").trim();
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length <= 1) return [];

  // Detecta separador (; ou , ou \t)
  const headerLine = lines[0];
  const sep = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";

  const headerCols = splitCsvLine(headerLine, sep).map((h) =>
    h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
  );

  const getColIdx = (aliases: string[], fallbackIdx: number): number => {
    const found = headerCols.findIndex((h) => aliases.some((a) => h.includes(a)));
    return found >= 0 ? found : fallbackIdx;
  };

  const hasCostHeader = headerCols.some((h) => h.includes("cust") || h.includes("fix"));
  const titleIdx = getColIdx(["desc", "titul", "nome"], 0);
  const amountIdx = getColIdx(["val", "quant"], 1);
  const typeIdx = getColIdx(["tip", "naturez"], 2);
  const catIdx = getColIdx(["cat"], 3);
  const dueIdx = getColIdx(["venc", "data"], 4);
  const costIdx = getColIdx(["cust", "fixo", "classif"], hasCostHeader ? 5 : -1);
  const recIdx = getColIdx(["recorren", "mensal", "period"], hasCostHeader ? 6 : 5);
  const ccIdx = getColIdx(["cartao_cred", "credito", "cartao"], hasCostHeader ? 7 : 6);
  const cardNameIdx = getColIdx(["cartao_nom", "banco", "bandeir"], hasCostHeader ? 8 : 7);
  const instIdx = getColIdx(["parcel"], hasCostHeader ? 9 : 8);
  const notesIdx = getColIdx(["obs", "not", "detalh"], hasCostHeader ? 10 : 9);

  const rows: CsvParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = splitCsvLine(line, sep);

    const rawTitle = cols[titleIdx] || "";
    const rawAmount = cols[amountIdx] || "";
    const rawType = (cols[typeIdx] || "despesa").toLowerCase();
    const rawCategory = cols[catIdx] || "outros";
    const rawDueDate = cols[dueIdx] || "";
    const rawCost = costIdx >= 0 ? cols[costIdx] || "" : "";
    const rawRec = (cols[recIdx] || "none").toLowerCase();
    const rawCc = (cols[ccIdx] || "").toLowerCase();
    const rawCardName = cols[cardNameIdx] || "Nubank";
    const rawInst = parseInt(cols[instIdx] || "1", 10);
    const notes = cols[notesIdx] || "";

    const title = rawTitle.trim();
    let error: string | undefined;

    // Validação da Descrição
    if (!title) {
      error = "Descrição do lançamento em branco";
    }

    // Parse do Valor Numérico
    const cleanAmount = String(rawAmount)
      .replace(/R\$\s?/gi, "")
      .replace(/\s+/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const amount = parseFloat(cleanAmount);

    if (!error && (isNaN(amount) || amount <= 0)) {
      error = `Valor numérico inválido ou zerado (encontrado: "${rawAmount || "vazio"}")`;
    }

    // Validação e normalização da Data de Vencimento
    const dateNorm = normalizeCsvDate(rawDueDate);
    if (!error && !dateNorm.isValid) {
      error = `Data de vencimento inválida: "${rawDueDate}". Utilize o formato DD/MM/AAAA ou AAAA-MM-DD.`;
    }

    let type: "receita" | "despesa" = "despesa";
    if (rawType.includes("receit") || rawType.includes("entrada") || rawType.includes("receber")) {
      type = "receita";
    }

    let recurring: "none" | "monthly" | "weekly" = "none";
    if (rawRec === "monthly" || rawRec === "mensal") recurring = "monthly";
    if (rawRec === "weekly" || rawRec === "semanal") recurring = "weekly";

    // Tipo de Custo: Fixo ou Variável
    let costType: "fixo" | "variavel" = "variavel";
    if (rawCost) {
      const cleanCost = rawCost.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      costType = cleanCost.includes("fix") ? "fixo" : "variavel";
    } else if (recurring !== "none") {
      costType = "fixo";
    }

    const isCreditCard =
      type === "despesa" &&
      (rawCc === "sim" || rawCc === "s" || rawCc === "true" || rawCc === "1" || rawCardName.length > 0);

    const installments = isNaN(rawInst) || rawInst < 1 ? 1 : rawInst;
    const isValid = !error;

    rows.push({
      rowNumber: i + 1,
      title: title || `Lançamento Linha ${i + 1}`,
      amount: isNaN(amount) ? 0 : amount,
      type,
      category: rawCategory.toLowerCase() || "outros",
      dueDate: dateNorm.date, // null se o usuário não preencheu!
      costType,
      recurring,
      isCreditCard,
      cardName: rawCardName,
      installments,
      notes,
      isValid,
      error,
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


