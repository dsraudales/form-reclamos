function required(name: string) {
  const value = process.env[name];
  if (!value) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return `build-time-${name.toLowerCase()}`;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabase: {
    url: required("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    bucket: process.env.SUPABASE_STORAGE_BUCKET ?? "cree-client-photos"
  }
};
