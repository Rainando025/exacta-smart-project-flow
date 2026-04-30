
DROP POLICY IF EXISTS "Authenticated create notifications" ON public.notifications;

CREATE POLICY "Create notifications for self or task members"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR (
      task_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = notifications.task_id
          AND (t.creator_id = auth.uid() OR t.assignee_id = auth.uid())
          AND (t.creator_id = notifications.user_id OR t.assignee_id = notifications.user_id)
      )
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );
