-- Contactos de Blue: los del formulario de la web y los del formulario instantáneo de Meta.
-- Se ejecuta una vez en el editor SQL del proyecto de Supabase.
-- Solo el servidor de la web (con la clave secreta) lee y escribe: la tabla no tiene políticas
-- públicas, así que la clave pública (anon) no ve nada.

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  -- 'web' (formulario de /contacto) o 'meta_form' (formulario instantáneo de Meta)
  source text not null check (source in ('web', 'meta_form')),
  name text not null,
  email text,
  phone text,
  interest text,
  message text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'en_conversacion', 'cliente', 'descartado')),
  notes text,
  -- Identificador del envío de la web: evita duplicados si el visitante reintenta.
  request_id text unique,
  -- UTM, gclid, fbclid, página de entrada y procedencia de la visita.
  attribution jsonb not null default '{}'::jsonb,
  -- Identificador del lead de Meta: evita duplicados si Meta reenvía el aviso.
  meta_leadgen_id text unique,
  -- Formulario, campaña, conjunto, anuncio y plataforma del lead de Meta.
  meta jsonb not null default '{}'::jsonb
);

create index if not exists contacts_created_at_idx on public.contacts (created_at desc);

alter table public.contacts enable row level security;
revoke all on table public.contacts from anon, authenticated;
