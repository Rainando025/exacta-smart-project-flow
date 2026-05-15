-- ==============================================================================
-- MIGRAÇÃO: KPIs, GARGALOS MANUAIS E SEGMENTAÇÃO POR SETOR
-- EXACTA Smart Project Flow — 2026-05-15
-- ==============================================================================

-- ============================================================
-- 1. TABELA DE KPIs (Indicadores de Desempenho)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  goal numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '%', -- %, R$, unidades, etc
  period_month integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year integer NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- Usuários veem KPIs do seu setor ou se forem gestores
CREATE POLICY "Users view sector KPIs"
  ON public.kpis FOR SELECT
  TO authenticated
  USING (
    department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
  );

-- Apenas gestores e admin criam/editam KPIs
CREATE POLICY "Managers manage KPIs"
  ON public.kpis FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')));

-- ============================================================
-- 2. TABELA DE GARGALOS MANUAIS (LOG DE PROBLEMAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bottlenecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  impact_level text CHECK (impact_level IN ('baixo', 'medio', 'alto', 'critico')),
  status text DEFAULT 'identificado' CHECK (status IN ('identificado', 'analise', 'resolvido', 'arquivado')),
  suggested_solution text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bottlenecks ENABLE ROW LEVEL SECURITY;

-- Visibilidade: Setor ou Gestores
CREATE POLICY "Users view sector bottlenecks"
  ON public.bottlenecks FOR SELECT
  TO authenticated
  USING (
    department_id IN (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
  );

-- Colaboradores podem reportar gargalos, mas gestores gerenciam
CREATE POLICY "Users report bottlenecks"
  ON public.bottlenecks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers manage bottlenecks"
  ON public.bottlenecks FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
  );

-- ============================================================
-- 3. TRIGGERS updated_at
-- ============================================================
CREATE TRIGGER touch_kpis
  BEFORE UPDATE ON public.kpis
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_bottlenecks
  BEFORE UPDATE ON public.bottlenecks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 4. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.kpis;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bottlenecks;
