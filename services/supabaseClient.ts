/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Ambil environment variables dari Vercel/Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL atau Anon Key belum diset. Pastikan .env atau Environment Variables di Vercel sudah diisi.');
}

// Export client untuk digunakan di seluruh aplikasi
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

