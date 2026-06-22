function required(name: string) {
  const filePath = process.env[`${name}_FILE`];
  const value = filePath ? readSecretFile(filePath) : process.env[name];
  if (!value) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return `build-time-${name.toLowerCase()}`;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string) {
  const filePath = process.env[`${name}_FILE`];
  return filePath ? readSecretFile(filePath) : process.env[name];
}

function readSecretFile(filePath: string) {
  const fs = require("node:fs") as typeof import("node:fs");
  return fs.readFileSync(filePath, "utf8").trim();
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  nextAuthSecret: required("NEXTAUTH_SECRET"),
  localLoginEnabled: process.env.ENABLE_LOCAL_LOGIN === "true",
  localLoginRateLimit: Number(process.env.LOCAL_LOGIN_RATE_LIMIT ?? "10"),
  publicRateLimit: Number(process.env.PUBLIC_SUBMISSION_RATE_LIMIT ?? "12"),
  ipHashSecret: required("IP_HASH_SECRET"),
  upstash: {
    url: required("UPSTASH_REDIS_REST_URL"),
    token: required("UPSTASH_REDIS_REST_TOKEN")
  },
  supabase: {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "cree-client-photos"
  },
  clamav: {
    host: process.env.CLAMAV_HOST ?? "clamav",
    port: Number(process.env.CLAMAV_PORT ?? "3310"),
    enabled: process.env.CLAMAV_ENABLED !== "false"
  },
  microsoft: {
    clientId: optional("AZURE_AD_CLIENT_ID"),
    clientSecret: optional("AZURE_AD_CLIENT_SECRET"),
    tenantId: optional("AZURE_AD_TENANT_ID")
  }
};
