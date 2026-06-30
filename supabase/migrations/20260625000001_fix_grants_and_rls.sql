-- ============================================================
-- FIX 1: GRANTs faltantes para roles anon y authenticated
-- Las tablas creadas por migración no heredan GRANTs automáticos
-- del dashboard de Supabase.
-- ============================================================

-- Schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Tablas públicas (legibles sin autenticación)
GRANT SELECT ON public.settings            TO anon, authenticated;
GRANT SELECT ON public.categories          TO anon, authenticated;
GRANT SELECT ON public.products            TO anon, authenticated;
GRANT SELECT ON public.promotions          TO anon, authenticated;
GRANT SELECT ON public.time_offers         TO anon, authenticated;
GRANT SELECT ON public.time_offer_products TO anon, authenticated;
GRANT SELECT ON public.rewards             TO anon, authenticated;

-- Tablas privadas (solo authenticated, RLS filtra filas)
GRANT SELECT, UPDATE ON public.profiles             TO authenticated;
GRANT SELECT          ON public.points_balance      TO authenticated;
GRANT SELECT          ON public.points_transactions TO authenticated;
GRANT SELECT          ON public.consumptions        TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.redemptions  TO authenticated;

-- ============================================================
-- FIX 2: RLS infinite recursion en profiles
-- La política "cajero y admin ven todos" consultaba profiles
-- desde dentro de una política ON profiles → recursión fatal.
-- Fix: función SECURITY DEFINER que bypassea RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Eliminar política recursiva
DROP POLICY IF EXISTS "profiles: cajero y admin ven todos" ON public.profiles;

-- Recrear sin recursión
CREATE POLICY "profiles: cajero y admin ven todos" ON public.profiles
  FOR SELECT USING (public.current_user_role() IN ('cajero', 'admin'));

-- Mismo fix para todas las otras tablas con políticas que referencian profiles
-- (consumptions, points_balance, etc.) — se benefician automáticamente
-- porque ahora current_user_role() no recurre.
