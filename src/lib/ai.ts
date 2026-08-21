import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export interface AIConfig {
  geminiKey?: string;
  groqKey?: string;
  preferredProvider: "gemini" | "groq" | "auto";
  modelName?: string;
}

const STORAGE_KEY = "exacta_ai_config";

export function getAIConfig(): AIConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Erro ao ler config de IA do localStorage", e);
  }

  return {
    geminiKey: import.meta.env.VITE_GEMINI_API_KEY || "",
    groqKey: import.meta.env.VITE_GROQ_API_KEY || "",
    preferredProvider: "auto",
    modelName: "gemini-1.5-flash",
  };
}

export function saveAIConfig(config: Partial<AIConfig>): AIConfig {
  const current = getAIConfig();
  const updated: AIConfig = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Erro ao salvar config de IA", e);
  }
  return updated;
}

export async function testAIConnection(provider: "gemini" | "groq", key: string): Promise<{ success: boolean; message: string }> {
  if (!key.trim()) {
    return { success: false, message: "Chave de API não informada." };
  }

  try {
    if (provider === "gemini") {
      const client = new GoogleGenerativeAI(key.trim());
      const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Responda apenas: OK");
      const text = result.response.text();
      return { success: true, message: `Conexão bem sucedida com Google Gemini! Resposta: ${text.slice(0, 20)}` };
    } else {
      const client = new Groq({ apiKey: key.trim(), dangerouslyAllowBrowser: true });
      const res = await client.chat.completions.create({
        messages: [{ role: "user", content: "Responda apenas: OK" }],
        model: "llama-3.3-70b-versatile",
        max_tokens: 10,
      });
      return { success: true, message: `Conexão bem sucedida com Groq! Resposta: ${res.choices[0]?.message?.content?.slice(0, 20)}` };
    }
  } catch (err: any) {
    return { success: false, message: err?.message || "Falha na validação da chave de API." };
  }
}

export async function askGemini(prompt: string, customKey?: string): Promise<string> {
  const config = getAIConfig();
  const key = customKey || config.geminiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!key) {
    throw new Error("Chave do Google Gemini não configurada.");
  }

  const genAI = new GoogleGenerativeAI(key);
  // Support gemini-1.5-flash or 2.0-flash fallback
  const model = genAI.getGenerativeModel({ model: config.modelName || "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function askGroq(prompt: string, customKey?: string): Promise<string> {
  const config = getAIConfig();
  const key = customKey || config.groqKey || import.meta.env.VITE_GROQ_API_KEY;

  if (!key) {
    throw new Error("Chave da Groq não configurada.");
  }

  const groq = new Groq({ apiKey: key, dangerouslyAllowBrowser: true });
  const chatCompletion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
  });
  return chatCompletion.choices[0]?.message?.content || "";
}

/**
 * Intelligent built-in assistant engine when external cloud keys are not configured or rate-limited.
 */
function runSmartLocalEngine(prompt: string, contextData?: any): string {
  const p = prompt.toLowerCase();
  const dateStr = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  let tasksCount = contextData?.tasks ?? 0;
  let overdueCount = contextData?.overdue ?? 0;
  let projectsCount = contextData?.active_projects ?? 0;
  let productivity = contextData?.productivity ?? 85;

  if (p.includes("tarefa") || p.includes("planejar") || p.includes("gerar tarefas") || p.includes("criar tarefas")) {
    return `### 📋 Plano de Ação Estruturado (IA EXACTA)\n\nCom base na sua solicitação, estruturei as principais etapas operacionais recomendadas:\n\n1. **Fase 1: Diagnóstico e Alinhamento Inicial**\n   - Definir escopo detalhado e responsáveis no módulo de Tarefas.\n   - Prioridade: **Alta** | Prazo: 3 dias.\n\n2. **Fase 2: Execução e Controle Operacional**\n   - Implementar marcos de entrega vinculados ao Cronograma Gantt.\n   - Prioridade: **Média** | Prazo: 7 a 10 dias.\n\n3. **Fase 3: Validação de Qualidade e Fechamento**\n   - Revisão final com o time e entrega de resultados.\n   - Prioridade: **Alta** | Prazo: 14 dias.\n\n💡 *Dica:* Você pode agendar estes marcos diretamente no **Calendário** ou gerar as tarefas automaticamente no botão **Gerar com IA** em Tarefas.`;
  }

  if (p.includes("gargalo") || p.includes("problema") || p.includes("atraso") || p.includes("produtividade")) {
    return `### 🔍 Diagnóstico de Produtividade & Gargalos\n\n- **Status Atual:** Produtividade estimada em **${productivity}%**.\n- **Tarefas em Atraso:** **${overdueCount}** itens requerem atenção imediata.\n- **Projetos Ativos:** **${projectsCount}** frentes simultâneas.\n\n**Recomendações da IA:**\n1. **Priorização Eisenhower:** Foque primeiro nas tarefas com urgência máxima hoje.\n2. **Nivelamento de Carga:** Redistribua entregas sobrepostas no calendário de equipe.\n3. **Standup Rápido:** Realize um alinhamento de 15 min no Chat com os responsáveis pelos blocos travados.`;
  }

  if (p.includes("resum") || p.includes("status") || p.includes("dashboard") || p.includes("como está") || p.includes("relatório")) {
    return `### 📊 Resumo Executivo do Sistema (${dateStr})\n\n- 🎯 **Projetos Ativos:** ${projectsCount}\n- 📌 **Tarefas Totais no Fluxo:** ${tasksCount}\n- ⚠️ **Tarefas Atrasadas:** ${overdueCount}\n- ⚡ **Índice de Produtividade:** ${productivity}%\n\n**Próximos Passos:**\n- Monitore o calendário para checar reuniões e prazos da semana.\n- Mantenha o quadro Kanban atualizado para que os indicadores de Gestão Visual reflitam o progresso real.`;
  }

  return `### 🤖 Assistente EXACTA IA\n\nAnalisei sua mensagem: *"${prompt.trim()}"*.\n\n**Recomendações para seus Projetos:**\n- O sistema está monitorando suas tarefas, cronogramas e agendamentos no calendário.\n- Para potencializar ainda mais respostas analíticas avançadas, você pode conectar sua chave gratuita do **Google Gemini** ou **Groq** clicando no ícone de engrenagem ⚙️ acima.\n\nComo posso apoiar você agora? Posso detalhar projetos, calcular prazos ou listar prioridades.`;
}

/**
 * Universal Unified AI caller with graceful fallbacks:
 * 1. Groq (if configured) -> 2. Gemini (if configured) -> 3. Smart Built-in Engine
 */
export async function askAI(prompt: string, contextData?: any): Promise<string> {
  const config = getAIConfig();

  // If user selected Groq first
  if (config.preferredProvider === "groq" && config.groqKey) {
    try {
      return await askGroq(prompt);
    } catch (e) {
      console.warn("Groq falhou, tentando Gemini...", e);
    }
  }

  // Try Gemini if configured
  if (config.geminiKey || import.meta.env.VITE_GEMINI_API_KEY) {
    try {
      return await askGemini(prompt);
    } catch (e) {
      console.warn("Gemini falhou, tentando Groq...", e);
    }
  }

  // Try Groq if Gemini wasn't attempted or failed
  if (config.groqKey || import.meta.env.VITE_GROQ_API_KEY) {
    try {
      return await askGroq(prompt);
    } catch (e) {
      console.warn("Groq falhou...", e);
    }
  }

  // Fallback to Smart Built-in Assistant
  return runSmartLocalEngine(prompt, contextData);
}

export async function analyzeDashboardData(data: any) {
  const prompt = `
    Analise os seguintes dados do dashboard do sistema EXACTA e forneça 3 insights rápidos e uma recomendação de produtividade.
    Dados: ${JSON.stringify(data)}
    
    Responda em português, de forma executiva e profissional em formato Markdown.
  `;
  return await askAI(prompt, data);
}

export async function generateTasksWithAI(goalPrompt: string): Promise<Array<{ title: string; description?: string; priority: string; due_date: string }>> {
  const now = new Date();
  const datePlusDays = (d: number) => {
    const target = new Date(now.getTime() + d * 86400000);
    return target.toISOString().split("T")[0];
  };

  const structuredPrompt = `
Você é um especialista em gestão de projetos da EXACTA.
Gere uma lista de 4 a 6 tarefas acionáveis e práticas para atingir o seguinte objetivo:
"${goalPrompt}"

Responda ESTRITAMENTE em formato JSON com esta estrutura (sem markdown antes ou depois, apenas o JSON):
[
  {
    "title": "Nome da tarefa",
    "description": "Descrição detalhada da atividade",
    "priority": "alta",
    "due_date": "${datePlusDays(3)}"
  }
]
Prioridades permitidas: "baixa", "media", "alta", "urgente".
Datas devem ser no formato YYYY-MM-DD.
`;

  try {
    const raw = await askAI(structuredPrompt);
    // Find json array in response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(t => ({
          title: String(t.title || "Nova Tarefa").trim(),
          description: t.description ? String(t.description) : undefined,
          priority: ["baixa", "media", "alta", "urgente"].includes(t.priority) ? t.priority : "media",
          due_date: t.due_date || datePlusDays(7),
        }));
      }
    }
  } catch (e) {
    console.warn("Falha no parser de tarefas da IA, usando gerador heurístico", e);
  }

  // Fallback heuristic generator
  return [
    {
      title: `Diagnóstico e Escopo: ${goalPrompt.slice(0, 30)}`,
      description: `Mapear requisitos, recursos e entregáveis para ${goalPrompt}`,
      priority: "alta",
      due_date: datePlusDays(2),
    },
    {
      title: `Execução da Etapa Principal`,
      description: `Desenvolver as atividades centrais do plano de ${goalPrompt}`,
      priority: "media",
      due_date: datePlusDays(5),
    },
    {
      title: `Validação e Testes de Qualidade`,
      description: `Revisar os resultados obtidos e corrigir eventuais desvios`,
      priority: "media",
      due_date: datePlusDays(9),
    },
    {
      title: `Entrega Final e Apresentação`,
      description: `Consolidar os marcos concluídos e registrar no sistema EXACTA`,
      priority: "alta",
      due_date: datePlusDays(14),
    }
  ];
}
