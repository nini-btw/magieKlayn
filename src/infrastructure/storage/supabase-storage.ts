/**
 * Supabase Storage adapter for image uploads
 * @module infrastructure/storage/supabase-storage
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface IStorageService {
  upload(file: File | Buffer, filename: string, mimeType: string): Promise<string>;
  delete(url: string): Promise<void>;
}

class SupabaseStorageService implements IStorageService {
  private bucket = "crumbleivable";
  private folder = "products";

  async upload(file: File | Buffer, filename: string, mimeType: string): Promise<string> {
    const sanitized = filename.replace(/[^a-zA-Z0-9.]/g, "-").replace(/-+/g, "-");
    const ext = sanitized.split(".").pop() || "bin";
    const name = sanitized.substring(0, sanitized.lastIndexOf(".")) || "file";
    const path = `${this.folder}/${Date.now()}-${name}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(this.bucket)
      .upload(path, file, { contentType: mimeType, upsert: false });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data } = supabaseAdmin.storage.from(this.bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async delete(url: string): Promise<void> {
    const marker = `/object/public/${this.bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;

    const path = url.substring(idx + marker.length);
    try {
      await supabaseAdmin.storage.from(this.bucket).remove([path]);
    } catch {
      // Non-fatal
    }
  }
}

export const storageService = new SupabaseStorageService();
