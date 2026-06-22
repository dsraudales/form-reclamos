CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'REVISOR', 'AUDITOR');
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'CLIENT_QUERY', 'PHOTO_VIEW', 'ROLE_CHANGE', 'USER_STATUS_CHANGE', 'USER_CREATED', 'SETTINGS_CHANGE', 'SUBMISSION_CREATED');

CREATE TABLE "clients" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "full_name" VARCHAR(180) NOT NULL,
  "client_code" VARCHAR(80) NOT NULL,
  "ip_hash" VARCHAR(128),
  "user_agent" VARCHAR(512),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "client_photos" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "client_id" UUID NOT NULL,
  "bucket" VARCHAR(100) NOT NULL,
  "object_key" VARCHAR(512) NOT NULL,
  "original_name" VARCHAR(255),
  "mime_type" VARCHAR(80) NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "sha256_hash" CHAR(64) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "client_photos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(254) NOT NULL,
  "name" VARCHAR(180),
  "password_hash" VARCHAR(255),
  "role" "AdminRole" NOT NULL DEFAULT 'REVISOR',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "entra_object_id" VARCHAR(128),
  "last_login_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "actor_id" UUID,
  "action" "AuditAction" NOT NULL,
  "target_id" VARCHAR(128),
  "ip_hash" VARCHAR(128),
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "app_settings" (
  "key" VARCHAR(80) NOT NULL,
  "value" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE UNIQUE INDEX "admin_users_entra_object_id_key" ON "admin_users"("entra_object_id");
CREATE INDEX "idx_clients_client_code" ON "clients"("client_code");
CREATE INDEX "idx_clients_full_name" ON "clients"("full_name");
CREATE INDEX "idx_clients_created_at" ON "clients"("created_at");
CREATE INDEX "idx_client_photos_client_id" ON "client_photos"("client_id");
CREATE INDEX "idx_client_photos_sha256_hash" ON "client_photos"("sha256_hash");
CREATE INDEX "idx_admin_users_email" ON "admin_users"("email");
CREATE INDEX "idx_admin_users_active" ON "admin_users"("active");
CREATE INDEX "idx_audit_logs_actor_id" ON "audit_logs"("actor_id");
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

ALTER TABLE "client_photos" ADD CONSTRAINT "client_photos_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "app_settings" ("key", "value") VALUES
  ('upload_limits', '{"maxFiles": 5, "maxFileSizeBytes": 5242880, "allowedMimeTypes": ["image/jpeg", "image/png", "image/webp"]}'::jsonb),
  ('signed_url_ttl_seconds', '300'::jsonb);
