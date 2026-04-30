
-- ============ TASK DEPENDENCIES ============
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (predecessor_id, successor_id),
  CHECK (predecessor_id <> successor_id)
);

CREATE INDEX idx_task_deps_pred ON public.task_dependencies(predecessor_id);
CREATE INDEX idx_task_deps_succ ON public.task_dependencies(successor_id);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deps viewable by authenticated"
  ON public.task_dependencies FOR SELECT TO authenticated USING (true);

CREATE POLICY "Task members or admin create deps"
  ON public.task_dependencies FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND (
      EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = successor_id AND (t.creator_id = auth.uid() OR t.assignee_id = auth.uid()))
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "Task members or admin delete deps"
  ON public.task_dependencies FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = successor_id AND (t.creator_id = auth.uid() OR t.assignee_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = created_by
  );

-- ============ FEEDBACK 360 ============
CREATE TABLE public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewee_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  feedback_type TEXT NOT NULL DEFAULT 'peer' CHECK (feedback_type IN ('peer','manager','self')),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  strengths TEXT,
  improvements TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedbacks_reviewee ON public.feedbacks(reviewee_id);
CREATE INDEX idx_feedbacks_reviewer ON public.feedbacks(reviewer_id);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviewee or reviewer or admin read feedbacks"
  ON public.feedbacks FOR SELECT TO authenticated
  USING (
    auth.uid() = reviewee_id
    OR auth.uid() = reviewer_id
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Authenticated create feedbacks"
  ON public.feedbacks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Reviewer or admin delete feedbacks"
  ON public.feedbacks FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id OR has_role(auth.uid(), 'admin'::app_role));

-- ============ COMPETENCIES ============
CREATE TABLE public.feedback_competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES public.feedbacks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fb_comp_feedback ON public.feedback_competencies(feedback_id);

ALTER TABLE public.feedback_competencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read competencies via parent feedback"
  ON public.feedback_competencies FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feedbacks f
      WHERE f.id = feedback_competencies.feedback_id
        AND (f.reviewee_id = auth.uid() OR f.reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Reviewer creates competencies"
  ON public.feedback_competencies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.feedbacks f
      WHERE f.id = feedback_competencies.feedback_id AND f.reviewer_id = auth.uid()
    )
  );

CREATE POLICY "Reviewer or admin delete competencies"
  ON public.feedback_competencies FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.feedbacks f
      WHERE f.id = feedback_competencies.feedback_id
        AND (f.reviewer_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- ============ FUNCTION: recalculate dependent task dates ============
CREATE OR REPLACE FUNCTION public.recalculate_dependent_tasks(_predecessor_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pred_due TIMESTAMPTZ;
  dep RECORD;
  succ_due TIMESTAMPTZ;
  gap INTERVAL;
BEGIN
  SELECT due_date INTO pred_due FROM public.tasks WHERE id = _predecessor_id;
  IF pred_due IS NULL THEN RETURN; END IF;

  FOR dep IN
    SELECT successor_id FROM public.task_dependencies WHERE predecessor_id = _predecessor_id
  LOOP
    SELECT due_date INTO succ_due FROM public.tasks WHERE id = dep.successor_id;
    IF succ_due IS NULL THEN
      -- Sucessora sem prazo: define como pred_due + 1 dia
      UPDATE public.tasks
        SET due_date = pred_due + INTERVAL '1 day',
            start_date = pred_due
        WHERE id = dep.successor_id;
    ELSIF succ_due < pred_due THEN
      -- Sucessora estava antes da predecessora: empurra 1 dia depois
      UPDATE public.tasks
        SET due_date = pred_due + INTERVAL '1 day',
            start_date = pred_due
        WHERE id = dep.successor_id;
    END IF;
    -- Cascata
    PERFORM public.recalculate_dependent_tasks(dep.successor_id);
  END LOOP;
END;
$$;

-- ============ REALTIME ============
ALTER TABLE public.task_dependencies REPLICA IDENTITY FULL;
ALTER TABLE public.feedbacks REPLICA IDENTITY FULL;
ALTER TABLE public.feedback_competencies REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_dependencies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedbacks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_competencies;
