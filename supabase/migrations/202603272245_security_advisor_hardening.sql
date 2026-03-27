begin;

-- Security Advisor: fix mutable search_path on public user-defined functions.
alter function public.complete_session(uuid) set search_path = public;
alter function public.fn_notify_application_status() set search_path = public;
alter function public.fn_notify_mission_completed() set search_path = public;
alter function public.fn_notify_new_application() set search_path = public;
alter function public.notify_application_status() set search_path = public;
alter function public.notify_delivery_uploaded() set search_path = public;
alter function public.notify_new_application() set search_path = public;
alter function public.notify_new_message() set search_path = public;
alter function public.notify_new_rating() set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.update_mission_search_vector() set search_path = public;
alter function public.update_profile_rating() set search_path = public;
alter function public.update_profile_search_vector() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;

-- Security Advisor: enforce invoker security for view access policy evaluation.
alter view public.public_profiles set (security_invoker = true);

-- Security Advisor: move extension objects out of public schema.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

commit;
