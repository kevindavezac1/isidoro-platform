-- ============================================================
-- Migración: 20260623000000
-- Agrega price_override a time_offer_products
--
-- Permite que una oferta por horario sobreescriba el precio
-- normal de un producto (ej: Happy Hour → copa de vino a mitad de precio).
-- NULL = sin override, el frontend muestra el precio original del producto.
-- ============================================================

alter table public.time_offer_products
  add column price_override numeric(10,2);

comment on column public.time_offer_products.price_override is
  'Precio de venta durante la oferta. NULL = usar products.price sin cambio.';
