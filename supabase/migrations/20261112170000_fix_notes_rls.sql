-- ==============================================================================
-- Correção de RLS para a tabela public.notes (Anotações)
-- ==============================================================================

-- 1. Garante que RLS está ativo na tabela notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 2. Permite que o usuário autenticado insira suas próprias notas
DROP POLICY IF EXISTS "Users create own notes" ON public.notes;
CREATE POLICY "Users create own notes" ON public.notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Permite que o usuário autenticado visualize suas próprias notas
DROP POLICY IF EXISTS "Users view own notes" ON public.notes;
CREATE POLICY "Users view own notes" ON public.notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 4. Permite que o usuário autenticado ou gestor atualize suas próprias notas
DROP POLICY IF EXISTS "Users update own notes" ON public.notes;
CREATE POLICY "Users update own notes" ON public.notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_at_least('gestor'));

-- 5. Permite que o usuário autenticado ou gestor exclua suas próprias notas
DROP POLICY IF EXISTS "Users delete own notes" ON public.notes;
CREATE POLICY "Users delete own notes" ON public.notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_at_least('gestor'));

