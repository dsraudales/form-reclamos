import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const globalForSupabase = globalThis as unknown as { supabaseAdmin?: SupabaseClient };

function getClient() {
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

export async function uploadPhotoObject(objectKey: string, buffer: Buffer, mimeType: string) {
  const { error } = await getClient().storage
    .from(env.supabase.bucket)
    .upload(objectKey, buffer, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }
}

export async function getSignedPhotoUrl(objectKey: string, ttlSeconds: number) {
  const { data, error } = await getClient().storage
    .from(env.supabase.bucket)
    .createSignedUrl(objectKey, ttlSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${error?.message ?? "unknown"}`);
  }

  return data.signedUrl;
}
