-- ==============================================================================
-- SKILLS TABLE: Competências e avaliações por membro
-- ==============================================================================

-- Tabela de Skills (definidas pelo gestor, globais para a empresa)
CREATE TABLE IF NOT EXISTS public.team_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'soft' CHECK (type IN ('soft', 'hard')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de avaliações (nota 1-10 por membro + skill)
CREATE TABLE IF NOT EXISTS public.member_skill_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.team_skills(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 5 CHECK (score >= 1 AND score <= 10),
  evaluated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, skill_id)
);

-- Garantir bucket de avatares no Storage (criado via API/Dashboard do Supabase)
-- Adicionar coluna phone e bio ao perfil, caso não existam
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

-- Habilitar RLS
ALTER TABLE public.team_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_skill_scores ENABLE ROW LEVEL SECURITY;

-- Políticas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_skills' AND policyname = 'Leitura para todos autenticados') THEN
    CREATE POLICY "Leitura para todos autenticados" ON public.team_skills FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_skills' AND policyname = 'Gestores podem gerenciar skills') THEN
    CREATE POLICY "Gestores podem gerenciar skills" ON public.team_skills FOR ALL USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_skill_scores' AND policyname = 'Leitura para todos autenticados') THEN
    CREATE POLICY "Leitura para todos autenticados" ON public.member_skill_scores FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_skill_scores' AND policyname = 'Gestores avaliam membros') THEN
    CREATE POLICY "Gestores avaliam membros" ON public.member_skill_scores FOR ALL USING (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor'))
    );
  END IF;
END $$;
