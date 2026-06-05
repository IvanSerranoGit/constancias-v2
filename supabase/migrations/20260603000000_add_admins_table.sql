-- Migración: tabla de administradores autorizados
-- Restringe el acceso al panel /admin. Tener sesión en Supabase Auth ya NO es
-- suficiente: el usuario debe existir en esta tabla.

create table if not exists public.admins (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Habilitar Row Level Security
alter table public.admins enable row level security;

-- Política: un usuario autenticado solo puede LEER su propia fila.
-- Necesaria para que el middleware (que consulta con la anon key en el
-- contexto del usuario) pueda comprobar si está autorizado.
-- El service_role omite RLS automáticamente, así que las API routes pueden
-- gestionar la tabla sin problema.
create policy "Admins can read their own row"
  on public.admins
  for select
  to authenticated
  using (auth.uid() = id);

-- Fila inicial: administrador autorizado (Iván).
insert into public.admins (id, email)
values (
  'c985ce4f-09f7-4820-8dd6-34ecabdb348a',  -- UUID de auth de Iván
  'contacto.ivanserrano@gmail.com'
)
on conflict (id) do nothing;
