import { askAI } from "@/lib/ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

type Content =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } };

export async function callGateway(system: string, content: Content[]): Promise<string> {
  const textParts = content.map((c) => {
    if (c.type === "text") return c.text;
    if (c.type === "file") return `[Arquivo anexado: ${c.file.filename}]`;
    return "";
  }).filter(Boolean);

  const fullPrompt = `${system}\n\nENTRADA E DADOS PARA ANÁLISE:\n${textParts.join("\n")}`;

  try {
    return await askAI(fullPrompt, "bi_dashboard_generation");
  } catch (e: any) {
    console.warn("Falha ao chamar provedor de IA para BI:", e);
    throw new Error(e?.message || "Erro ao processar dados na IA.");
  }
}

export function parseJson<T>(text: string, fallback: T): T {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export const DASHBOARD_SYSTEM = `Você é um analista de BI. Recebe o esquema e uma amostra de um conjunto de dados e devolve a especificação de um dashboard executivo em JSON.

Responda SOMENTE com JSON no formato:
{
  "title": string,
  "subtitle": string,
  "kpis": [{ "label": string, "field": string|null, "agg": "sum"|"count"|"avg"|"min"|"max"|"distinct", "filterField": string|null, "filterValue": string|null }],
  "charts": [{ "title": string, "type": "bar"|"barH"|"stackedBar"|"line"|"area"|"stackedArea"|"pie"|"donut"|"radar"|"radialBar"|"scatter"|"composed"|"treemap"|"funnel", "dimension": string, "measure": string|null, "agg": "sum"|"count"|"avg"|"min"|"max"|"distinct", "series": string|null, "limit": number, "span": 1|2|3 }],
  "insights": [string]
}

Regras:
- Use APENAS nomes de colunas existentes no esquema informado.
- 4 a 5 KPIs e 6 a 9 gráficos, com "span" 2 ou 3 (nunca 1), variando os tipos (pizza/rosca para composição, barras para ranking, linha/área para tempo, radar/treemap/funil quando fizer sentido).
- "measure" null com agg "count" conta registros.
- Use "filterField"/"filterValue" para KPIs de um único status/categoria (ex.: label "Finalizadas" -> filterField "status", filterValue "Finalizada"); use exatamente um valor presente na amostra. Deixe ambos null quando o KPI for total.
- "series" só quando existir uma coluna categórica adicional relevante (para empilhado/combinado).
- Títulos, insights e labels em português do Brasil, curtos e diretos.
- 3 a 5 insights objetivos com números reais da amostra.`;

export const PDF_SYSTEM = `Você extrai dados tabulares de documentos. Leia o arquivo e devolva SOMENTE JSON:
{ "rows": [ { "coluna": valor } ] }
Regras: use nomes de colunas consistentes em todas as linhas, valores numéricos como número, no máximo 400 linhas, sem comentários. Se o documento não tiver tabela, deduza registros a partir do conteúdo estruturado.`;
