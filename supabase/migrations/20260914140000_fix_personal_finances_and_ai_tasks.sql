-- ==============================================================================
-- MIGRATION: Garantia de RLS para Finanças Pessoais de Colaboradores
-- Data: 2026-09-14
-- ==============================================================================

-- Garantir RLS habilitado para a tabela personal_finances
ALTER TABLE public.personal_finances ENABLE ROW LEVEL SECURITY;

-- Garantir que a leitura (SELECT) seja permitida para o próprio usuário autenticado
DROP POLICY IF EXISTS "Users view own finances" ON public.personal_finances;
CREATE POLICY "Users view own finances" ON public.personal_finances
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Garantir que a inserção (INSERT) seja permitida para o próprio usuário autenticado
DROP POLICY IF EXISTS "Users create own finances" ON public.personal_finances;
CREATE POLICY "Users create own finances" ON public.personal_finances
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Garantir que a atualização (UPDATE) seja permitida para o próprio usuário autenticado
DROP POLICY IF EXISTS "Users update own finances" ON public.personal_finances;
CREATE POLICY "Users update own finances" ON public.personal_finances
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Garantir que a exclusão (DELETE) seja permitida para o próprio usuário autenticado ou gestor
DROP POLICY IF EXISTS "Users delete own finances" ON public.personal_finances;
CREATE POLICY "Users delete own finances" ON public.personal_finances
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_at_least('gestor'));
