-- Account-scoped prototype. Role switching is UI simulation within one owner's workspace.
-- Operational normalization and independent worker accounts remain a later migration.
create table public.prototype_workspaces(
 owner_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null,
 updated_at timestamptz not null default now(),
 constraint no_inline_media check (data::text !~* '(data:|local://|base64,)'),
 constraint workspace_shape check (jsonb_typeof(data)='object' and jsonb_typeof(data->'properties')='array' and jsonb_typeof(data->'assets')='array')
);
alter table public.prototype_workspaces enable row level security;
create policy own_workspace_read on public.prototype_workspaces for select to authenticated using(owner_id=(select auth.uid()));
create policy own_workspace_insert on public.prototype_workspaces for insert to authenticated with check(owner_id=(select auth.uid()));
create policy own_workspace_update on public.prototype_workspaces for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('maintenance-evidence','maintenance-evidence',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
create policy kitchen_media_insert on storage.objects for insert to authenticated with check(bucket_id='maintenance-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy kitchen_media_read on storage.objects for select to authenticated using(bucket_id='maintenance-evidence' and (storage.foldername(name))[1]=(select auth.uid())::text);
