alter table public.profiles
  add column if not exists onboarding_completed boolean default false;

update public.profiles
set onboarding_completed = coalesce(onboarding_completed, onboarding_complete, false)
where onboarding_completed is distinct from coalesce(onboarding_complete, false);
