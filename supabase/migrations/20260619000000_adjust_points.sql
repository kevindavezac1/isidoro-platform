-- ============================================================
-- AJUSTE MANUAL DE PUNTOS (DEC-010)
-- Migración: 20260619000000
-- ============================================================

-- Columna notes en points_transactions para auditoría de ajustes manuales
alter table public.points_transactions
  add column if not exists notes text;

-- ============================================================
-- adjust_points
-- El admin acredita o descuenta puntos manualmente a un cliente.
--
-- CRÉDITO (points > 0):
--   Inserta una sola fila positiva. expires_at = custom o +12 meses.
--
-- DÉBITO (points < 0):
--   Valida saldo suficiente (FOR UPDATE sobre points_balance).
--   Inserta una sola fila negativa con expires_at = NULL.
--   El bucket NULL siempre es negativo → HAVING > 0 lo excluye del FIFO
--   de confirm_redemption, por lo que los débitos manuales no interfieren
--   con la lógica FIFO de canjes regulares.
-- ============================================================
create or replace function public.adjust_points(
  p_admin_id   uuid,
  p_client_id  uuid,
  p_points     int,
  p_notes      text        default null,
  p_expires_at timestamptz default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_id  uuid;
  v_current_balance int;
  v_new_balance     int;
begin
  -- Validar que el caller es admin
  if not exists (
    select 1 from public.profiles
    where id = p_admin_id and role = 'admin'
  ) then
    raise exception 'unauthorized'
      using detail = 'Solo un administrador puede realizar ajustes manuales de puntos';
  end if;

  -- Validar que el cliente existe y tiene rol cliente
  if not exists (
    select 1 from public.profiles
    where id = p_client_id and role = 'cliente'
  ) then
    raise exception 'client_not_found'
      using detail = 'No se encontró un cliente con ese ID';
  end if;

  -- Validar que el ajuste no es cero
  if p_points = 0 then
    raise exception 'invalid_points'
      using detail = 'El ajuste de puntos no puede ser 0';
  end if;

  if p_points > 0 then
    -- CRÉDITO: fila positiva con vencimiento configurable
    insert into public.points_transactions
      (client_id, type, adjusted_by, points, notes, expires_at)
    values (
      p_client_id,
      'manual_adjustment',
      p_admin_id,
      p_points,
      p_notes,
      coalesce(p_expires_at, now() + interval '12 months')
    )
    returning id into v_transaction_id;

    -- Actualizar saldo (upsert por seguridad, el trigger ya crea la fila)
    insert into public.points_balance (client_id, total_points, updated_at)
    values (p_client_id, p_points, now())
    on conflict (client_id) do update
      set total_points = public.points_balance.total_points + p_points,
          updated_at   = now()
    returning total_points into v_new_balance;

  else
    -- DÉBITO: bloquear fila de saldo para evitar race conditions
    select total_points into v_current_balance
    from public.points_balance
    where client_id = p_client_id
    for update;

    if not found or v_current_balance < (-p_points) then
      raise exception 'insufficient_points'
        using detail = format(
          'Saldo insuficiente. Disponible: %s, Requerido: %s',
          coalesce(v_current_balance, 0),
          -p_points
        );
    end if;

    -- Fila negativa con expires_at = NULL (bucket excluido del FIFO por HAVING > 0)
    insert into public.points_transactions
      (client_id, type, adjusted_by, points, notes, expires_at)
    values (
      p_client_id,
      'manual_adjustment',
      p_admin_id,
      p_points,
      p_notes,
      null
    )
    returning id into v_transaction_id;

    -- Actualizar saldo
    update public.points_balance
    set total_points = total_points + p_points,
        updated_at   = now()
    where client_id = p_client_id
    returning total_points into v_new_balance;
  end if;

  return json_build_object(
    'transaction_id', v_transaction_id,
    'client_id',      p_client_id,
    'points',         p_points,
    'new_balance',    v_new_balance
  );
end;
$$;
