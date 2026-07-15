-- Agrega dni y city a profiles. phone ya existe (text, nullable) — sin cambios de tipo.
--
-- dni/phone/city son obligatorios para role='cliente' a nivel aplicación,
-- pero quedan nullable en DB: el trigger handle_new_user inserta profiles
-- sin estos campos en todo signup nuevo (email/password y Google OAuth),
-- y los usuarios ya existentes tampoco los tienen cargados.
-- La app debe forzar completar perfil vía UI, no vía constraint.

alter table public.profiles
  add column dni text,
  add column city text;

comment on column public.profiles.dni is
  'Documento de identidad. Obligatorio para role=cliente a nivel app; nullable en DB (signup Google / usuarios legacy sin perfil completo).';

comment on column public.profiles.phone is
  'Teléfono. Obligatorio para role=cliente a nivel app; nullable en DB (signup Google / usuarios legacy sin perfil completo).';

comment on column public.profiles.city is
  'Ciudad. Obligatorio para role=cliente a nivel app; nullable en DB (signup Google / usuarios legacy sin perfil completo).';
