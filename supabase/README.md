# Base de datos (Supabase)

Cómo levantar una base de datos nueva para un despliegue (v2, v3, ...) desde cero.
Cada despliegue usa su **propio proyecto de Supabase** → aislamiento total de datos.

## 1. Migraciones (SQL Editor)

Corre los archivos de `migrations/` **en orden de timestamp**:

1. `20260101000000_schema_inicial.sql` → tablas `cursos` y `participantes`.
2. `20260603000000_add_admins_table.sql` → tabla `admins` + RLS de autorización.
   - ⚠️ Antes de correrla, cambia el UUID de la fila inicial por el del usuario
     admin de **este** proyecto (ver paso 3).

## 2. Storage: bucket `plantillas`

Las plantillas de constancias (imágenes) se guardan en un bucket llamado
exactamente **`plantillas`**. El admin las sube desde el panel con su sesión
(anon key), y las páginas públicas las leen por URL pública.

Pasos en el dashboard → **Storage**:

1. **New bucket** → nombre `plantillas` → marca **Public bucket**.
2. En **Policies** del bucket, agrega una política que permita **subir**
   (INSERT) a usuarios autenticados. Equivalente en SQL:

   ```sql
   -- Lectura pública (el bucket público ya la cubre; explícita por claridad)
   create policy "plantillas lectura publica"
     on storage.objects for select
     using ( bucket_id = 'plantillas' );

   -- Subida por usuarios autenticados (admins logueados)
   create policy "plantillas subida autenticada"
     on storage.objects for insert
     to authenticated
     with check ( bucket_id = 'plantillas' );
   ```

   > Verifica contra la v1 (Storage → `plantillas` → Policies) si quieres
   > reproducir exactamente sus políticas.

## 3. Usuario administrador

1. **Authentication → Users → Add user** con el correo que administrará este
   despliegue. Copia su **User UID**.
2. Inserta ese UID en `admins` (o edítalo en la migración del paso 1.2):

   ```sql
   insert into public.admins (id, email)
   values ('<UID-del-admin>', 'correo-admin@ejemplo.com')
   on conflict (id) do nothing;
   ```

## 4. Variables de entorno

En el proyecto de Vercel correspondiente, configura las claves de **este**
proyecto Supabase (`Settings → API`): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Ver `.env.example`
en la raíz para el resto de variables (logo, marca, etc.).

## Nota sobre RLS

`cursos` y `participantes` no usan RLS (el panel admin escribe con la sesión del
usuario y las rutas públicas usan service_role). Es el comportamiento de la v1.
Endurecer esto (RLS + políticas que validen contra `admins`) es una mejora de
seguridad pendiente, aplicable a todos los despliegues por igual.
