
import { createClient } from '@supabase/supabase-js';

// Kunci ini nanti akan kita isi dari Environment Variables Vercel
// Gunakan fallback object {} untuk mencegah error "Cannot read properties of undefined" jika env belum siap
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

// Jika belum ada kunci (mode lokal awal) atau URL kosong, client akan null tapi aplikasi tidak crash
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
