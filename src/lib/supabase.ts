import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'concertpass_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Retrieve active Supabase configuration from environment or localStorage
 */
export function getStoredSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return { url: parsed.url, anonKey: parsed.anonKey };
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

/**
 * Get or initialize the Supabase client
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();

  if (!url || !anonKey || url.includes('your-project.supabase.co')) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Check if valid Supabase configuration is present
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 20 &&
    !url.includes('your-project.supabase.co')
  );
}

/**
 * Save new Supabase credentials to localStorage and recreate client
 */
export function saveSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() }));
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

/**
 * Remove custom Supabase credentials from localStorage
 */
export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  cachedClient = null;
  lastUsedUrl = '';
  lastUsedKey = '';
}

/**
 * Test connectivity to Supabase project
 */
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> {
  const testUrl = (customUrl || getStoredSupabaseConfig().url).trim();
  const testKey = (customKey || getStoredSupabaseConfig().anonKey).trim();

  if (!testUrl || !testKey) {
    return {
      success: false,
      message: 'กรุณาระบุ Supabase Project URL และ Anon Key ให้ครบถ้วน',
    };
  }

  if (!testUrl.startsWith('https://')) {
    return {
      success: false,
      message: 'Project URL ต้องขึ้นต้นด้วย https:// (เช่น https://xyz.supabase.co)',
    };
  }

  try {
    const tempClient = createClient(testUrl, testKey);
    // Ping public table or auth
    const { error } = await tempClient.from('concerts').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // If table doesn't exist yet, it's still a valid connection to Supabase
      if (error.message.includes('relation "public.concerts" does not exist') || error.code === '42P01') {
        return {
          success: true,
          message: 'เชื่อมต่อ Supabase สำเร็จ! (แนะนำให้รันคำสั่ง SQL Schema ใน Tab 1 เพื่อสร้างตาราง)',
        };
      }
      return {
        success: false,
        message: `เชื่อมต่อไม่สำเร็จ: ${error.message} (Code: ${error.code})`,
      };
    }

    return {
      success: true,
      message: 'เชื่อมต่อ Supabase สำเร็จและพบตารางฐานข้อมูลพร้อมใช้งาน!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message || String(err)}`,
    };
  }
}
