import { createClient } from '@supabase/supabase-js';
import { setServiceDown } from '@/store/serviceStatus';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY;
const TIMEOUT_MS = 15_000;
const REACHABILITY_URL = 'https://clients3.google.com/generate_204';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY');
}

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Request timed out')), TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function internetReachable(): Promise<boolean> {
  try {
    await withTimeout(fetch(REACHABILITY_URL, { method: 'HEAD' }));
    return true;
  } catch {
    return false;
  }
}

const trackedFetch: typeof fetch = async (input, init) => {
  try {
    const response = await withTimeout(fetch(input, init));
    setServiceDown(response.status >= 500);
    return response;
  } catch (error) {
    if ((error as Error).name !== 'AbortError' && (await internetReachable())) {
      setServiceDown(true);
    }
    throw error;
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: { fetch: trackedFetch },
});
