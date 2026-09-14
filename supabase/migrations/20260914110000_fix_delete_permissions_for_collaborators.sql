-- Garanta permissão de exclusão de tarefas para criador, responsável, tarefas pessoais e gestores
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

-- Garanta permissão de exclusão de notas pessoais
DROP POLICY IF EXISTS "Users delete own notes" ON public.notes;
CREATE POLICY "Users delete own notes" ON public.notes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));

-- Garanta permissão de exclusão de lembretes pessoais
DROP POLICY IF EXISTS "Users delete own reminders" ON public.reminders;
CREATE POLICY "Users delete own reminders" ON public.reminders
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));

-- Garanta permissão de exclusão de finanças pessoais
DROP POLICY IF EXISTS "Users delete own finances" ON public.personal_finances;
CREATE POLICY "Users delete own finances" ON public.personal_finances
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));
