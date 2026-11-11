import { askAI, type AIConfig } from "@/lib/ai";

type Content =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } };

export async function callGateway(
  system: string,
  content: Content[],
  customConfig?: Partial<AIConfig>
): Promise<string> {
  const textParts = content
    .map((c) => {
      if (c.type === "text") return c.text;
      if (c.type === "file") return `[Arquivo anexado: ${c.file.filename}]`;
      return "";
    })
    .filter(Boolean);

  const fullPrompt = `${system}\n\nENTRADA E DADOS PARA ANÁLISE:\n${textParts.join("\n")}`;

  try {
    return await askAI(fullPrompt, "bi_dashboard_generation", customConfig);
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

export const DASHBOARD_SYSTEM = `Você é um Head de Business Intelligence, Estatística & Decision Science.
Você recebe o nome do conjunto de dados, o total de registros, as colunas mapeadas e uma amostra representativa real.
Seu objetivo é gerar um dashboard executivo de ALTÍSSIMO NÍVEL analítico, com total nexo de negócios, gráficos coesos e insights profundos baseados em dados reais.

Responda ESTRITAMENTE em formato JSON:
{
  "title": string,
  "subtitle": string,
  "kpis": [
    {
      "label": string,
      "field": string | null,
      "agg": "sum" | "count" | "avg" | "min" | "max" | "distinct",
      "filterField": string | null,
      "filterValue": string | null,
      "format": "compact" | "currency" | "percent" | "decimal" | "integer" | "none"
    }
  ],
  "charts": [
    {
      "title": string,
      "type": "bar" | "barH" | "stackedBar" | "line" | "area" | "pie" | "donut" | "scatter" | "composed" | "treemap" | "radar" | "funnel",
      "dimension": string,
      "measure": string | null,
      "agg": "sum" | "count" | "avg" | "min" | "max" | "distinct",
      "series": string | null,
      "limit": number,
      "span": 1 | 2 | 3,
      "format": "compact" | "currency" | "percent" | "decimal" | "integer"
    }
  ],
  "insights": [string]
}

DIRETRIZES CRÍTICAS DE COERÊNCIA & QUALIDADE:

1. COMPREENSÃO DO DOMÍNIO DE NEGÓCIO:
   - Identifique primeiro a área dos dados (ex: Vendas/Comercial, Financeiro, Gestão de Projetos/Tarefas, Recursos Humanos, Estoque/Logística, SAC/Suporte, Saúde, etc.).
   - Adapte os títulos, KPIs e gráficos para o vocabulário executivo específico desse domínio.

2. KPIs EXECUTIVOS (Gere de 4 a 5 indicadores estratégicos):
   - Combine métricas de VOLUME (contagem de registros ou soma de itens), FINANCEIRO (soma de receitas/custos com "format": "currency"), EFICIÊNCIA/MÉDIA (ticket médio, tempo médio, valor médio por transação com "format": "currency" ou "decimal") e DIVERSIDADE (contagem distinta de clientes, categorias ou responsáveis com agg: "distinct").
   - Labels claros e elegantes em português (ex: "Receita Consolidada", "Volume Total de Pedidos", "Ticket Médio", "Clientes Ativos").

3. SELEÇÃO DE GRÁFICOS INTELIGENTE & SEM REPETIÇÃO (Gere entre 6 a 8 gráficos com NEXO TOTAL):
   - APENAS use tipos de gráficos matematicamente adequados:
     * "bar" ou "barH": Para rankings de categorias (Top Categorias, Top Vendedores, Top Regiões). Use "barH" para nomes de categorias longos.
     * "area" ou "line": APENAS se houver campos de DATA ou TEMPO. Demonstre tendências históricas ou evolução sazonal.
     * "donut" ou "pie": APENAS para categorias com poucas opções (entre 2 a 6 itens, como status, gênero, tipo, segmento). NUNCA use pizza para campos com dezenas de itens.
     * "stackedBar": Quando houver cruzamento relevante entre duas variáveis categóricas (ex: Status por Departamento, Categoria por Canal).
     * "composed": Quando for relevante comparar Volume (contagem/soma) com Média (ex: Volume de Vendas vs Preço Médio).
     * "scatter": Quando houver duas variáveis numéricas contínuas para analisar dispersão/correlação.
     * "treemap": Para composição hierárquica proporcional onde há uma categoria com muitos sub-itens.
     * "funnel": USE APENAS se houver etapas sequenciais explícitas de funil/pipeline (ex: Prospect -> Proposta -> Negociação -> Fechado). Se não for funil sequencial, NÃO use funnel!
     * "radar": USE APENAS se houver múltiplos scores ou critérios de avaliação comparativa (1 a 5, notas). Se não houver, NÃO use radar!
   - Use "span": 3 para manter o layout limpo e proporcional no grid executivo.
   - Use APENAS nomes de colunas que existam no esquema informado.

4. INSIGHTS PROFUNDOS & NÃO-REPETITIVOS (Gere de 4 a 6 insights detalhados):
   - CADA INSIGHT DEVE CONTER DADOS OU PROPORÇÕES ESPECÍFICAS observadas na amostra.
   - NUNCA use frases genéricas vazias como "A categoria X representa o principal eixo".
   - Estruture insights incluindo:
     * [Destaque / Pareto 80/20]: "O principal motor é [X], concentrando a maior fatia do resultado."
     * [Padrão Temporal / Sazonal]: Se houver datas, analise picos, vales ou concentração em períodos.
     * [Anomalia / Outlier]: Aponte registros atípicos, dispersões altas ou categorias com baixa performance.
     * [Recomendação de Decisão]: Indique uma ação prática e objetiva para o gestor tomar baseada nos dados.
`;

export const PDF_SYSTEM = `Você extrai dados tabulares de documentos. Leia o arquivo e devolva SOMENTE JSON:
{ "rows": [ { "coluna": valor } ] }
Regras: use nomes de colunas consistentes em todas as linhas, valores numéricos como número, no máximo 400 linhas, sem comentários. Se o documento não tiver tabela, deduza registros a partir do conteúdo estruturado.`;
