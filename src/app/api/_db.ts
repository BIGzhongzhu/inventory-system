import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton: only creates the client when first accessed at request time,
// not at module import/build time. This prevents build failures when
// COZE_SUPABASE_URL is not available during `next build`.
let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient {
  if (!_client) {
    _client = getSupabaseClient();
  }
  return _client;
}
