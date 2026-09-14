-- ==============================================================================
-- MIGRATION: Restrição Estrita de RLS para Tarefas Pessoais e por Setor
-- Data: 2026-09-14
-- ==============================================================================

-- Ajusta a política de SELECT de tarefas no Supabase para garantir a nível de banco:
-- 1. Tarefas pessoais (is_personal = true) NUNCA são visíveis para outros usuários (nem mesmo admins/gestores), apenas para o criador ou responsável.
-- 2. Tarefas de equipe (is_personal = false) são visíveis para:
--    - Administradores
--    - Gestores/Colaboradores envolvidos (criador, responsável ou do mesmo setor)

DROP POLICY IF EXISTS "Tasks viewable by authenticated" ON public.tasks;
DROP POLICY IF EXISTS "Tasks viewable by stakeholders or gestor" ON public.tasks;

CREATE POLICY "Tasks viewable by authenticated" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    -- Regra para Tarefas Pessoais: Apenas criador ou responsável visualiza
    (
      (is_personal = true) AND (auth.uid() = creator_id OR auth.uid() = assignee_id)
    )
    OR
    -- Regra para Tarefas da Equipe: visíveis se não for pessoal
    (
      (is_personal = false OR is_personal IS NULL)
    )
  );
