# Despliegue en Vercel + Supabase

Guia para publicar **Form_Reclamos** usando Vercel para la app Next.js y Supabase
para Postgres y Storage. Upstash queda como una mejora opcional para rate limiting.
ClamAV se mantiene desactivado porque no es viable en funciones serverless de Vercel.

---

## 0. Resumen de servicios

| Pieza | Servicio | Uso |
|---|---|---|
| App Next.js | Vercel | Hosting + funciones serverless |
| Base de datos | Supabase Postgres | `clients`, `client_photos`, `admin_users`, `audit_logs`, etc. |
| Fotos | Supabase Storage | Bucket privado `cree-client-photos` con URLs firmadas |
| Rate limiting | Upstash Redis (opcional) | Limite compartido entre instancias |
| Antivirus | -- | Desactivado (`CLAMAV_ENABLED=false`) |

---

## 1. Supabase: base de datos

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve a **Project Settings -> Database -> Connection string** y copia dos URLs:
   - **Pooler / Transaction (6543)** -> sera tu `DATABASE_URL`.
     Agregale `?pgbouncer=true&connection_limit=1`.
   - **Direct connection (5432)** -> sera tu `DIRECT_URL`.
3. Reemplaza `<password>` por la contrasena real de tu base.

`DATABASE_URL` se usa en runtime para el app serverless. `DIRECT_URL` se usa solo
para migraciones de Prisma.

### Aplicar migraciones

Con `DATABASE_URL` y `DIRECT_URL` definidos localmente:

```bash
npm install
npx prisma migrate deploy
```

### Crear el admin inicial

Con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` en tu `.env.local`:

```bash
npm run prisma:seed
```

Eso crea un usuario `ADMIN` en `admin_users`.

---

## 2. Supabase: Storage

1. En **Storage** crea un bucket llamado `cree-client-photos` como **Private**.
2. En **Project Settings -> API** copia:
   - **Project URL** -> `SUPABASE_URL`
   - **service_role** -> `SUPABASE_SERVICE_ROLE_KEY`

La app genera URLs firmadas temporales para ver las fotos. No las expone como publicas.

---

## 3. Upstash: rate limiting opcional

1. Crea una base Redis en [Upstash](https://upstash.com).
2. Copia:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

Si no configuras Upstash, la app igual funciona con un fallback en memoria para
las rutas de login y envio publico. Ese fallback sirve para pruebas y para no bloquear
el despliegue, pero en Vercel no se comparte entre instancias, asi que Upstash sigue
siendo lo recomendable para produccion.

---

## 4. Vercel: importar y configurar

1. Sube el repo a GitHub o GitLab.
2. En [Vercel](https://vercel.com) haz **Add New -> Project -> Import**.
3. Framework: **Next.js**. Deja el build command por defecto; `package.json` ya usa
   `prisma generate && next build`.
4. En **Settings -> Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `NEXTAUTH_URL` | tu dominio final de Vercel |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ENABLE_LOCAL_LOGIN` | `true` si usaras login local |
| `DATABASE_URL` | pooler de Supabase en 6543 con `?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | conexion directa de Supabase en 5432 |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | clave `service_role` |
| `SUPABASE_STORAGE_BUCKET` | `cree-client-photos` |
| `UPSTASH_REDIS_REST_URL` | opcional |
| `UPSTASH_REDIS_REST_TOKEN` | opcional |
| `PUBLIC_SUBMISSION_RATE_LIMIT` | `12` |
| `LOCAL_LOGIN_RATE_LIMIT` | `10` |
| `IP_HASH_SECRET` | opcional; si falta se reutiliza `NEXTAUTH_SECRET` |
| `CLAMAV_ENABLED` | `false` |

5. Haz **Deploy**.

---

## 5. Verificacion post-despliegue

- `https://tu-dominio/api/health` debe responder `{ "ok": true }`
- `https://tu-dominio/formulario` debe permitir enviar una foto valida
- `https://tu-dominio/admin/login` debe mostrar el metodo de login habilitado
- Desde `/admin`, abre un registro y valida que la foto firme correctamente

---

## 6. Si algo falla

- Revisa los logs de Vercel: ahora las rutas de envio publico y fotos dejan trazas
  en servidor para que el error real no quede oculto.
- Si el login no aparece, confirma `ENABLE_LOCAL_LOGIN=true` o las variables de Entra.
- Si el login responde error, confirma `NEXTAUTH_SECRET` y que exista un admin sembrado.
- Si subir fotos falla, confirma `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y el bucket.
- Si Prisma no conecta en Vercel, revisa que `DATABASE_URL` use el pooler de 6543.

---

## Notas

- Vercel no corre migraciones automaticamente en cada deploy.
- `bcryptjs` funciona bien en serverless.
- Los archivos Docker siguen siendo utiles para auto-hosting, pero no son necesarios
  para este flujo con Vercel + Supabase.
