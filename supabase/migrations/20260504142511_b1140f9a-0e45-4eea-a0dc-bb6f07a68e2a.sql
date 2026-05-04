
-- personal_finances: recurring, due_date, credit card, installments
ALTER TABLE public.personal_finances
  ADD COLUMN IF NOT EXISTS recurring text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS is_credit_card boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS installments integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS installment_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id uuid,
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;

-- notes: priority
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'media';

-- reminders: priority
ALTER TABLE public.reminders
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'media';
