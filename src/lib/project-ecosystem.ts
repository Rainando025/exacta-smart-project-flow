import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addBrandedHeader, addBrandedFooter } from "@/lib/pdf";

export interface SystemItem {
  id?: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  projectId?: string | null;
  completed?: boolean;
  type?: "task" | "okr" | "kpi" | "event" | "doc" | "schedule";
}

/**
 * Recalculates and updates the overall completion percentage of a project based on its linked tasks & activities.
 */
export async function recalculateProjectProgress(projectId: string): Promise<number> {
  if (!projectId) return 0;

  try {
    // 1. Fetch linked tasks
    const { data: tasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("project_id", projectId);

    const totalTasks = tasks?.length || 0;
    const completedTasks = tasks?.filter((t) => t.status === "done" || t.status === "concluido").length || 0;

    let percentage = 0;
    if (totalTasks > 0) {
      percentage = Math.round((completedTasks / totalTasks) * 100);
    }

    // 2. Update the project progress in Supabase
    await supabase
      .from("projects")
      .update({
        progress: percentage,
        status: percentage === 100 ? "concluido" : undefined
      })
      .eq("id", projectId);

    return percentage;
  } catch (err) {
    console.error("Error recalculating project progress:", err);
    return 0;
  }
}

/**
 * Recalculates OKR progress based on linked Key Results & associated tasks.
 */
export async function recalculateOkrProgress(okrId: string): Promise<number> {
  if (!okrId) return 0;
  try {
    const { data: krs } = await supabase
      .from("key_results")
      .select("current_value, target_value")
      .eq("okr_id", okrId);

    if (!krs || krs.length === 0) return 0;

    const totalProgress = krs.reduce((acc, kr) => {
      if (!kr.target_value || kr.target_value === 0) return acc;
      const krPct = Math.min(100, Math.max(0, (kr.current_value / kr.target_value) * 100));
      return acc + krPct;
    }, 0);

    const okrProgress = Math.round(totalProgress / krs.length);

    await supabase
      .from("okrs")
      .update({ progress: okrProgress })
      .eq("id", okrId);

    return okrProgress;
  } catch (err) {
    console.error("Error recalculating OKR progress:", err);
    return 0;
  }
}

/**
 * Automatically syncs an item with a start or due date into Calendar / Reminders and Gantt timelines.
 */
export async function autoSyncItemToCalendarAndGantt(item: SystemItem, userId?: string) {
  if (!item.dueDate && !item.startDate) return;

  const eventTitle = item.title;
  const eventDate = item.dueDate || item.startDate;
  const projectId = item.projectId || null;

  try {
    // Check if reminder / calendar event already exists for this title & date
    const { data: existing } = await supabase
      .from("reminders")
      .select("id")
      .eq("title", eventTitle)
      .eq("date", eventDate)
      .maybeSingle();

    if (!existing && userId) {
      await supabase.from("reminders").insert({
        title: `[${(item.type || "Tarefa").toUpperCase()}] ${eventTitle}`,
        description: item.description || null,
        date: eventDate,
        user_id: userId,
        project_id: projectId,
        completed: !!item.completed,
      });
    }
  } catch (err) {
    console.warn("Could not sync item to calendar/reminders table:", err);
  }
}

/**
 * Export full project dossier containing Overview, Tasks, OKRs, KPIs, Schedule, Calendar, Docs & Notes.
 */
export async function exportFullProjectDossier(project: any, user: any) {
  if (!project) return;

  try {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    // Fetch all linked ecosystem components concurrently
    const [
      { data: tasks },
      { data: okrs },
      { data: kpis },
      { data: docs },
      { data: reminders }
    ] = await Promise.all([
      supabase.from("tasks").select("*").eq("project_id", project.id),
      supabase.from("okrs").select("*, key_results(*)").eq("project_id", project.id),
      supabase.from("kpis").select("*").eq("project_id", project.id),
      supabase.from("documents").select("*").eq("project_id", project.id),
      supabase.from("reminders").select("*").eq("project_id", project.id),
    ]);

    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // Header
    let y = await addBrandedHeader(
      doc,
      "Dossiê Completo do Projeto",
      `Projeto: ${project.name}`,
      `Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`
    );

    // Section 1: Overview
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(14);
    doc.text("1. Visão Geral do Projeto", 14, y);
    y += 6;

    const completedTasksCount = tasks?.filter((t) => t.status === "done" || t.status === "concluido").length || 0;
    const totalTasksCount = tasks?.length || 0;
    const computedProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : (project.progress || 0);

    autoTable(doc, {
      startY: y,
      head: [["Atributo", "Detalhe"]],
      body: [
        ["Nome do Projeto", project.name],
        ["Status", (project.status || "Ativo").toUpperCase()],
        ["Progresso Geral", `${computedProgress}% (${completedTasksCount}/${totalTasksCount} Tarefas Concluídas)`],
        ["Data Limite / Prazo", project.due_date ? new Date(project.due_date).toLocaleDateString("pt-BR") : "Sem prazo definido"],
        ["Proprietário", project.owner_id === user?.id ? "Você" : "Equipe"],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    if (project.description) {
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text("Descrição do Projeto:", 14, y);
      y += 6;
      const splitDesc = doc.splitTextToSize(project.description, pw - 28);
      doc.text(splitDesc, 14, y);
      y += splitDesc.length * 5 + 10;
    }

    // Section 2: OKRs & KPIs
    if ((okrs && okrs.length > 0) || (kpis && kpis.length > 0)) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(14);
      doc.text("2. Objetivos & KPIs (OKRs)", 14, y);
      y += 6;

      if (okrs && okrs.length > 0) {
        const okrRows: any[] = [];
        okrs.forEach((o: any) => {
          okrRows.push([o.title, `Progresso: ${o.progress || 0}%`, o.quarter || "-", "Objetivo"]);
          if (o.key_results) {
            o.key_results.forEach((kr: any) => {
              okrRows.push([`  ↳ ${kr.title}`, `Meta: ${kr.current_value} / ${kr.target_value} ${kr.unit || ""}`, "-", "Resultado-Chave"]);
            });
          }
        });

        autoTable(doc, {
          startY: y,
          head: [["Título / Item", "Status / Meta", "Ciclo", "Tipo"]],
          body: okrRows,
          theme: "striped",
          headStyles: { fillColor: [8, 145, 178] },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
      }
    }

    // Section 3: Tasks & Cronograma (Gantt)
    if (tasks && tasks.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(14);
      doc.text("3. Tarefas & Cronograma de Execução", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Tarefa", "Prioridade", "Status", "Prazo / Cronograma"]],
        body: tasks.map((t: any) => [
          t.title,
          (t.priority || "media").toUpperCase(),
          (t.status || "todo").toUpperCase(),
          t.due_date ? new Date(t.due_date).toLocaleDateString("pt-BR") : "Sem data",
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138] },
      });

      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Section 4: Calendar Activities & Events
    if (reminders && reminders.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(14);
      doc.text("4. Atividades do Calendário & Lembretes", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Atividade", "Data", "Status"]],
        body: reminders.map((r: any) => [
          r.title,
          r.date ? new Date(r.date).toLocaleDateString("pt-BR") : "-",
          r.completed ? "CONCLUÍDO" : "PENDENTE",
        ]),
        theme: "striped",
        headStyles: { fillColor: [124, 58, 237] },
      });

      y = (doc as any).lastAutoTable.finalY + 12;
    }

    // Section 5: Documents & Knowledge Base
    if (docs && docs.length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(14);
      doc.text("5. Documentos Vinculados", 14, y);
      y += 6;

      autoTable(doc, {
        startY: y,
        head: [["Título do Documento", "Categoria", "Última Atualização"]],
        body: docs.map((d: any) => [
          d.title,
          d.category || "Geral",
          d.updated_at ? new Date(d.updated_at).toLocaleDateString("pt-BR") : "-",
        ]),
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105] },
      });
    }

    addBrandedFooter(doc);

    // Save PDF
    const filename = `dossie-projeto-${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;
    doc.save(filename);
    toast.success("Dossiê completo exportado com sucesso!");
  } catch (err) {
    console.error("Erro ao exportar dossiê do projeto:", err);
    toast.error("Falha ao exportar o dossiê do projeto.");
  }
}

/**
 * Export project details as raw JSON package.
 */
export async function exportProjectJSON(project: any) {
  try {
    const [
      { data: tasks },
      { data: okrs },
      { data: kpis },
      { data: docs },
      { data: reminders }
    ] = await Promise.all([
      supabase.from("tasks").select("*").eq("project_id", project.id),
      supabase.from("okrs").select("*, key_results(*)").eq("project_id", project.id),
      supabase.from("kpis").select("*").eq("project_id", project.id),
      supabase.from("documents").select("*").eq("project_id", project.id),
      supabase.from("reminders").select("*").eq("project_id", project.id),
    ]);

    const exportBundle = {
      exportedAt: new Date().toISOString(),
      project,
      tasks: tasks || [],
      okrs: okrs || [],
      kpis: kpis || [],
      documents: docs || [],
      calendarEvents: reminders || [],
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `projeto-${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-pacote.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Pacote JSON exportado!");
  } catch (err) {
    console.error(err);
    toast.error("Erro ao exportar pacote JSON.");
  }
}
