-- Allow admin to update and insert billing plan configuration
CREATE POLICY "billing_plans_update_admin"
ON public.billing_plans FOR UPDATE
USING (app.is_admin())
WITH CHECK (app.is_admin());
