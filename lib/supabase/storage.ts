import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const globalForSupabase = globalThis as unknown as { supabaseAdmin?: SupabaseClient };

function getAdminClient() {
  if (globalForSupabase.supabaseAdmin) {
    return globalForSupabase.supabaseAdmin;
  }

  const client = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false }
  });

  if (process.env.NODE_ENV !== "production") {
    globalForSupabase.supabaseAdmin = client;
  }

  return client;
}

export async function createSignedUploadUrl(objectKey: string) {
  const { data, error } = await getAdminClient().storage
    .from(env.supabase.bucket)
    .createSignedUploadUrl(objectKey);

  if (error || !data) {
    throw new Error(`Signed upload URL failed: ${error?.message ?? "unknown"}`);
  }

  return { signedUrl: data.signedUrl, token: data.token, path: data.path };
}

export async function getSignedPhotoUrl(objectKey: string, ttlSeconds: number) {
  const { data, error } = await getAdminClient().storage
    .from(env.supabase.bucket)
    .createSignedUrl(objectKey, ttlSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message ?? "unknown"}`);
  }

  return data.signedUrl;
}
