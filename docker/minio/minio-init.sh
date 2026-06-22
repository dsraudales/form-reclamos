#!/bin/sh
set -eu

ROOT_USER="$(cat "$MINIO_ROOT_USER_FILE")"
ROOT_PASSWORD="$(cat "$MINIO_ROOT_PASSWORD_FILE")"
APP_ACCESS_KEY="$(cat "$MINIO_ACCESS_KEY_FILE")"
APP_SECRET="$(cat "$MINIO_SECRET_KEY_FILE")"
mc alias set local http://minio:9000 "$ROOT_USER" "$ROOT_PASSWORD"
mc mb --ignore-existing "local/$MINIO_BUCKET"
mc anonymous set none "local/$MINIO_BUCKET"
mc version enable "local/$MINIO_BUCKET"
sed "s/{{BUCKET}}/$MINIO_BUCKET/g" /scripts/app-policy.json >/tmp/app-policy.json
mc admin user add local "$APP_ACCESS_KEY" "$APP_SECRET" || true
mc admin policy create local cree-app-policy /tmp/app-policy.json || true
mc admin policy attach local cree-app-policy --user "$APP_ACCESS_KEY"
