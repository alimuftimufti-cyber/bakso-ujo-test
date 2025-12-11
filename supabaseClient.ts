
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE (SMART SETUP) ---
// Kita prioritaskan Environment Variable (Vercel), tapi jika kosong,
// kita izinkan membaca dari LocalStorage browser agar user pemula mudah setting.

const MANUAL_URL = 'https://wqjczpsdrpcmbaaubxal.supabase.co';

const MANUAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamN6cHNkcnBjbWJhYXVieGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMjIsImV4cCI6MjA4MDk5NTAyMn0.jKp4JHxCNvLzIStAWUmmixeHHMTWmqNFKUvum-Veb1o';

// 1. Coba baca dari Environment (Vercel/Vite)
const env = (import.meta as any).env || {};
let finalUrl = env.VITE_SUPABASE_URL || MANUAL_URL;
let finalKey = env.VITE_SUPABASE_ANON_KEY || MANUAL_KEY;

// 2. Jika di Environment kosong, coba baca dari Penyimpanan Browser (LocalStorage)
if (!finalKey) {
    try {
        const storedKey = localStorage.getItem('bakso_ujo_anon_key');
        const storedUrl = localStorage.getItem('bakso_ujo_url');
        
        if (storedKey) finalKey = storedKey;
        if (storedUrl) finalUrl = storedUrl;
    } catch (e) {
        console.warn("Akses LocalStorage gagal (mungkin incognito/restricted).");
    }
}

// 3. Validasi Format Kunci (Harus JWT 'ey...')
const isValidKey = finalKey && finalKey.startsWith('ey');

// 4. Buat Client
export const supabase = (finalUrl && isValidKey) 
  ? createClient(finalUrl, finalKey) 
  : null;

// --- FUNGSI BANTUAN (UNTUK SETUP DI APP.TSX) ---
export const saveCredentials = (url: string, key: string) => {
    if (!key.startsWith('ey')) {
        alert("Format Kunci Salah! Harus berawalan 'ey...'. Cek 'anon public' di Supabase.");
        return false;
    }
    localStorage.setItem('bakso_ujo_url', url);
    localStorage.setItem('bakso_ujo_anon_key', key);
    window.location.reload(); // Reload agar client baru terbentuk
    return true;
};

export const clearCredentials = () => {
    localStorage.removeItem('bakso_ujo_url');
    localStorage.removeItem('bakso_ujo_anon_key');
    window.location.reload();
};

export const hasSavedCredentials = () => {
    return !!localStorage.getItem('bakso_ujo_anon_key');
};

// Log status untuk debugging
if (!supabase) {
    console.log("⚠️ Mode Offline: Database belum terhubung. Klik 'Setup Database' di aplikasi.");
} else {
    console.log("✅ Mode Online: Database Terhubung!");
}
