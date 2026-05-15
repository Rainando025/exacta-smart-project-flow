-- ==============================================================================
-- FIX: GARANTIR COLUNAS DE LEMBRETES NO PERFIL
-- ==============================================================================

ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS reminder_advance_minutes integer DEFAULT 15,
  ADD COLUMN IF NOT EXISTS reminder_snooze_minutes integer DEFAULT 10;

-- Garantir que as tabelas necessárias para o Chat e Gantt existem e estão corretas
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Garantir que a tabela chat_messages tem a coluna type
ALTER TABLE public.chat_messages 
  ADD COLUMN IF NOT EXISTS type text DEFAULT 'text' CHECK (type IN ('text', 'audit', 'system'));
