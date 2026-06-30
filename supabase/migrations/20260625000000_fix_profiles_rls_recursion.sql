-- ============================================================
-- FIX: infinite recursion in profiles RLS policy
-- The old policy queried profiles from within a profiles policy,
-- causing "infinite recursion detected in policy for relation profiles".
-- Fix: use a SECURITY DEFINER function that bypasses RLS.
-- ============================================================

-- Helper function runs as owner (bypasses RLS) — no recursion possible
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Drop the recursive policy
drop policy if exists "profiles: cajero y admin ven todos" on public.profiles;

-- Recreate using the security definer function
create policy "profiles: cajero y admin ven todos" on public.profiles
  for select using (public.current_user_role() in ('cajero', 'admin'));
