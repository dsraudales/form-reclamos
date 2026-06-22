# Despliegue en Vercel + Supabase

Guía para publicar **Form_Reclamos** usando Vercel (app Next.js), Supabase
(Postgres + Storage) y Upstash (rate limiting). El antivirus ClamAV queda
desactivado porque no es viable en un entorno serverless.

---

## 0. Resumen de servicios

| Pieza | Servicio | Para qué |
|---|---|---|
| App Next.js | **Vercel** | Hosting + funciones serverless |
| Base de datos | **Supabase Postgres** | `clients`, `client_photos`, `admin_users`, `audit_logs`, etc. |
| Fotos | **Supabase Storage** | Bucket privado `cree-client-photos` con URLs firmadas |
| Rate limiting | **Upstash Redis** | Límite de envíos públicos y de intentos de login |
| Antivirus | — | Desactivado (`CLAMAV_ENABLED=false`) |

---

## 1. Supabase: base de datos

1. Crea un proyecto en https://supabase.com.
2. Ve a **Project Settings → Database → Connection string** y copia dos URLs:
   - **Pooler / Transaction (puerto 6543)** → será tu `DATABASE_URL`.
     Añádele al final: `?pgbouncer=true&connection_limit=1`
   - **Direct connection (puerto 5432)** → será tu `DIRECT_URL`.
3. Reemplaza `<password>` por la contraseña de la base que definiste al crear el proyecto.

> Por qué dos URLs: en serverless cada función abre conexiones nuevas; el *pooler*
> (PgBouncer) evita agotar el límite de Postgres. Prisma usa `DIRECT_URL` solo para
> aplicar migraciones (PgBouncer no soporta los comandos de migración).

### Aplicar el esquema (migraciones)

Desde tu máquina, con un `.env.local` que contenga `DATABASE_URL` y `DIRECT_URL`:

```bash
npm install
npx prisma migrate deploy     # crea las tablas en Supabase
```

### Crear el administrador inicial

Con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en tu `.env.local`:

```bash
npm run prisma:seed
```

Esto inserta un usuario `ADMIN` con contraseña hasheada (bcrypt) en `admin_users`.

---

## 2. Supabase: almacenamiento de fotos

1. En el panel de Supabase ve a **Storage** y crea un bucket llamado
   `cree-client-photos` marcado como **Private** (no público).
   - *Opcional:* el código también lo crea automáticamente la primera vez si no existe,
     pero crearlo a mano es más predecible.
2. Ve a **Project Settings → API** y copia:
   - **Project URL** → `SUPABASE_URL`
   - Clave **`service_role`** → `SUPABASE_SERVICE_ROLE_KEY`
     ⚠️ Es secreta y de solo backend. Nunca la expongas en el cliente.

Las fotos se sirven mediante **URLs firmadas temporales** (TTL configurable en
`app_settings`, por defecto 300s), nunca de forma pública.

---

## 3. Upstash: rate limiting

1. Crea una cuenta en https://upstash.com y una base **Redis** (el tier gratis basta).
2. En la pestaña **REST API** copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## 4. Vercel: importar y configurar

1. Sube el repositorio a GitHub/GitLab y en https://vercel.com haz
   **Add New → Project → Import**.
2. Framework: **Next.js** (autodetectado). No cambies el build command; el
   `package.json` ya ejecuta `prisma generate && next build`.
3. En **Settings → Environment Variables** agrega todas las claves de `.env.example`:

   | Variable | Valor |
   |---|---|
   | `NEXTAUTH_URL` | el dominio de Vercel, p. ej. `https://tu-proyecto.vercel.app` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `ENABLE_LOCAL_LOGIN` | `true` |
   | `NEXT_PUBLIC_ENABLE_LOCAL_LOGIN` | `true` |
   | `NEXT_PUBLIC_ENABLE_ENTRA_LOGIN` | `false` |
   | `DATABASE_URL` | pooler de Supabase (6543, con `?pgbouncer=true&connection_limit=1`) |
   | `DIRECT_URL` | conexión directa de Supabase (5432) |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | clave service_role |
   | `SUPABASE_STORAGE_BUCKET` | `cree-client-photos` |
   | `UPSTASH_REDIS_REST_URL` | de Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | de Upstash |
   | `PUBLIC_SUBMISSION_RATE_LIMIT` | `12` |
   | `LOCAL_LOGIN_RATE_LIMIT` | `10` |
   | `IP_HASH_SECRET` | `openssl rand -hex 32` |
   | `CLAMAV_ENABLED` | `false` |

4. Haz **Deploy**.

> `NEXTAUTH_URL`: si usas un dominio personalizado, actualízalo después al dominio final.

---

## 5. Verificación post-despliegue

- `https://tu-dominio/api/health` → `{ "ok": true }`
- `https://tu-dominio/formulario` → envía una solicitud con una foto de prueba.
- `https://tu-dominio/admin/login` → entra con el admin sembrado y abre una solicitud
  para confirmar que la foto se ve (URL firmada).

---

## Notas y limitaciones

- **ClamAV desactivado:** no se escanean los archivos subidos en busca de malware.
  La validación de tipo real (magic bytes con `file-type`), tamaño y MIME permitido
  sigue activa en `lib/security/upload.ts`. Si necesitas antivirus, integra un servicio
  externo (p. ej. una API de escaneo) dentro de `scanBufferWithClamAv`.
- **Hashing de contraseñas:** se usa `bcryptjs` (JavaScript puro, sin compilación
  nativa), por lo que funciona sin problemas en el entorno serverless de Vercel.
- **Migraciones:** Vercel **no** corre migraciones en cada deploy. Cuando cambies el
  esquema, ejecuta `npx prisma migrate deploy` tú mismo (usa `DIRECT_URL`).
- **Docker:** los archivos `Dockerfile`, `docker-compose.yml` y `nginx/` siguen sirviendo
  para auto-hospedaje y no afectan el despliegue en Vercel.
