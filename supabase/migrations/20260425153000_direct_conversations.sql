create table if not exists public.direct_conversations (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  participant_one_user_id uuid not null references public.profiles(id) on delete cascade,
  participant_two_user_id uuid not null references public.profiles(id) on delete cascade,
  created_by_user_id uuid not null references public.profiles(id),
  last_message_preview text not null default '',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint direct_conversation_distinct_participants
    check (participant_one_user_id <> participant_two_user_id),
  constraint direct_conversation_pair_unique
    unique (class_id, participant_one_user_id, participant_two_user_id)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.direct_conversations(id) on delete cascade,
  sender_user_id uuid not null references public.profiles(id) on delete cascade,
  sender_display_name text not null default 'User',
  body text not null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_direct_conversations_participant_one
  on public.direct_conversations (participant_one_user_id, last_message_at desc nulls last);
create index if not exists idx_direct_conversations_participant_two
  on public.direct_conversations (participant_two_user_id, last_message_at desc nulls last);
create index if not exists idx_direct_messages_conversation_sent
  on public.direct_messages (conversation_id, sent_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'direct_conversations_set_updated_at') then
    create trigger direct_conversations_set_updated_at
      before update on public.direct_conversations
      for each row execute function app.set_updated_at();
  end if;
end $$;

create or replace function app.touch_direct_conversation_after_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.direct_conversations
  set
    last_message_preview = left(new.body, 240),
    last_message_at = new.sent_at,
    updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists direct_messages_touch_conversation on public.direct_messages;
create trigger direct_messages_touch_conversation
  after insert on public.direct_messages
  for each row execute function app.touch_direct_conversation_after_message();

create or replace function public.upsert_direct_conversation(
  p_class_id uuid,
  p_other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_self uuid;
  v_one uuid;
  v_two uuid;
  v_self_role public.app_role;
  v_other_role public.app_role;
  v_conversation_id uuid;
begin
  v_self := auth.uid();
  if v_self is null then
    raise exception 'Authentication required';
  end if;
  if p_other_user_id is null or p_class_id is null then
    raise exception 'Class and participant are required';
  end if;
  if v_self = p_other_user_id then
    raise exception 'You cannot start a direct chat with yourself';
  end if;

  select cm.member_role into v_self_role
  from public.class_members cm
  where cm.class_id = p_class_id and cm.user_id = v_self
  limit 1;

  select cm.member_role into v_other_role
  from public.class_members cm
  where cm.class_id = p_class_id and cm.user_id = p_other_user_id
  limit 1;

  if v_self_role is null or v_other_role is null then
    raise exception 'Both users must be members of this class';
  end if;

  if not app.is_admin()
     and not (
       (v_self_role = 'teacher' and v_other_role = 'student')
       or (v_self_role = 'student' and v_other_role = 'teacher')
     )
  then
    raise exception 'Direct chats only support teacher-to-student conversations';
  end if;

  if v_self::text < p_other_user_id::text then
    v_one := v_self;
    v_two := p_other_user_id;
  else
    v_one := p_other_user_id;
    v_two := v_self;
  end if;

  insert into public.direct_conversations (
    class_id,
    participant_one_user_id,
    participant_two_user_id,
    created_by_user_id
  )
  values (p_class_id, v_one, v_two, v_self)
  on conflict (class_id, participant_one_user_id, participant_two_user_id)
  do update set updated_at = now()
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

alter table public.direct_conversations enable row level security;
alter table public.direct_messages enable row level security;

drop policy if exists "direct_conversations_read_participants_or_admin" on public.direct_conversations;
create policy "direct_conversations_read_participants_or_admin"
on public.direct_conversations for select
using (
  app.is_admin()
  or participant_one_user_id = auth.uid()
  or participant_two_user_id = auth.uid()
);

drop policy if exists "direct_conversations_insert_participant_or_admin" on public.direct_conversations;
create policy "direct_conversations_insert_participant_or_admin"
on public.direct_conversations for insert
with check (
  app.is_admin()
  or (
    (participant_one_user_id = auth.uid() or participant_two_user_id = auth.uid())
    and app.is_member_of_class(class_id)
  )
);

drop policy if exists "direct_conversations_update_participants_or_admin" on public.direct_conversations;
create policy "direct_conversations_update_participants_or_admin"
on public.direct_conversations for update
using (
  app.is_admin()
  or participant_one_user_id = auth.uid()
  or participant_two_user_id = auth.uid()
)
with check (
  app.is_admin()
  or participant_one_user_id = auth.uid()
  or participant_two_user_id = auth.uid()
);

drop policy if exists "direct_messages_read_participants_or_admin" on public.direct_messages;
create policy "direct_messages_read_participants_or_admin"
on public.direct_messages for select
using (
  app.is_admin()
  or exists (
    select 1
    from public.direct_conversations dc
    where dc.id = direct_messages.conversation_id
      and (dc.participant_one_user_id = auth.uid() or dc.participant_two_user_id = auth.uid())
  )
);

drop policy if exists "direct_messages_insert_sender_participant_or_admin" on public.direct_messages;
create policy "direct_messages_insert_sender_participant_or_admin"
on public.direct_messages for insert
with check (
  app.is_admin()
  or (
    sender_user_id = auth.uid()
    and exists (
      select 1
      from public.direct_conversations dc
      where dc.id = direct_messages.conversation_id
        and (dc.participant_one_user_id = auth.uid() or dc.participant_two_user_id = auth.uid())
    )
  )
);
