-- ============================================================
-- split_consumption
-- Divide una cuenta de mesa entre N clientes en una sola
-- transacción atómica. Cada cliente recibe su propia fila en
-- consumptions y gana puntos proporcionales a su monto.
-- El session_id se genera internamente y agrupa todas las filas
-- del mismo split (DEC-007).
-- ============================================================

create or replace function public.split_consumption(
  p_cashier_id uuid,
  p_splits     jsonb   -- [{"client_id": "uuid", "amount": 1200.00}, ...]
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points_per_peso  numeric;
  v_session_id       uuid := gen_random_uuid();
  v_results          jsonb := '[]'::jsonb;

  -- Variables de iteración
  v_client_id        uuid;
  v_amount           numeric;
  v_points_earned    int;
  v_consumption_id   uuid;
  v_new_balance      int;
begin
  -- Validar cajero
  if not exists (
    select 1 from public.profiles
    where id = p_cashier_id and role in ('cajero', 'admin')
  ) then
    raise exception 'unauthorized_cashier'
      using detail = 'El ID de cajero no corresponde a un cajero o admin válido';
  end if;

  -- Validar que hay al menos 2 entradas
  if jsonb_array_length(p_splits) < 2 then
    raise exception 'insufficient_splits'
      using detail = 'Se requieren al menos 2 clientes para dividir una cuenta';
  end if;

  -- Validar client_ids únicos en el array
  if (
    select count(distinct (entry->>'client_id'))
    from jsonb_array_elements(p_splits) as entry
  ) < jsonb_array_length(p_splits) then
    raise exception 'duplicate_client_id'
      using detail = 'El mismo client_id aparece más de una vez en el split';
  end if;

  -- Leer equivalencia de puntos
  select points_per_peso into v_points_per_peso
  from public.settings
  limit 1;

  -- Iterar sobre cada entrada del split
  for v_client_id, v_amount in
    select
      (entry->>'client_id')::uuid,
      (entry->>'amount')::numeric
    from jsonb_array_elements(p_splits) as entry
  loop
    -- Validar monto positivo
    if v_amount <= 0 then
      raise exception 'invalid_amount'
        using detail = format('El monto para client_id %s debe ser mayor a 0', v_client_id);
    end if;

    -- Validar que el cliente existe con rol correcto
    if not exists (
      select 1 from public.profiles
      where id = v_client_id and role = 'cliente'
    ) then
      raise exception 'client_not_found'
        using detail = format('No se encontró un cliente con id %s', v_client_id);
    end if;

    -- Calcular puntos del cliente para su porción
    v_points_earned := floor(v_amount * v_points_per_peso)::int;

    -- Insertar consumo (con session_id compartido)
    insert into public.consumptions (client_id, cashier_id, amount, points_earned, session_id)
    values (v_client_id, p_cashier_id, v_amount, v_points_earned, v_session_id)
    returning id into v_consumption_id;

    -- Registrar transacción de puntos (vence en 12 meses)
    insert into public.points_transactions (client_id, type, consumption_id, points, expires_at)
    values (
      v_client_id,
      'consumption',
      v_consumption_id,
      v_points_earned,
      now() + interval '12 months'
    );

    -- Actualizar saldo (FOR UPDATE implícito en upsert via serialización del loop)
    insert into public.points_balance (client_id, total_points, updated_at)
    values (v_client_id, v_points_earned, now())
    on conflict (client_id) do update
      set total_points = public.points_balance.total_points + v_points_earned,
          updated_at   = now();

    select total_points into v_new_balance
    from public.points_balance
    where client_id = v_client_id;

    -- Acumular resultado de este cliente
    v_results := v_results || jsonb_build_object(
      'client_id',      v_client_id,
      'consumption_id', v_consumption_id,
      'points_earned',  v_points_earned,
      'new_balance',    v_new_balance
    );
  end loop;

  return json_build_object(
    'session_id', v_session_id,
    'splits',     v_results
  );
end;
$$;
