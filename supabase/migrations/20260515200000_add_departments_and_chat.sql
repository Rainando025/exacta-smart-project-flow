-- ==============================================================================
-- MIGRAÇÃO: SETORES (DEPARTMENTS) + CANAL DE COMUNICAÇÃO (CHAT)
-- EXACTA Smart Project Flow — 2026-05-15
-- ==============================================================================

-- ============================================================
-- 0. FUNÇÃO AUXILIAR updated_at (cria se não existir)
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. TABELA DE SETORES / DEPARTAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário autenticado vê os setores
CREATE POLICY "Authenticated view departments"
  ON public.departments FOR SELECT
  TO authenticated USING (true);

-- Somente admin e gestor criam setores
-- (verificado via helper function abaixo)
CREATE POLICY "Managers create departments"
  ON public.departments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Managers update departments"
  ON public.departments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Admins delete departments"
  ON public.departments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- ============================================================
-- 2. ADICIONAR SETOR NOS PERFIS
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- ============================================================
-- 3. CANAIS DE CHAT
-- ============================================================
-- Tipos: 'general' (todo mundo), 'department' (só do setor), 'private' (DM)
CREATE TABLE IF NOT EXISTS public.chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'department', 'direct')),
  department_id uuid REFERENCES public.departments(id) ON DELETE CASCADE,
  is_archived boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;

-- Canais gerais e do próprio setor são visíveis para autenticados
-- Canais do tipo 'department' só aparecem para quem é daquele setor
CREATE POLICY "Members view channels"
  ON public.chat_channels FOR SELECT
  TO authenticated
  USING (
    type = 'general'
    OR (
      type = 'department'
      AND department_id IN (
        SELECT department_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR (
      type = 'department'
      AND EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
      )
    )
    OR type = 'direct'
  );

CREATE POLICY "Managers create channels"
  ON public.chat_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

CREATE POLICY "Managers update channels"
  ON public.chat_channels FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
    )
  );

-- ============================================================
-- 4. MEMBROS DE CANAIS DIRETOS (DMs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.chat_channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see their channel memberships"
  ON public.chat_channel_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
  ));

CREATE POLICY "Users join channels"
  ON public.chat_channel_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
  ));

-- ============================================================
-- 5. MENSAGENS DO CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,                          -- texto da mensagem (pode ser null se for só anexo)
  reply_to_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_edited boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- SELECT: usuário vê mensagens dos canais que tem acesso
-- (general, department do seu setor, ou direct que é membro)
CREATE POLICY "Members read messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM public.chat_channels
      WHERE type = 'general'
         OR (type = 'department' AND department_id IN (
               SELECT department_id FROM public.profiles WHERE id = auth.uid()
            ))
         OR (type = 'department' AND EXISTS (
               SELECT 1 FROM public.user_roles
               WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')
            ))
         OR (type = 'direct' AND id IN (
               SELECT channel_id FROM public.chat_channel_members
               WHERE user_id = auth.uid()
            ))
    )
  );

CREATE POLICY "Users send messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Apenas o autor pode editar
CREATE POLICY "Authors update messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Autor ou admin pode deletar (soft-delete via is_deleted)
CREATE POLICY "Authors or admins delete messages"
  ON public.chat_messages FOR DELETE
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- 6. ANEXOS DO CHAT
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,     -- caminho no Supabase Storage
  file_type text,              -- MIME type
  file_size bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view chat attachments"
  ON public.chat_attachments FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users upload chat attachments"
  ON public.chat_attachments FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Authors delete chat attachments"
  ON public.chat_attachments FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- 7. REAÇÕES NAS MENSAGENS (EMOJIS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view reactions"
  ON public.chat_reactions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users manage own reactions"
  ON public.chat_reactions FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 8. CANAIS PADRÃO — Inserir canal geral e um canal por setor
-- (Serão criados dinamicamente pelo app, mas garantimos o #geral)
-- ============================================================
-- Nota: Inserção de dados iniciais é feita pelo app na primeira vez.
-- Aqui apenas garantimos a estrutura.

-- ============================================================
-- 9. REALTIME — Habilitar para mensagens em tempo real
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_channels;

-- ============================================================
-- 10. TRIGGER updated_at
-- ============================================================
CREATE TRIGGER touch_chat_channels
  BEFORE UPDATE ON public.chat_channels
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_chat_messages
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER touch_departments
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 11. SETOR PADRÃO — Inserir "Geral" para não ficar vazio
-- ============================================================
-- Será criado via função no app, mas o canal #geral é criado aqui
-- via trigger após o primeiro admin ser registrado.
-- Deixamos a lógica no frontend por segurança.
