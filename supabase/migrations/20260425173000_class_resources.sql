do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'class_resource_kind'
      and n.nspname = 'public'
  ) then
    create type public.class_resource_kind as enum ('note', 'document', 'pdf', 'video');
  end if;
end $$;

create table if not exists public.class_resources (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text not null default '',
  kind public.class_resource_kind not null default 'document',
  note_body text not null default '',
  file_path text,
  external_url text,
  created_by_user_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_resources_content_check check (
    char_length(trim(note_body)) > 0
    or file_path is not null
    or external_url is not null
  )
);

create index if not exists idx_class_resources_class_created
  on public.class_resources (class_id, created_at desc);

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'class_resources_set_updated_at') then
    create trigger class_resources_set_updated_at
      before update on public.class_resources
      for each row execute function app.set_updated_at();
  end if;
end $$;

alter table public.class_resources enable row level security;

drop policy if exists "class_resources_read_class_members_or_admin" on public.class_resources;
create policy "class_resources_read_class_members_or_admin"
on public.class_resources for select
using (app.is_member_of_class(class_id) or app.is_admin());

drop policy if exists "class_resources_manage_teacher_or_admin" on public.class_resources;
create policy "class_resources_manage_teacher_or_admin"
on public.class_resources for all
using (app.is_teacher_of_class(class_id) or app.is_admin())
with check (app.is_teacher_of_class(class_id) or app.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'class-resources',
  'class-resources',
  false,
  1073741824,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "class_resources_bucket_select_members_or_admin" on storage.objects;
drop policy if exists "class_resources_bucket_insert_teacher_or_admin" on storage.objects;
drop policy if exists "class_resources_bucket_update_teacher_or_admin" on storage.objects;
drop policy if exists "class_resources_bucket_delete_teacher_or_admin" on storage.objects;

create policy "class_resources_bucket_select_members_or_admin"
on storage.objects for select
using (
  bucket_id = 'class-resources'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and exists (
        select 1
        from public.class_members cm
        where cm.class_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
      )
    )
  )
);

create policy "class_resources_bucket_insert_teacher_or_admin"
on storage.objects for insert
with check (
  bucket_id = 'class-resources'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and exists (
        select 1
        from public.class_members cm
        where cm.class_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
          and cm.member_role = 'teacher'
      )
    )
  )
);

create policy "class_resources_bucket_update_teacher_or_admin"
on storage.objects for update
using (
  bucket_id = 'class-resources'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and exists (
        select 1
        from public.class_members cm
        where cm.class_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
          and cm.member_role = 'teacher'
      )
    )
  )
)
with check (
  bucket_id = 'class-resources'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and exists (
        select 1
        from public.class_members cm
        where cm.class_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
          and cm.member_role = 'teacher'
      )
    )
  )
);

create policy "class_resources_bucket_delete_teacher_or_admin"
on storage.objects for delete
using (
  bucket_id = 'class-resources'
  and (
    app.is_admin()
    or (
      split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
      and exists (
        select 1
        from public.class_members cm
        where cm.class_id = split_part(name, '/', 1)::uuid
          and cm.user_id = auth.uid()
          and cm.member_role = 'teacher'
      )
    )
  )
);
