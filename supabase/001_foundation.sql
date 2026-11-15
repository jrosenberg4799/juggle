-- Foundation only. The current UI is explicitly browser-local demo mode.
-- Apply in a development Supabase project before wiring production adapters.
create extension if not exists pgcrypto;
create type public.member_role as enum ('administrator','inspector','contractor');
create table public.organizations(id uuid primary key default gen_random_uuid(),name text not null,created_at timestamptz not null default now());
create table public.organization_members(organization_id uuid references public.organizations on delete cascade,user_id uuid references auth.users on delete cascade,role public.member_role not null,primary key(organization_id,user_id));
create table public.clients(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations,name text not null);
create table public.properties(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations,client_id uuid references public.clients,name text not null,address text not null,timezone text not null default 'America/New_York',qr_id uuid unique not null default gen_random_uuid());
create table public.property_members(property_id uuid references public.properties on delete cascade,user_id uuid references auth.users on delete cascade,role public.member_role not null,primary key(property_id,user_id));
create table public.areas(id uuid primary key default gen_random_uuid(),property_id uuid not null references public.properties,name text not null,unique(property_id,name));
create table public.assets(id uuid primary key default gen_random_uuid(),area_id uuid not null references public.areas,name text not null,manufacturer text,model text,serial_number text,condition text not null default 'unconfirmed',qr_id uuid unique not null default gen_random_uuid(),plan_x numeric check(plan_x between 0 and 100),plan_y numeric check(plan_y between 0 and 100),created_at timestamptz not null default now());
create table public.maintenance_plans(id uuid primary key default gen_random_uuid(),asset_id uuid not null references public.assets,title text not null,procedures jsonb not null default '[]',recurrence jsonb,sources jsonb not null default '[]',research_status text not null default 'manual_review_required',approved_by uuid references auth.users,approved_at timestamptz,check((approved_by is null)=(approved_at is null)));
create table public.occurrences(id uuid primary key default gen_random_uuid(),plan_id uuid references public.maintenance_plans,asset_id uuid not null references public.assets,title text not null,due_at timestamptz not null,assigned_to uuid references auth.users,status text not null default 'scheduled');
create table public.inspections(id uuid primary key default gen_random_uuid(),occurrence_id uuid not null references public.occurrences,inspector_id uuid not null references auth.users,checked_in_at timestamptz not null default now(),submitted_at timestamptz,checklist jsonb not null default '[]',findings text,condition text);
create table public.work_orders(id uuid primary key default gen_random_uuid(),asset_id uuid not null references public.assets,inspection_id uuid references public.inspections,assigned_to uuid references auth.users,status text not null default 'triage' check(status in ('triage','assigned','in_progress','awaiting_verification','verified','returned')),description text not null,repair_notes text,verified_by uuid references auth.users,verified_at timestamptz);
create table public.service_events(id uuid primary key default gen_random_uuid(),asset_id uuid not null references public.assets,actor_id uuid not null default auth.uid() references auth.users,event_type text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
create table public.documents(id uuid primary key default gen_random_uuid(),property_id uuid not null references public.properties,asset_id uuid references public.assets,inspection_id uuid references public.inspections,work_order_id uuid references public.work_orders,kind text not null,storage_path text unique not null,uploaded_by uuid not null default auth.uid() references auth.users,created_at timestamptz not null default now());
-- Fail closed until production role/assignment adapters and their policies are implemented.
-- Never disable RLS to make the demo connect. Provision initial memberships with a trusted migration/admin.
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.properties enable row level security;
alter table public.property_members enable row level security;
alter table public.areas enable row level security;
alter table public.assets enable row level security;
alter table public.maintenance_plans enable row level security;
alter table public.occurrences enable row level security;
alter table public.inspections enable row level security;
alter table public.work_orders enable row level security;
alter table public.service_events enable row level security;
alter table public.documents enable row level security;
create function public.is_org_admin(org uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.organization_members where organization_id=org and user_id=(select auth.uid()) and role='administrator')$$;
create function public.can_read_property(prop uuid) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.properties p where p.id=prop and public.is_org_admin(p.organization_id)) or exists(select 1 from public.property_members where property_id=prop and user_id=(select auth.uid()) and role in ('administrator','inspector'))$$;
create policy org_admin_read on public.organizations for select to authenticated using(public.is_org_admin(id));
create policy own_membership on public.organization_members for select to authenticated using(user_id=(select auth.uid()));
create policy client_admin on public.clients for all to authenticated using(public.is_org_admin(organization_id)) with check(public.is_org_admin(organization_id));
create policy property_read on public.properties for select to authenticated using(public.can_read_property(id));
create policy property_admin on public.properties for all to authenticated using(public.is_org_admin(organization_id)) with check(public.is_org_admin(organization_id));
create policy membership_self on public.property_members for select to authenticated using(user_id=(select auth.uid()));
create policy area_read on public.areas for select to authenticated using(public.can_read_property(property_id));
create policy asset_read on public.assets for select to authenticated using(exists(select 1 from public.areas a where a.id=area_id and public.can_read_property(a.property_id)));
-- Assigned contractors can read only their work-order rows; further asset-history access needs a scoped server API.
create policy assigned_work_read on public.work_orders for select to authenticated using(assigned_to=(select auth.uid()));
create function public.prevent_event_mutation() returns trigger language plpgsql set search_path='' as $$begin raise exception 'Service events are append-only'; end$$;
create trigger immutable_service_events before update or delete on public.service_events for each row execute function public.prevent_event_mutation();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('maintenance-evidence','maintenance-evidence',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do nothing;
-- No storage object policies yet: private uploads stay blocked until authenticated scoped adapters exist.
