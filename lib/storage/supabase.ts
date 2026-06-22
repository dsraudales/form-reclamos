import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

const globalForSupabase = globalThis as unknown as { supabaseAdmin?: SupabaseClient };

function getClient(): SupabaseClient {
  if (!globalForSupabase.supabaseAdmin) {
    globalForSupabase.supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return globalForSupabase.supabaseAdmin;
}

let bucketEnsured = false;

export async function ensurePhotoBucket() {
  if (bucketEnsured) {
    return;
  }

  const storage = getClient().storage;
  const { data } = await storage.getBucket(env.supabase.bucket);
  if (!data) {
    const { error } = await storage.createBucket(env.supabase.bucket, { public: false });
    if (error && !/already exists/i.test(error.message)) {
      throw error;
    }
  }

  bucketEnsured = true;
}

export async function uploadPhotoObject(objectKey: string, buffer: Buffer, mimeType: string) {
  const { error } = await getClient()
    .storage.from(env.supabase.bucket)
    .upload(objectKey, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw error;
  }
}

export async function getSignedPhotoUrl(objectKey: string, ttlSeconds: number) {
  const { data, error } = await getClient()
    .storage.from(env.supabase.bucket)
    .createSignedUrl(objectKey, ttlSeconds);

  if (error || !data) {
    throw error ?? new Error("signed_url_failed");
  }

  return data.signedUrl;
}
