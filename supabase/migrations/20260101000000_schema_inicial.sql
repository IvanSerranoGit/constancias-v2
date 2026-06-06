-- Migración: esquema inicial (cursos y participantes)
-- Reproduce el esquema base de la app para poder levantar una base nueva
-- (v2, v3, ...) desde cero. La tabla `admins` vive en su propia migración
-- (20260603000000_add_admins_table.sql), que corre después de esta.
--
-- NOTA sobre RLS: estas tablas NO tienen Row Level Security, igual que en la
-- v1. La app accede a ellas de dos formas:
--   - Páginas públicas y API routes → service_role (omite RLS).
--   - Panel /admin → anon key con la sesión del administrador, que escribe
--     directo a estas tablas (crear/editar cursos, borrar participantes).
-- Activar RLS sin políticas rompería el panel de administración, por eso se
-- deja desactivado para reproducir el comportamiento de la v1.

-- Tabla de cursos / webinarios
create table if not exists public.cursos (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null,
  slug              text not null unique,
  fecha             date not null,
  plantilla_url     text,
  nombre_posicion_y integer default 55,
  nombre_color      text default '#1a1a2e',
  nombre_font_size  integer default 48,
  registro_activo   boolean default false,
  constancia_activa boolean default true,
  created_at        timestamptz default now()
);

-- Tabla de participantes / asistentes
create table if not exists public.participantes (
  id            uuid primary key default gen_random_uuid(),
  curso_id      uuid references public.cursos (id),
  nombre        text not null,
  email         text,
  folio         text not null unique,
  hoja          text,
  libro         text,
  folio_oficial text,
  created_at    timestamptz default now()
);
