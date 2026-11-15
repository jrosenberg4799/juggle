alter table public.prototype_workspaces add column revision integer not null default 1;
create function public.save_prototype_workspace(p_data jsonb,p_revision integer)
returns integer language plpgsql security invoker set search_path='' as $$
declare next_revision integer;
begin
 if auth.uid() is null then raise exception 'Sign in before saving'; end if;
 if p_revision=0 then
  insert into public.prototype_workspaces(owner_id,data,revision) values(auth.uid(),p_data,1)
  on conflict(owner_id) do nothing returning revision into next_revision;
 else
  update public.prototype_workspaces set data=p_data,revision=revision+1,updated_at=now()
  where owner_id=auth.uid() and revision=p_revision returning revision into next_revision;
 end if;
 if next_revision is null then raise exception 'Workspace changed on another device. Reload before making further changes.'; end if;
 return next_revision;
end $$;
revoke execute on function public.save_prototype_workspace(jsonb,integer) from public,anon;
grant execute on function public.save_prototype_workspace(jsonb,integer) to authenticated;
