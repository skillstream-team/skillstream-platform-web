-- Allow a teacher to insert their own subscription row on sign-up.
-- Admin already has full access via teacher_subscriptions_manage_admin.
create policy "teacher_subscriptions_insert_self"
on public.teacher_subscriptions for insert
with check (teacher_user_id = auth.uid());
