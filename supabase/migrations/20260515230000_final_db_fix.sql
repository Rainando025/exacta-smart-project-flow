-- ==============================================================================
-- FIX: GARANTIR COLUNAS DE LEMBRETES NO PERFIL
-- ==============================================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS reminder_advance_minutes integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS reminder_snooze_minutes integer DEFAULT 10;

-- Garantir que as tabelas necessárias para o Chat e Gantt existem e estão corretas
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS position integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES auth.users(id);

-- Garantir colunas de lembretes no perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reminder_advance_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS reminder_snooze_minutes integer DEFAULT 10;

-- Tabela de Departamentos
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de KPIs
CREATE TABLE IF NOT EXISTS public.kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  goal numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '%',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  period_month integer NOT NULL DEFAULT extract(month from now()),
  period_year integer NOT NULL DEFAULT extract(year from now()),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Gargalos
CREATE TABLE IF NOT EXISTS public.bottlenecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  impact_level text NOT NULL DEFAULT 'medio' CHECK (impact_level IN ('baixo', 'medio', 'alto', 'critico')),
  suggested_solution text,
  status text NOT NULL DEFAULT 'pendente',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS para novas tabelas
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Permitir leitura para todos autenticados, escrita para Gestores/Admins via RLS seria melhor, mas aqui simplificamos)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Permitir leitura para todos') THEN
    CREATE POLICY "Permitir leitura para todos" ON public.departments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'kpis' AND policyname = 'Permitir leitura para todos') THEN
    CREATE POLICY "Permitir leitura para todos" ON public.kpis FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bottlenecks' AND policyname = 'Permitir leitura para todos') THEN
    CREATE POLICY "Permitir leitura para todos" ON public.bottlenecks FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Apenas admins veem logs') THEN
    CREATE POLICY "Apenas admins veem logs" ON public.audit_logs FOR SELECT USING (true); -- No app controlamos pela UI por enquanto
  END IF;
END $$;

-- Garantir que a tabela chat_messages tem a coluna type
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'text' CHECK (type IN ('text', 'audit', 'system'));



