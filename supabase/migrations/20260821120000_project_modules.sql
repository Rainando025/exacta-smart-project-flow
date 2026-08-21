-- =====================================================
-- MIGRATION: Project Modules (OKRs + Visual Boards)
-- Date: 2026-08-21
-- =====================================================

-- 1. TABELA DE OKRs (Objectives & Key Results)
-- Vinculados opcionalmente a um projeto

CREATE TABLE IF NOT EXISTS public.okrs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  status      text NOT NULL DEFAULT 'em_andamento' 
                CHECK (status IN ('em_andamento','quase_la','concluido','pausado')),
  progress    integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  key_results jsonb DEFAULT '[]'::jsonb,
  owner_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- RLS para okrs
ALTER TABLE public.okrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own okrs" ON public.okrs;
CREATE POLICY "Users view own okrs" ON public.okrs
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users create own okrs" ON public.okrs;
CREATE POLICY "Users create own okrs" ON public.okrs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users update own okrs" ON public.okrs;
CREATE POLICY "Users update own okrs" ON public.okrs
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users delete own okrs" ON public.okrs;
CREATE POLICY "Users delete own okrs" ON public.okrs
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Trigger para updated_at em okrs
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_okrs_updated_at ON public.okrs;
CREATE TRIGGER set_okrs_updated_at
  BEFORE UPDATE ON public.okrs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 2. TABELA DE VISUAL BOARDS
-- Armazena boards de Gestão Visual (SWOT, Eisenhower, 5W2H, etc.) por projeto

CREATE TABLE IF NOT EXISTS public.visual_boards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  tool_type   text NOT NULL 
                CHECK (tool_type IN ('swot','eisenhower','5w2h','pareto','smart','gut','flowchart')),
  project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL
);

-- RLS para visual_boards
ALTER TABLE public.visual_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own visual_boards" ON public.visual_boards;
CREATE POLICY "Users view own visual_boards" ON public.visual_boards
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create own visual_boards" ON public.visual_boards;
CREATE POLICY "Users create own visual_boards" ON public.visual_boards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own visual_boards" ON public.visual_boards;
CREATE POLICY "Users update own visual_boards" ON public.visual_boards
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own visual_boards" ON public.visual_boards;
CREATE POLICY "Users delete own visual_boards" ON public.visual_boards
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_visual_boards_updated_at ON public.visual_boards;
CREATE TRIGGER set_visual_boards_updated_at
  BEFORE UPDATE ON public.visual_boards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- 3. ADICIONAR project_id AOS KPIs (opcional, mantém department_id)
ALTER TABLE public.kpis
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
