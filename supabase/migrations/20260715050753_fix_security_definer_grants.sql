-- ============================================================
-- FIX: SECURITY DEFINER functions exposed to anon/authenticated via RPC.
-- Postgres grants EXECUTE to PUBLIC by default on function creation, so
-- revoking only from anon/authenticated individually is not enough —
-- PUBLIC must be revoked explicitly too.
-- ============================================================

-- Grupo 1: acciones de negocio — solo Edge Functions con service_role
REVOKE EXECUTE ON FUNCTION public.adjust_points(uuid, uuid, int, text, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.adjust_points(uuid, uuid, int, text, timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.confirm_redemption(text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.confirm_redemption(text, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.register_consumption(uuid, uuid, numeric, text, uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.register_consumption(uuid, uuid, numeric, text, uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.split_consumption(uuid, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.split_consumption(uuid, jsonb) TO service_role;

-- Grupo 1b: reportes — solo Edge Function "reports" con service_role
REVOKE EXECUTE ON FUNCTION public.report_summary(timestamptz, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.report_summary(timestamptz, timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.report_consumptions_by_day(timestamptz, timestamptz) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.report_consumptions_by_day(timestamptz, timestamptz) TO service_role;

REVOKE EXECUTE ON FUNCTION public.report_top_clients(timestamptz, timestamptz, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.report_top_clients(timestamptz, timestamptz, int) TO service_role;

REVOKE EXECUTE ON FUNCTION public.report_top_rewards(timestamptz, timestamptz, int) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.report_top_rewards(timestamptz, timestamptz, int) TO service_role;

-- Grupo 2: internas — jamás invocables vía RPC, sin re-grant a nadie
-- handle_new_user: solo la dispara el trigger on_auth_user_created.
-- El firing de un trigger no exige EXECUTE en el rol de la sesión
-- que hace el INSERT, así que revocar no rompe el signup.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- rls_auto_enable: returns event_trigger, disparada por event trigger
-- de DDL. Postgres no permite invocar funciones event_trigger vía
-- SELECT/RPC bajo ningún rol — el grant a PUBLIC es residual.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- Grupo 3: current_user_role — caso especial.
-- Usada en tiempo real por la policy RLS
-- "profiles: cajero y admin ven todos" (20260625000001_fix_grants_and_rls.sql).
-- 'authenticated' DEBE conservar EXECUTE o esa policy rompe para todo
-- cajero/admin que liste profiles. 'anon' no tiene ningún grant sobre
-- profiles, así que no la necesita.
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
