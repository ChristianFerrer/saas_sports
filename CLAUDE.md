# CLAUDE.md — Contexto de continuidad de sesión

> Este archivo se carga automáticamente al inicio de cada sesión de Claude Code.
> Sirve para retomar el trabajo si la sesión previa se interrumpió.
> **Rama de trabajo actual:** `claude/review-pending-tasks-020Ep`

---

## 1. Qué es el proyecto

**SmartSpots** — SaaS multi-tenant para escuelas deportivas.
Cada escuela tiene admins, coaches y padres. Gestiona grupos, alumnos, asistencias, comunicaciones e invitaciones.

### Stack
- **Next.js 14** (App Router, Server Actions, SSR)
- **Supabase** (Postgres + Auth + RLS)
- **next-intl** (i18n ES/EN, ES por defecto)
- **Tailwind CSS**
- **pnpm 9** · Node >= 18.17
- Sin tests configurados aún. Sin ORM (queries directas vía `@supabase/supabase-js`).

### Comandos clave
```bash
pnpm dev          # http://localhost:3000
pnpm lint         # ESLint (eslint-config-next)
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (unit tests de lógica pura)
pnpm test:watch   # Vitest en modo watch
pnpm build        # build de producción
pnpm bootstrap:admin   # crea primer admin (ver README)
pnpm seed:dev          # datos dummy para desarrollo (admin/coach/parent + grupos + asistencias)
```

---

## 2. Estructura del repo (importante)

```
app/
  (admin)/admin/{groups,students}/   CRUD completo con Server Actions
  (coach)/coach/                     layout + page (sin features aún)
  (parent)/parent/                   layout + page (sin features aún)
  (auth)/{login,signup,forgot,reset}/
  auth/callback/route.ts             intercambia OAuth code → sesión

lib/
  auth/guards.ts        requireAuth(), requireRole('admin'|'coach'|'parent')
  auth/profile.ts       fetchProfile(), helpers de perfil
  auth/errors.ts        códigos: no_profile, auth_callback_failed, oauth_failed
  supabase/server.ts    createClient() + createUntypedClient() (ver §5)
  supabase/client.ts    cliente browser
  supabase/middleware.ts refresco de sesión SSR
  supabase/service.ts   service_role (solo server, nunca cliente)

components/
  admin/{admin-nav, group-form, student-form, delete-*-button}.tsx
  auth/{auth-card, google-button}.tsx
  ui/{app-shell, sign-out-button}.tsx

supabase/
  migrations/0001_initial_schema.sql   tablas + enums + triggers
  migrations/0002_rls_policies.sql     RLS por rol + helpers SQL
  migrations/0003_fix_rls_recursion.sql  arregla recursión RLS vía SECURITY DEFINER helpers
  migrations/0004_training_cycles_and_objectives.sql  ciclos en groups + tablas objectives/student_objectives
  seed.sql                              alternativa manual al script
  verify_rls.sql                        checks de RLS

scripts/bootstrap-admin.ts   crea primer admin vía service_role
messages/{es,en}.json        traducciones
types/database.ts            tipado manual (sincronizado con 0001)
middleware.ts                refresca sesión en cada request
i18n.ts                      config next-intl
```

### Tablas existentes
Migración 0001: `schools`, `profiles`, `groups`, `students`, `student_parents`, `class_sessions`, `attendances`, `communications`, `communication_recipients`, `invitations`.

Migración 0004: `objectives` (hitos por grupo — "chutar el balón", "regate", etc.), `student_objectives` (logros m-n student↔objective con `achieved_at`, `notes`, `marked_by`). Además `groups` gana `start_date` y `end_date` para el ciclo de entrenamiento.

Enums: `user_role` (`admin|coach|parent`), `session_status` (`scheduled|held|cancelled`).

**Nota:** Las tablas de asistencias, comunicaciones e invitaciones **ya existen en el schema** — falta solo la UI/acciones.

---

## 3. Estado del trabajo

### ✅ Fase 1 — COMPLETADA
- [x] Schema BD + RLS (migraciones 0001 y 0002)
- [x] Auth SSR Supabase (email+pass, Google OAuth, forgot/reset)
- [x] Guards por rol (`requireAuth`, `requireRole`)
- [x] Layouts admin/coach/parent
- [x] i18n ES/EN
- [x] Script `pnpm bootstrap:admin`
- [x] Registro self-serve `/signup` (crea escuela + admin)
- [x] Códigos de error en login

### ✅ Fase 2 — COMPLETADA
- [x] **CRUD Groups** — list/create/edit/delete con Server Actions. Edit permite nombre, coach asignado y horario semanal.
- [x] **CRUD Students** — list/create/edit/delete con `birth_date` y grupo opcional.
- [x] **Admin Dashboard** — contadores live de grupos/alumnos + quick actions.
- [x] **Captura de asistencias** — admin/coach crean/abren sesiones, registran presente/ausente + notas; parent ve historial por hijo con % de asistencia.
- [x] **Sistema de invitaciones** — admin invita coach/parent, link copiable; Resend opcional (si no está configurado, se omite silenciosamente); `/invite/[token]` pública crea user + profile + student_parents y hace sign-in.
- [x] **Módulo de comunicaciones** — admin manda a escuela completa o a padres de un grupo; parent ve inbox con unread + detalle que marca `read_at`.
- [x] **Editor de schedule de grupos** — editor de franjas semanales (día/inicio/duración) en edit de grupo.
- [x] **Seeds de prueba** — `pnpm seed:dev` crea escuela demo + 6 usuarios + 3 grupos + 15 alumnos + 15 sesiones con asistencia.
- [x] **Tests** — Vitest con 15 unit tests sobre lógica pura (`parseSchedule`, `generateInvitationToken`). CI en `.github/workflows/ci.yml` corre lint + typecheck + test en cada push/PR.

### 🔜 Fuera de Fase 2 (Fase 3 / nice-to-have)
- Auto-generar `class_sessions` desde `groups.schedule` (job periódico).
- Vista coach con estadísticas de asistencia por alumno.
- Smoke tests e2e con Playwright (requiere entorno de ejecución).
- Email a padres al publicar comunicaciones (hook Resend en `sendCommunication`).
- Editor rico / adjuntos / respuestas en comunicaciones.
- Manejo correcto de timezones (ver §5 gotcha #6).

---

## 4. Convenciones de código

- **Server Actions + `useFormState`** para forms (no API routes). Ver `app/(admin)/admin/groups/actions.ts` como referencia.
- **Borrado:** `useTransition` + `window.confirm` en el client component. Ver `delete-group-button.tsx`.
- **Validación:** inline en Server Action, retornando `{ error?: string }`.
- **i18n:** toda string visible va a `messages/{es,en}.json`. Namespaces existentes: `auth`, `auth.errors`, `admin.nav`, `admin.groups`, `admin.students`, `common`.
- **Guards:** toda página admin empieza con `await requireRole('admin')`.
- **RLS:** confiar en RLS, pero filtrar explícitamente por `school_id` en queries igualmente (defensa en profundidad).
- **Comentarios:** mínimos. Código autoexplicativo por naming.

---

## 5. Gotchas / deuda técnica conocida

1. **`createUntypedClient()` en `lib/supabase/server.ts`** — workaround porque `@supabase/ssr` + `supabase-js` actuales colapsan el tipo `Database` a `never`. Runtime idéntico. **No borrar sin revisar tipos.**
2. **`types/database.ts` es manual** — sincronizar a mano si cambian migraciones. No hay codegen.
3. **Resend sin configurar** — `RESEND_API_KEY` / `RESEND_FROM_EMAIL` en `.env.example` pero no se usa todavía. Necesario para invitaciones.
4. **`supabase.auth.getUser()` en middleware** — crítico para refresco SSR, no reemplazar por `getSession()`.
5. **Google OAuth** requiere config manual en Supabase Dashboard (ver README §Autenticación).
6. **RLS recursion** — las policies originales de 0002 se referenciaban en círculo entre `groups`/`students`/`class_sessions`/`attendances`. La migración 0003 las reescribe con helpers `SECURITY DEFINER`. Si añades policies nuevas con `EXISTS` sobre otras tablas, envuélvelas en un helper igual para evitar el error `infinite recursion detected in policy for relation`.
7. **Timezones en `class_sessions.scheduled_at`** — actualmente se guarda el wall-clock introducido por el admin como si fuera UTC (sufijo `Z`), y la lectura lo muestra con `timeZone:'UTC'` para que round-trippee igual. No respeta `schools.timezone` (p.ej. un admin en Madrid verá "10:00" tras introducir "10:00", pero el instant UTC almacenado es 10:00 UTC, no 10:00 CET). Arreglar cuando haga falta calendario real / recordatorios.
8. **Relaciones PostgREST + untyped client** — queries con `.select('a, b, table_rel (c, d)')` devuelven objeto único para FKs many-to-one, pero la inferencia del untyped client asume array. Se usa `as unknown as Row[]` en los consumers (ver `app/(parent)/parent/page.tsx`, `messages/page.tsx`, `app/(admin)/admin/communications/actions.ts`). Runtime correcto.

---

## 6. Cómo retomar una sesión nueva

1. Leer este archivo (Claude Code lo carga solo).
2. `git status` + `git log --oneline -10` para ver estado.
3. Preguntar al usuario por cuál tarea pendiente de §3 quiere continuar, o revisar mensajes previos si quedó contexto.
4. Si hay trabajo en progreso sin commitear, inspeccionar el diff antes de tocar nada (puede ser trabajo del usuario).
5. Commits en español, estilo convencional: `feat(phase-2): ...`, `fix(auth): ...`, `chore: ...`.
6. Trabajar siempre en la rama indicada arriba. No push a main/master.

---

## 7. Variables de entorno (`.env.local`)

Obligatorias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server)
- `NEXT_PUBLIC_APP_URL`

Pendientes (Fase 2):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

---

_Última actualización de este archivo: 2026-04-24 — tras completar Fase 2 (asistencias, invitaciones, comunicaciones, schedule editor, seeds, tests + CI)._
_Actualizar esta fecha y la sección §3 al cerrar cada milestone._
