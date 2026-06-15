-- ============================================================
-- FUNCIONES DE REPORTES — Panel admin
-- Todas son SECURITY DEFINER, llamadas desde Edge Function
-- con service role. Solo accesibles para admins.
-- ============================================================

-- ============================================================
-- report_summary
-- Totales del período: revenue, consumos, clientes únicos,
-- puntos acreditados y canjeados.
-- ============================================================
create or replace function public.report_summary(
  p_from timestamptz,
  p_to   timestamptz
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consumption_stats record;
  v_points_stats      record;
begin
  select
    count(*)::int                    as total_consumptions,
    coalesce(sum(amount), 0)         as total_revenue,
    count(distinct client_id)::int   as unique_clients
  into v_consumption_stats
  from public.consumptions
  where consumed_at >= p_from
    and consumed_at <  p_to;

  select
    coalesce(sum(case when type = 'consumption' and points > 0 then points else 0 end), 0)::int as total_credited,
    coalesce(abs(sum(case when type = 'redemption' then points else 0 end)), 0)::int             as total_redeemed
  into v_points_stats
  from public.points_transactions
  where created_at >= p_from
    and created_at <  p_to;

  return json_build_object(
    'total_revenue',         v_consumption_stats.total_revenue,
    'total_consumptions',    v_consumption_stats.total_consumptions,
    'unique_clients',        v_consumption_stats.unique_clients,
    'total_points_credited', v_points_stats.total_credited,
    'total_points_redeemed', v_points_stats.total_redeemed
  );
end;
$$;

-- ============================================================
-- report_consumptions_by_day
-- Desglose diario de consumos en la zona horaria del restaurante.
-- La fecha se agrupa según settings.timezone (DEC-005), nunca UTC.
-- ============================================================
create or replace function public.report_consumptions_by_day(
  p_from timestamptz,
  p_to   timestamptz
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_timezone text;
begin
  select timezone into v_timezone from public.settings limit 1;

  return coalesce(
    (
      select json_agg(row_to_json(r) order by r.date)
      from (
        select
          (date_trunc('day', consumed_at at time zone v_timezone))::date as date,
          count(*)::int                                                   as count,
          sum(amount)::numeric                                            as total_amount,
          sum(points_earned)::int                                         as points_earned
        from public.consumptions
        where consumed_at >= p_from
          and consumed_at <  p_to
        group by 1
        order by 1
      ) r
    ),
    '[]'::json
  );
end;
$$;

-- ============================================================
-- report_top_clients
-- Clientes más activos del período, ordenados por gasto total.
-- ============================================================
create or replace function public.report_top_clients(
  p_from  timestamptz,
  p_to    timestamptz,
  p_limit int default 10
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  return coalesce(
    (
      select json_agg(row_to_json(r))
      from (
        select
          c.client_id,
          p.full_name,
          count(*)::int          as visit_count,
          sum(c.amount)::numeric as total_spent,
          sum(c.points_earned)::int as total_points_earned
        from public.consumptions c
        join public.profiles p on p.id = c.client_id
        where c.consumed_at >= p_from
          and c.consumed_at <  p_to
        group by c.client_id, p.full_name
        order by total_spent desc
        limit p_limit
      ) r
    ),
    '[]'::json
  );
end;
$$;

-- ============================================================
-- report_top_rewards
-- Recompensas más canjeadas del período (solo canjes confirmados).
-- ============================================================
create or replace function public.report_top_rewards(
  p_from  timestamptz,
  p_to    timestamptz,
  p_limit int default 10
)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  return coalesce(
    (
      select json_agg(row_to_json(r))
      from (
        select
          r.id                       as reward_id,
          r.name                     as reward_name,
          count(*)::int              as redemption_count,
          sum(red.points_used)::int  as total_points_used
        from public.redemptions red
        join public.rewards r on r.id = red.reward_id
        where red.status       = 'confirmed'
          and red.confirmed_at >= p_from
          and red.confirmed_at <  p_to
        group by r.id, r.name
        order by redemption_count desc
        limit p_limit
      ) r
    ),
    '[]'::json
  );
end;
$$;
