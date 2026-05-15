-- ==============================================================================
-- MIGRAÇÃO: AUDITORIA DE CHAT E LOGS DE ACESSO
-- EXACTA Smart Project Flow — 2026-05-15
-- ==============================================================================

-- ============================================================
-- 1. TABELA DE AUDITORIA DE CHAT (ORDENS DE CORREÇÃO)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  os_number text NOT NULL, -- Número da Ordem de Serviço
  report_content text NOT NULL, -- O que consertar / arrumar
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_correcao', 'corrigido')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated view chat audits"
  ON public.chat_audits FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Managers manage chat audits"
  ON public.chat_audits FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'gestor')));

-- ============================================================
-- 2. ADICIONAR TIPO DE MENSAGEM NO CHAT
-- ============================================================
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'text' CHECK (type IN ('text', 'audit', 'system'));

-- ============================================================
-- 3. LOGS DE ACESSO (Opcional, usando audit_logs)
-- ============================================================
-- Já existe audit_logs, vamos garantir que tenha índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs(actor_id);

-- ============================================================
-- 4. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_audits;

-- ============================================================
-- 5. TRIGGER updated_at
-- ============================================================
CREATE TRIGGER touch_chat_audits
  BEFORE UPDATE ON public.chat_audits
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
