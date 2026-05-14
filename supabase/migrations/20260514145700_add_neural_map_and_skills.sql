-- ==============================================================================
-- MIGRAÇÃO: ADIÇÃO DE SKILLS, MAPA NEURAL E AJUSTES DE COLABORAÇÃO
-- ==============================================================================

-- 1. ADICIONAR COLUNA DE COMPETÊNCIAS NOS PERFIS
-- Isso vai armazenar as Hard Skills e Soft Skills da equipe em formato JSON
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{"soft": [], "hard": []}'::jsonb;


-- 2. TABELA DE NÓS DO MAPA NEURAL (IDEIAS)
CREATE TABLE IF NOT EXISTS public.neural_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_team boolean NOT NULL DEFAULT false, -- true: Mapa da equipe | false: Mapa pessoal
  label text NOT NULL,
  x float NOT NULL,
  y float NOT NULL,
  color text NOT NULL DEFAULT 'bg-accent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TABELA DE LIGAÇÕES DO MAPA NEURAL (ARESTAS/CONEXÕES)
CREATE TABLE IF NOT EXISTS public.neural_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_team boolean NOT NULL DEFAULT false,
  source uuid NOT NULL REFERENCES public.neural_nodes(id) ON DELETE CASCADE,
  target uuid NOT NULL REFERENCES public.neural_nodes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Prevenir ligações duplicadas idênticas
  UNIQUE (source, target)
);


-- ==============================================================================
-- CONFIGURAÇÃO DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.neural_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neural_edges ENABLE ROW LEVEL SECURITY;

-- Políticas para NÓS (neural_nodes)
-- Modo Pessoal: Apenas o dono pode ver, editar ou deletar.
-- Modo Equipe: Todos os usuários autenticados podem ver e interagir.
CREATE POLICY "Usuários podem ver seus próprios nós ou nós da equipe"
  ON public.neural_nodes FOR SELECT
  USING (auth.uid() = user_id OR is_team = true);

CREATE POLICY "Usuários podem inserir nós"
  ON public.neural_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar nós pessoais ou da equipe"
  ON public.neural_nodes FOR UPDATE
  USING (auth.uid() = user_id OR is_team = true);

CREATE POLICY "Usuários podem deletar nós pessoais ou da equipe"
  ON public.neural_nodes FOR DELETE
  USING (auth.uid() = user_id OR is_team = true);


-- Políticas para CONEXÕES (neural_edges)
CREATE POLICY "Usuários podem ver suas próprias conexões ou da equipe"
  ON public.neural_edges FOR SELECT
  USING (auth.uid() = user_id OR is_team = true);

CREATE POLICY "Usuários podem inserir conexões"
  ON public.neural_edges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar conexões"
  ON public.neural_edges FOR UPDATE
  USING (auth.uid() = user_id OR is_team = true);

CREATE POLICY "Usuários podem deletar conexões"
  ON public.neural_edges FOR DELETE
  USING (auth.uid() = user_id OR is_team = true);


-- ==============================================================================
-- GATILHOS (TRIGGERS) PARA ATUALIZAÇÃO DE DATA (updated_at)
-- ==============================================================================

CREATE OR REPLACE FUNCTION update_neural_nodes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_neural_nodes_updated_at ON public.neural_nodes;
CREATE TRIGGER trg_neural_nodes_updated_at
BEFORE UPDATE ON public.neural_nodes
FOR EACH ROW
EXECUTE FUNCTION update_neural_nodes_updated_at();
