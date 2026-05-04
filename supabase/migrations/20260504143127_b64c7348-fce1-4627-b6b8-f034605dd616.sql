
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS reminder_advance_minutes integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS reminder_snooze_minutes integer NOT NULL DEFAULT 10;
