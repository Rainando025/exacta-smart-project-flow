-- ==============================================================================
-- MIGRATION: 20260903150000_add_chat_pendencies.sql
-- Tabela para Pendências de Plantão do Chat da Equipe
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.chat_pendencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('critica', 'alta', 'media', 'baixa')),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido')),
  channel_id uuid REFERENCES public.chat_channels(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.chat_pendencies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_pendencies
CREATE POLICY "Authenticated users view pendencies"
  ON public.chat_pendencies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users create pendencies"
  ON public.chat_pendencies FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Authenticated users update pendencies"
  ON public.chat_pendencies FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Creators or gestors delete pendencies"
  ON public.chat_pendencies FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- Habilitar Realtime para chat_pendencies
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_pendencies;

-- Atualizar restrição de tipo de mensagens se necessário para aceitar 'pendency'
DO $$ BEGIN
  ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_type_check;
  ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_type_check CHECK (type IN ('text', 'audit', 'system', 'pendency'));
EXCEPTION
  WHEN OTHERS THEN null;
END $$;
