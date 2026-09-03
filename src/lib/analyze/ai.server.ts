import { askAI } from "@/lib/ai";

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

export const DASHBOARD_SYSTEM = `Você é um analista sênior de Business Intelligence & Data Science. Recebe o esquema e uma amostra representativa de um conjunto de dados e deve devolver a especificação completa de um dashboard executivo altamente elaborado em JSON.

Responda SOMENTE com JSON no formato:
{
  "title": string,
  "subtitle": string,
  "kpis": [{ "label": string, "field": string|null, "agg": "sum"|"count"|"avg"|"min"|"max"|"distinct", "filterField": string|null, "filterValue": string|null, "format": "compact"|"currency"|"percent"|"decimal"|"none" }],
  "charts": [{ "title": string, "type": "bar"|"barH"|"stackedBar"|"line"|"area"|"stackedArea"|"pie"|"donut"|"radar"|"radialBar"|"scatter"|"composed"|"treemap"|"funnel", "dimension": string, "measure": string|null, "agg": "sum"|"count"|"avg"|"min"|"max"|"distinct", "series": string|null, "limit": number, "span": 1|2|3 }],
  "insights": [string]
}

Regras Obrigatórias:
- Use APENAS nomes de colunas exatos que existam no esquema informado.
- Gere exatamente 5 KPIs estratégicos e entre 8 a 10 gráficos variados e aprofundados.
- VARIE AO MÁXIMO OS TIPOS DE GRÁFICOS: use pelo menos 1 gráfico de área/linha para evolução ou série, 1 gráfico de rosca/pizza para composição percentual, 1 gráfico de barras horizontais (barH) para top rankings, 1 gráfico empilhado (stackedBar) ou combinado (composed) para cruzamento de categorias, 1 gráfico de radar ou funil, e 1 treemap ou radialBar.
- Definir "span": 3 para todos os gráficos para ocuparem de forma proporcional a grade executiva.
- "measure" null com agg "count" conta quantidade de registros.
- Use "format": "currency" para colunas financeiras (preço, valor, custo, receita), "percent" para taxas, "compact" ou "decimal" para quantidades e totais.
- Títulos dos gráficos e labels em português do Brasil, extremamente claros, executivos e profissionais.
- Inclua de 4 a 6 insights analíticos ricos detalhando padrões, outliers e oportunidades observadas na amostra.`;

export const PDF_SYSTEM = `Você extrai dados tabulares de documentos. Leia o arquivo e devolva SOMENTE JSON:
{ "rows": [ { "coluna": valor } ] }
Regras: use nomes de colunas consistentes em todas as linhas, valores numéricos como número, no máximo 400 linhas, sem comentários. Se o documento não tiver tabela, deduza registros a partir do conteúdo estruturado.`;
