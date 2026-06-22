# Secrets example

Create a local `secrets/` directory with the files below before running Docker.
Do not commit `secrets/` or real secret values.

Required files:

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

Use strong random values for every password, key, and application secret.
The two database URL files must include the matching password and `sslmode=require`.

Example formats only:

```text
database_url.txt
postgresql://cree_app:<app_db_password>@postgres:5432/cree_reclamos?schema=public&sslmode=require

migration_database_url.txt
postgresql://cree_migrator:<migration_db_password>@postgres:5432/cree_reclamos?schema=public&sslmode=require
```
