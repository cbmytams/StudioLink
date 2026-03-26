create or replace function public.claim_invitation(p_code text, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  row_count integer := 0;
  has_used boolean;
  has_used_at boolean;
  has_used_by boolean;
begin
  if v_code = '' or p_user_id is null then
    return false;
  end if;

  if to_regclass('public.invitations') is not null then
    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'used'
    ) into has_used;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'used_at'
    ) into has_used_at;

    select exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'invitations'
        and column_name = 'used_by'
    ) into has_used_by;

    if has_used then
      if has_used_at and has_used_by then
        execute format(
          $q$
            update public.invitations
            set
              used = true,
              used_by = coalesce(used_by, %L::uuid),
              used_at = now()
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
              and (used_by is null or used_by = %L::uuid)
          $q$,
          p_user_id,
          v_code,
          p_user_id
        );
      elsif has_used_at and not has_used_by then
        execute format(
          $q$
            update public.invitations
            set
              used = true,
              used_at = now()
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
          $q$,
          v_code
        );
      elsif has_used_by then
        execute format(
          $q$
            update public.invitations
            set
              used = true,
              used_by = coalesce(used_by, %L::uuid)
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
              and (used_by is null or used_by = %L::uuid)
          $q$,
          p_user_id,
          v_code,
          p_user_id
        );
      else
        execute format(
          $q$
            update public.invitations
            set used = true
            where upper(code) = %L
              and coalesce(used, false) = false
              and (expires_at is null or expires_at > now())
          $q$,
          v_code
        );
      end if;
    else
      if has_used_by then
        execute format(
          $q$
            update public.invitations
            set used_by = %L::uuid
            where upper(code) = %L
              and used_by is null
              and (expires_at is null or expires_at > now())
          $q$,
          p_user_id,
          v_code
        );
      end if;
    end if;

    get diagnostics row_count = ROW_COUNT;
    if row_count > 0 then
      return true;
    end if;

    if has_used and has_used_by then
      execute format(
        $q$
          select exists (
            select 1
            from public.invitations
            where upper(code) = %L
              and coalesce(used, false) = true
              and used_by = %L::uuid
          )
        $q$,
        v_code,
        p_user_id
      ) into has_used;
      if has_used then
        return true;
      end if;
    end if;
  end if;

  if to_regclass('public.invitation_codes') is not null then
    update public.invitation_codes
    set
      status = 'used',
      used_by = p_user_id,
      used_at = now()
    where upper(code) = v_code
      and status = 'available'
      and (expires_at is null or expires_at > now());

    get diagnostics row_count = ROW_COUNT;
    if row_count > 0 then
      return true;
    end if;

    perform 1
    from public.invitation_codes
    where upper(code) = v_code
      and status = 'used'
      and used_by = p_user_id;

    if found then
      return true;
    end if;
  end if;

  return false;
end;
$function$;
