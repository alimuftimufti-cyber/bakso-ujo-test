import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE ---
// 1. URL Project Anda (Sudah saya masukkan sesuai yang Anda kirim)
const MANUAL_URL = 'https://wqjczpsdrpcmbaaubxal.supabase.co';

// 2. MASUKKAN ANON KEY DI SINI (Jika di Vercel belum jalan)
// Hapus tulisan kosong di bawah, lalu paste kode panjang "anon public key" di antara tanda kutip
// Contoh: const MANUAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
const MANUAL_KEY = 'sb_secret_VhaHhCMvJCmZC_eVLRB-yQ_kaJy0MkM'; 

// Sistem akan mencoba membaca dari Vercel dulu, kalau tidak ada baru pakai yang manual di atas
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || MANUAL_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || MANUAL_KEY;

// Logika pembuatan client
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

// Log error di console browser jika kunci belum dipasang (untuk debugging)
if (!supabaseKey) {
  console.error("⚠️ SUPABASE KEY BELUM DIPASANG!");
  console.error("Silakan buka file 'supabaseClient.ts' dan paste Anon Key di variabel MANUAL_KEY, atau atur di Vercel.");
}
