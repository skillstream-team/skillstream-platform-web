insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-resources',
  'assignment-resources',
  true,
  10485760,
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
    'image/jpeg'
  ]
)
on conflict (id) do nothing;

drop policy if exists "assignment_resources_select_class_members" on storage.objects;
drop policy if exists "assignment_resources_insert_teacher_or_admin" on storage.objects;
drop policy if exists "assignment_resources_update_teacher_or_admin" on storage.objects;
drop policy if exists "assignment_resources_delete_teacher_or_admin" on storage.objects;

create policy "assignment_resources_select_class_members"
on storage.objects for select
using (
  bucket_id = 'assignment-resources'
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

create policy "assignment_resources_insert_teacher_or_admin"
on storage.objects for insert
with check (
  bucket_id = 'assignment-resources'
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

create policy "assignment_resources_update_teacher_or_admin"
on storage.objects for update
using (
  bucket_id = 'assignment-resources'
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
  bucket_id = 'assignment-resources'
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

create policy "assignment_resources_delete_teacher_or_admin"
on storage.objects for delete
using (
  bucket_id = 'assignment-resources'
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
