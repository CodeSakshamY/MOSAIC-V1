-- A certificate or award can be marked verified by a trusted writer.
-- A builder cannot set or clear that mark.

alter table public.profile_certificates
  add column verified_at timestamptz;

alter table public.profile_awards
  add column verified_at timestamptz;

create or replace function private.guard_credential_verification()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.verified_at = null;
  else
    new.verified_at = old.verified_at;
  end if;

  return new;
end;
$$;

create trigger profile_certificates_biu_30_verified
before insert or update on public.profile_certificates
for each row
execute function private.guard_credential_verification();

create trigger profile_awards_biu_30_verified
before insert or update on public.profile_awards
for each row
execute function private.guard_credential_verification();
