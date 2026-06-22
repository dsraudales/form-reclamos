# CREE - Sistema de Reclamos

Aplicacion institucional con formulario publico sin login y panel administrativo protegido. El stack usa Next.js, TypeScript, Tailwind CSS, Prisma, PostgreSQL, MinIO/S3, Redis, ClamAV, Docker Compose y Nginx con HTTPS.

## Modulos

- `/formulario`: recepcion publica de nombre completo, numero/codigo de cliente y fotografias.
- `/admin`: panel protegido con roles `ADMIN`, `REVISOR` y `AUDITOR`.
- `/api/public/submissions`: validacion backend, rate limit, antibot honeypot, escaneo ClamAV, almacenamiento en MinIO y metadatos en PostgreSQL.
- `/api/admin/*`: APIs protegidas para clientes, fotos firmadas, usuarios y configuracion.

## Configuracion local requerida

Antes de correr Docker, cree manualmente estos recursos locales. No use valores reales en archivos versionados.

1. Crear `.env` desde `.env.example`:

```bash
cp .env.example .env
```

2. Crear la carpeta `secrets/` y estos archivos reales:

```text
secrets/database_url.txt
secrets/migration_database_url.txt
secrets/nextauth_secret.txt
secrets/ip_hash_secret.txt
secrets/postgres_password.txt
secrets/app_db_password.txt
secrets/migration_db_password.txt
secrets/minio_root_user.txt
secrets/minio_root_password.txt
secrets/minio_access_key.txt
secrets/minio_secret_key.txt
secrets/azure_ad_client_secret.txt
```

3. Crear certificados TLS:

```text
nginx/certs/fullchain.pem
nginx/certs/privkey.pem
docker/postgres/certs/server.crt
docker/postgres/certs/server.key
```

`docker compose config` no pasara hasta que existan `.env`, los archivos de `secrets/` y los certificados referenciados por los volumenes. Esto es esperado porque el repositorio no guarda credenciales ni certificados reales.

Use `secrets.example/README.md` como referencia de nombres y formatos. `secrets/` esta excluido por `.gitignore`.

## Configuracion

1. Copiar `.env.example` a `.env` y ajustar valores publicos/no sensibles.
2. Crear los archivos reales indicados en `secrets.example/README.md`.
3. Crear los certificados TLS indicados en la seccion anterior.
4. Levantar infraestructura:

```bash
docker compose up -d --build
```

5. Ejecutar migraciones con el usuario de migracion. `secrets/migration_database_url.txt` debe apuntar al usuario migrator con `sslmode=require`:

```bash
docker compose --profile tools run --rm migrate
```

6. Crear un administrador local solo si `ENABLE_LOCAL_LOGIN=true`:

```bash
docker compose run --rm app npm run prisma:seed
```

## Validaciones pendientes

Estas validaciones deben ejecutarse antes de marcar el proyecto como validado. Las validaciones npm ya fueron ejecutadas localmente; Docker queda pendiente hasta completar secrets y certificados reales.

```bash
npm config set registry https://registry.npmjs.org/
npm cache clean --force
npm install
npm run typecheck
npm run build
```

Luego crear `.env` y `secrets/` localmente y ejecutar:

```bash
docker compose config --quiet
docker compose up -d
```

`package-lock.json` no esta excluido por `.gitignore` y debe quedar versionado.

## Estado de validacion

- `npm install`: completado; genero `package-lock.json`.
- `npm run typecheck`: completado correctamente.
- `npm run build`: completado correctamente.
- `docker compose config --quiet`: pendiente hasta crear `.env` y archivos reales en `secrets/`.
- `docker compose up -d`: pendiente hasta completar configuracion local.
- Estado general: codigo preparado y validado a nivel npm/build; validacion Docker y funcional end-to-end pendiente.

## Microsoft Entra ID

Definir `AZURE_AD_CLIENT_ID`, `AZURE_AD_TENANT_ID` y el secret en `secrets/azure_ad_client_secret.txt`. El usuario debe existir previamente en `admin_users`, estar activo y tener rol asignado. Si Entra ID esta habilitado, mantenga `ENABLE_LOCAL_LOGIN=false`.

## PostgreSQL

- La aplicacion debe usar un usuario no superuser.
- Las migraciones deben ejecutarse con usuario separado.
- La conexion debe usar `sslmode=require`.
- No se debe colocar `DATABASE_URL` dentro del codigo ni de la imagen.
- `database_url.txt` debe usar el usuario de aplicacion.
- `migration_database_url.txt` debe usar el usuario de migraciones.

## MinIO / NAS Synology

MinIO se ejecuta como S3 compatible para almacenar objetos. Para Synology/NAS, monte el volumen de MinIO en una ruta respaldada por el NAS o configure el almacenamiento persistente del host hacia el NAS. El bucket es privado, tiene versioning habilitado y el panel solo accede mediante URL firmada temporal.

No exponga MinIO Console en internet. El servicio `minio-init` crea el bucket privado, activa versioning y crea un usuario de aplicacion con politica de minimo privilegio.

## Seguridad implementada

- Validacion frontend y backend con React Hook Form y Zod.
- Validacion de MIME real con `file-type`.
- Limite de cantidad y tamano de fotografias.
- Renombrado con UUID y hash SHA-256 por archivo.
- Escaneo con ClamAV antes de almacenar.
- Rate limiting por IP hasheada con HMAC.
- Honeypot antibot.
- Mensajes genericos al usuario.
- Headers de seguridad en Next.js y Nginx.
- `poweredByHeader=false` y source maps de produccion deshabilitados.
- Contenedores con redes internas y exposicion publica solo por Nginx.
- App sin root, `read_only`, `no-new-privileges` y capacidades removidas.

## Checklist Antes De Produccion

- Reemplazar certificados temporales por certificados validos.
- Confirmar que MinIO Console no esta expuesta a internet.
- Rotar todos los secrets iniciales.
- Confirmar `ENABLE_LOCAL_LOGIN=false` si Microsoft Entra ID esta operativo.
- Revisar politicas de MinIO con minimo privilegio.
- Validar backups y restauracion de PostgreSQL y MinIO/NAS.
- Activar monitoreo de logs, alertas y retencion de auditoria.
- Ejecutar pruebas OWASP ZAP o equivalente contra staging.
- Verificar CSP con la URL final y proveedores reales.
- Revisar limites de carga en `/admin/settings`.
- Confirmar que `DATABASE_URL` usa usuario app, no superuser.
- Confirmar migraciones con usuario migrator separado.
- Restringir acceso administrativo por red/VPN si aplica.
- Configurar renovacion automatica de certificados.

## Estado actual del proyecto

La revision estatica fue completada. El codigo esta preparado con estructura inicial de formulario publico, panel administrador, Prisma, PostgreSQL, MinIO, auditoria, roles, Docker Compose y middleware/headers de seguridad.

Falta validacion en ejecucion. El proyecto no debe marcarse como finalizado ni validado hasta que los comandos pendientes se ejecuten correctamente.

Comandos pendientes:

```bash
npm install
npm run typecheck
npm run build
docker compose config --quiet
docker compose up -d
```

## Proximo paso para validacion local

Antes de correr Docker se debe crear localmente:

```text
.env
secrets/postgres_password.txt
secrets/minio_root_user.txt
secrets/minio_root_password.txt
```

Tambien se deben crear los demas archivos indicados en `secrets.example/README.md`, sin guardar credenciales reales en el repositorio.

Checklist de validacion funcional:

- Abrir formulario publico.
- Enviar registro con fotos validas.
- Rechazar archivo no permitido.
- Rechazar archivo demasiado grande.
- Confirmar guardado en MinIO.
- Confirmar metadatos en PostgreSQL.
- Iniciar sesion en panel admin.
- Consultar cliente.
- Ver fotografia mediante URL firmada temporal.
- Confirmar auditoria de consulta.
- Confirmar que no se muestran errores tecnicos en navegador.
