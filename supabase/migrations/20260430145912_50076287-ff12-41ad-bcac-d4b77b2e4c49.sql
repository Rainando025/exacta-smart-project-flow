
REVOKE EXECUTE ON FUNCTION public.recalculate_dependent_tasks(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_dependent_tasks(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.recalculate_dependent_tasks(UUID) FROM authenticated;

-- Cria um trigger que chama a função automaticamente quando o due_date de uma tarefa muda
CREATE OR REPLACE FUNCTION public.trg_recalculate_deps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.due_date IS DISTINCT FROM OLD.due_date THEN
    PERFORM public.recalculate_dependent_tasks(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.trg_recalculate_deps() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_recalculate_deps() FROM anon;
REVOKE EXECUTE ON FUNCTION public.trg_recalculate_deps() FROM authenticated;

DROP TRIGGER IF EXISTS tasks_recalculate_deps ON public.tasks;
CREATE TRIGGER tasks_recalculate_deps
  AFTER UPDATE OF due_date ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalculate_deps();
