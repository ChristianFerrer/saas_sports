# AI Sports

SaaS para escuelas deportivas. Next.js 14 (App Router) + Supabase (Postgres + Auth) + next-intl (ES/EN) + Tailwind.

## Requisitos

- Node.js >= 18.17 (recomendado 20.x)
- pnpm 9.x
- Un proyecto de Supabase con acceso a SQL Editor y a las claves de servicio

## Instalación

```bash
pnpm install
cp .env.example .env.local
```

Rellena `.env.local` con las claves del proyecto de Supabase:

| Variable | Dónde obtenerla |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (solo server) |
| `NEXT_PUBLIC_APP_URL` | URL de la app (ej. `http://localhost:3000`) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Opcional por ahora (pendiente para Fase 2) |

> La clave `service_role` tiene permisos totales y salta RLS. No la expongas al cliente ni la subas al repo.

## Base de datos

Ejecuta las migraciones en orden desde Supabase → SQL Editor:

1. `supabase/migrations/0001_initial_schema.sql` — tablas, enums, triggers de `updated_at`.
2. `supabase/migrations/0002_rls_policies.sql` — políticas RLS por rol y helpers (`current_user_role`, `current_user_school_id`).

Alternativa con CLI:

```bash
supabase db push
```

## Bootstrap del primer admin

La app requiere que exista una fila en `public.profiles` con rol `admin` para poder entrar en `/admin`. Usa el script incluido (idempotente):

```bash
ADMIN_EMAIL="admin@example.com" \
ADMIN_FULL_NAME="Nombre Apellido" \
SCHOOL_NAME="Little Kickers Barcelona" \
SCHOOL_TIMEZONE="Europe/Madrid" \
pnpm bootstrap:admin
```

El script:

1. Lee credenciales desde `.env.local` (vía `dotenv`).
2. Crea el usuario en `auth.users` si no existe (email ya confirmado).
3. Crea la escuela si no existe (busca por nombre exacto).
4. Hace `upsert` del profile con rol `admin`.
5. Genera un magic link listo para abrir en `/auth/callback`.

Variables obligatorias: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `SCHOOL_NAME`. Las demás tienen valores por defecto (`ADMIN_FULL_NAME=Admin`, `SCHOOL_TIMEZONE=UTC`).

Los coaches y padres se crean después vía el flujo de invitaciones dentro de la app (Fase 2).

## Desarrollo

```bash
pnpm dev          # servidor en http://localhost:3000
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm build        # build de producción
```

## Estructura

```
app/
  (admin)/        Rutas protegidas con requireRole('admin')
  (coach)/        Rutas protegidas con requireRole('coach')
  (parent)/       Rutas protegidas con requireRole('parent')
  (auth)/login/   Login passwordless (OTP por email)
  auth/callback/  Intercambia el code por sesión
  page.tsx        Redirige a /login o al home según rol

lib/
  auth/           Guards de servidor (requireAuth, requireRole) y helpers de perfil
  supabase/       Clientes: server (SSR), client (browser), middleware, service (service_role)

supabase/
  migrations/     Schema y RLS
  seed.sql        Plantilla manual alternativa al script de bootstrap

messages/         Traducciones es.json y en.json
types/database.ts Tipado manual del schema (sincronizado con migración 0001)
middleware.ts     Refresco de sesión SSR en cada request
```

## Login y errores

El flujo raíz (`app/page.tsx`) y el callback redirigen a `/login?error=<code>` cuando algo falla. Códigos soportados:

- `no_profile` — autenticado pero sin fila en `profiles` (falta bootstrap o invitación).
- `auth_callback_failed` — el link del email caducó o es inválido.

Cualquier otro valor cae en el mensaje genérico. Los textos están en `messages/{es,en}.json` bajo `login.errors`.

## Estado del proyecto

- **Fase 1 (completada):** schema + RLS, auth SSR, guards por rol, layouts admin/coach/parent, i18n, bootstrap del primer admin, errores visibles en login.
- **Fase 2 (pendiente):** CRUD de groups/students, captura de asistencias, sistema de invitaciones, módulo de comunicaciones, seeds de prueba, tests.
