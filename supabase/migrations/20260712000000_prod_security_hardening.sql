-- Production security hardening: fixes for critical/high/medium audit findings.
-- Applied: 2026-07-12

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 1 (CRITICAL): Restore teacher invite enforcement + side-effect upserts
-- in the active on_auth_user_created trigger function.
-- Migration 20260516130000 replaced app.handle_new_auth_user with a stripped-
-- down public.handle_new_user that lost invite checking, student_insights, and
-- user_preferences rows.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_role text;
  invite_code_meta text;
  normalized_role public.app_role;
begin
  meta_role         := lower(coalesce(new.raw_user_meta_data->>'role', 'student'));
  invite_code_meta  := coalesce(new.raw_user_meta_data->>'teacher_invite_code', '');
  normalized_role   := 'student'::public.app_role;

  if meta_role = 'teacher' then
    if not exists (
      select 1 from public.teacher_invites ti
      where lower(ti.email::text) = lower(new.email)
        and ti.invite_code = invite_code_meta
        and ti.status = 'pending'
        and (ti.expires_at is null or ti.expires_at > now())
    ) then
      raise exception 'Teacher invite is invalid or expired';
    end if;

    normalized_role := 'teacher'::public.app_role;

    update public.teacher_invites
    set status = 'claimed', claimed_at = now(), claimed_user_id = new.id
    where lower(email::text) = lower(new.email)
      and invite_code = invite_code_meta
      and status = 'pending';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    normalized_role
  )
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = excluded.full_name,
        role       = excluded.role,
        updated_at = now();

  if normalized_role = 'student' then
    insert into public.student_insights (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 2 (CRITICAL): Drop the open teacher_subscriptions self-insert policy.
-- A teacher could bypass Dodo Payments by inserting their own active sub row.
-- Subscriptions must only be written by the dodo-webhook service-role path.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "teacher_subscriptions_insert_self" on public.teacher_subscriptions;

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 3 (MEDIUM): Restrict organizations INSERT to teachers and platform admins.
-- The previous policy used WITH CHECK (true), allowing any authenticated user
-- (including students) to create an org.
-- A trigger auto-adds the creator as org admin to solve the bootstrapping issue.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "org admins can insert orgs" on public.organizations;

create policy "teachers and admins can create orgs"
  on public.organizations for insert
  with check (app.current_role() in ('teacher', 'admin'));

create or replace function public.handle_org_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null then
    insert into public.org_members (org_id, user_id, org_role)
    values (new.id, auth.uid(), 'admin')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_org_created on public.organizations;
create trigger on_org_created
  after insert on public.organizations
  for each row execute function public.handle_org_created();

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 4 (MEDIUM): Enforce sender_user_id = auth.uid() on class_messages INSERT.
-- Without this, a class member could impersonate another user in class chat.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "class_messages_insert_class_members_or_admin" on public.class_messages;

create policy "class_messages_insert_class_members_or_admin"
  on public.class_messages for insert
  with check (
    (app.is_member_of_class(class_id) or app.is_admin())
    and sender_user_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- FIX 5 (MEDIUM): Add missing indexes for common query patterns.
-- lessons(class_id) is hit by every lesson list and RLS helper functions.
-- teacher_subscriptions(teacher_user_id) is hit by token-limit checks and
-- the signalwire-token function on every session join.
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists idx_lessons_class_id
  on public.lessons (class_id);

create index if not exists idx_teacher_subscriptions_teacher_user_id
  on public.teacher_subscriptions (teacher_user_id);
