-- ==============================================================================
-- MIGRATION: Correção Abrangente de RLS para Colaboradores
-- Data: 2026-09-14
-- ==============================================================================

-- ============================================================
-- 1. TAREFAS: DELETE para criador, responsável ou gestor
-- ============================================================
DROP POLICY IF EXISTS "Creator gestor delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated delete tasks" ON public.tasks;
CREATE POLICY "Authenticated delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (
    creator_id = auth.uid()
    OR assignee_id = auth.uid()
    OR is_personal = true
    OR public.is_at_least('gestor')
  );

-- UPDATE de tarefas para criador, responsável ou gestor
DROP POLICY IF EXISTS "Creator or assigned update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated update tasks" ON public.tasks;
CREATE POLICY "Authenticated update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    creator_id = auth.uid()
    OR assignee_id = auth.uid()
    OR public.is_at_least('gestor')
  );

-- ============================================================
-- 2. NOTAS: DELETE para o dono ou gestor
-- ============================================================
DROP POLICY IF EXISTS "Users delete own notes" ON public.notes;
CREATE POLICY "Users delete own notes" ON public.notes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));

-- UPDATE de notas para o dono ou gestor  
DROP POLICY IF EXISTS "Users update own notes" ON public.notes;
CREATE POLICY "Users update own notes" ON public.notes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));

-- ============================================================
-- 3. LEMBRETES: DELETE para o dono ou gestor
-- ============================================================
DROP POLICY IF EXISTS "Users delete own reminders" ON public.reminders;
CREATE POLICY "Users delete own reminders" ON public.reminders
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));

-- ============================================================
-- 4. FINANÇAS PESSOAIS: DELETE para o dono ou gestor
-- ============================================================
DROP POLICY IF EXISTS "Users delete own finances" ON public.personal_finances;
CREATE POLICY "Users delete own finances" ON public.personal_finances
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));

-- ============================================================
-- 5. OKRs: Visibilidade expandida (todos autenticados veem)
-- ============================================================
DROP POLICY IF EXISTS "Users view own okrs" ON public.okrs;
CREATE POLICY "Users view own okrs" ON public.okrs
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- 6. KPIs: Visibilidade expandida para colaboradores sem setor
-- ============================================================
DROP POLICY IF EXISTS "Users view sector KPIs" ON public.kpis;
CREATE POLICY "Users view sector KPIs" ON public.kpis
  FOR SELECT TO authenticated
  USING (true);
