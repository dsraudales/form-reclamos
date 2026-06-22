import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/env";

const globalForSupabase = globalThis as unknown as { supabaseAdmin?: SupabaseClient };

function getClient(): SupabaseClient {
  if (!globalForSupabase.supabaseAdmin) {
    const { url, serviceRoleKey } = getSupabaseConfig();
    globalForSupabase.supabaseAdmin = createClient(url, serviceRoleKey, {
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

  const { bucket } = getSupabaseConfig();
  const storage = getClient().storage;
  const { data } = await storage.getBucket(bucket);
  if (!data) {
    const { error } = await storage.createBucket(bucket, { public: false });
    if (error && !/already exists/i.test(error.message)) {
      throw error;
    }
  }

  bucketEnsured = true;
}

export async function uploadPhotoObject(objectKey: string, buffer: Buffer, mimeType: string) {
  const { bucket } = getSupabaseConfig();
  const { error } = await getClient()
    .storage.from(bucket)
    .upload(objectKey, buffer, { contentType: mimeType, upsert: false });

  if (error) {
    throw error;
  }
}

export async function getSignedPhotoUrl(objectKey: string, ttlSeconds: number) {
  const { bucket } = getSupabaseConfig();
  const { data, error } = await getClient()
    .storage.from(bucket)
    .createSignedUrl(objectKey, ttlSeconds);

  if (error || !data) {
    throw error ?? new Error("signed_url_failed");
  }

  return data.signedUrl;
}
