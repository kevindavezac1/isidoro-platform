-- ============================================================
-- FUNCIONES ATÓMICAS — Lógica de negocio crítica
-- Llamadas desde Edge Functions vía RPC con service role.
-- SECURITY DEFINER: corren como postgres, bypasan RLS.
-- ============================================================

-- ============================================================
-- register_consumption
-- El cajero registra un consumo y acredita puntos al cliente.
-- Garantía: inserción en consumptions + points_transactions +
--            actualización de points_balance es todo-o-nada.
-- ============================================================
create or replace function public.register_consumption(
  p_client_id   uuid,
  p_cashier_id  uuid,
  p_amount      numeric,
  p_notes       text    default null,
  p_session_id  uuid    default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points_per_peso  numeric;
  v_points_earned    int;
  v_consumption_id   uuid;
  v_new_balance      int;
begin
  -- Validar que el cajero existe y tiene el rol correcto
  if not exists (
    select 1 from public.profiles
    where id = p_cashier_id and role in ('cajero', 'admin')
  ) then
    raise exception 'unauthorized_cashier'
      using detail = 'El ID de cajero no corresponde a un cajero o admin válido';
  end if;

  -- Validar que el cliente existe
  if not exists (
    select 1 from public.profiles
    where id = p_client_id and role = 'cliente'
  ) then
    raise exception 'client_not_found'
      using detail = 'No se encontró un cliente con ese ID';
  end if;

  -- Leer equivalencia de puntos desde settings
  select points_per_peso into v_points_per_peso
  from public.settings
  limit 1;

  -- Calcular puntos (floor: no se dan puntos parciales)
  v_points_earned := floor(p_amount * v_points_per_peso)::int;

  -- Insertar consumo
  insert into public.consumptions (client_id, cashier_id, amount, points_earned, notes, session_id)
  values (p_client_id, p_cashier_id, p_amount, v_points_earned, p_notes, p_session_id)
  returning id into v_consumption_id;

  -- Registrar transacción de puntos (vence en 12 meses)
  insert into public.points_transactions (client_id, type, consumption_id, points, expires_at)
  values (
    p_client_id,
    'consumption',
    v_consumption_id,
    v_points_earned,
    now() + interval '12 months'
  );

  -- Actualizar saldo (upsert: el trigger ya crea la fila, pero por seguridad)
  insert into public.points_balance (client_id, total_points, updated_at)
  values (p_client_id, v_points_earned, now())
  on conflict (client_id) do update
    set total_points = public.points_balance.total_points + v_points_earned,
        updated_at   = now();

  select total_points into v_new_balance
  from public.points_balance
  where client_id = p_client_id;

  return json_build_object(
    'consumption_id', v_consumption_id,
    'points_earned',  v_points_earned,
    'new_balance',    v_new_balance
  );
end;
$$;

-- ============================================================
-- confirm_redemption
-- El cajero confirma un canje ingresando el código de 6 dígitos.
-- Garantía ATÓMICA: validar código + vencimiento + saldo +
--   descuento FIFO de puntos + stock + confirmar → todo o nada.
--
-- FIFO: se descontan primero los puntos con expires_at más
--       cercano (los más antiguos), agrupando por bucket de
--       expires_at para respetar el historial de expiración.
-- ============================================================
create or replace function public.confirm_redemption(
  p_code       text,
  p_cashier_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_redemption_id  uuid;
  v_client_id      uuid;
  v_reward_id      uuid;
  v_reward_name    text;
  v_points_cost    int;
  v_reward_stock   int;
  v_code_expires   timestamptz;
  v_total_points   int;
  v_to_deduct      int;
  v_new_balance    int;

  -- Para iteración FIFO
  v_bucket_expires  timestamptz;
  v_bucket_avail    int;
  v_deduct_now      int;
begin
  -- Validar cajero
  if not exists (
    select 1 from public.profiles
    where id = p_cashier_id and role in ('cajero', 'admin')
  ) then
    raise exception 'unauthorized_cashier'
      using detail = 'El ID de cajero no corresponde a un cajero o admin válido';
  end if;

  -- Buscar el canje pendiente con bloqueo para evitar race conditions
  select r.id, r.client_id, r.reward_id, r.expires_at,
         rew.name, rew.points_cost, rew.stock
  into v_redemption_id, v_client_id, v_reward_id, v_code_expires,
       v_reward_name, v_points_cost, v_reward_stock
  from public.redemptions r
  join public.rewards rew on rew.id = r.reward_id
  where r.code = p_code
    and r.status = 'pending'
  for update of r;

  if not found then
    raise exception 'invalid_code'
      using detail = 'Código inválido, ya utilizado o ya expirado';
  end if;

  -- Verificar que el código no expiró
  if v_code_expires <= now() then
    update public.redemptions
    set status = 'expired'
    where id = v_redemption_id;
    raise exception 'code_expired'
      using detail = 'El código de canje expiró. El cliente debe generar uno nuevo.';
  end if;

  -- Bloquear y verificar saldo actual
  select total_points into v_total_points
  from public.points_balance
  where client_id = v_client_id
  for update;

  if not found or v_total_points < v_points_cost then
    raise exception 'insufficient_points'
      using detail = format(
        'Saldo insuficiente. Disponible: %s, Requerido: %s',
        coalesce(v_total_points, 0),
        v_points_cost
      );
  end if;

  -- FIFO: descontar puntos del bucket más antiguo al más nuevo.
  -- Agrupa por expires_at para calcular cuántos quedan disponibles
  -- en cada bucket (neto de créditos menos débitos ya aplicados).
  v_to_deduct := v_points_cost;

  for v_bucket_expires, v_bucket_avail in
    select
      pt.expires_at,
      sum(pt.points)::int as net_points
    from public.points_transactions pt
    where pt.client_id = v_client_id
      and (pt.expires_at is null or pt.expires_at > now())
    group by pt.expires_at
    having sum(pt.points) > 0
    order by pt.expires_at asc nulls last
  loop
    exit when v_to_deduct <= 0;

    v_deduct_now := least(v_bucket_avail, v_to_deduct);

    insert into public.points_transactions
      (client_id, type, redemption_id, points, expires_at)
    values
      (v_client_id, 'redemption', v_redemption_id, -v_deduct_now, v_bucket_expires);

    v_to_deduct := v_to_deduct - v_deduct_now;
  end loop;

  -- Sanity check: nunca debería ocurrir si el balance es correcto
  if v_to_deduct > 0 then
    raise exception 'fifo_underflow'
      using detail = 'Error interno: discrepancia entre points_balance y points_transactions';
  end if;

  -- Actualizar saldo
  update public.points_balance
  set total_points = total_points - v_points_cost,
      updated_at   = now()
  where client_id = v_client_id
  returning total_points into v_new_balance;

  -- Decrementar stock si la recompensa tiene límite de unidades
  if v_reward_stock is not null then
    update public.rewards
    set stock      = stock - 1,
        updated_at = now()
    where id = v_reward_id
      and stock > 0;

    if not found then
      raise exception 'out_of_stock'
        using detail = 'La recompensa se agotó mientras se procesaba el canje';
    end if;
  end if;

  -- Marcar canje como confirmado
  update public.redemptions
  set status       = 'confirmed',
      cashier_id   = p_cashier_id,
      confirmed_at = now()
  where id = v_redemption_id;

  return json_build_object(
    'redemption_id',      v_redemption_id,
    'client_id',          v_client_id,
    'reward_name',        v_reward_name,
    'points_used',        v_points_cost,
    'client_new_balance', v_new_balance
  );
end;
$$;
