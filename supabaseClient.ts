
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE (SMART SETUP) ---

// 1. Coba baca dari Environment (Vercel/Vite)
const env = (import.meta as any).env || {};
let finalUrl = env.VITE_SUPABASE_URL || '';
let finalKey = env.VITE_SUPABASE_ANON_KEY || '';

// 2. Jika di Environment kosong, coba baca dari Penyimpanan Browser (LocalStorage)
if (!finalKey || !finalUrl) {
    try {
        const storedKey = localStorage.getItem('bakso_ujo_anon_key');
        const storedUrl = localStorage.getItem('bakso_ujo_url');
        
        if (storedKey) finalKey = storedKey;
        if (storedUrl) finalUrl = storedUrl;
    } catch (e) {
        console.warn("Akses LocalStorage gagal (mungkin incognito/restricted).");
    }
}

// 3. Validasi Format
// URL harus ada dan valid, Key harus berawalan 'ey'
const isValidUrl = finalUrl && finalUrl.startsWith('http');
const isValidKey = finalKey && finalKey.startsWith('ey');

// 4. Buat Client
export const supabase = (isValidUrl && isValidKey) 
  ? createClient(finalUrl, finalKey) 
  : null;

// --- FUNGSI BANTUAN (UNTUK SETUP DI APP.TSX) ---
export const saveCredentials = (url: string, key: string) => {
    if (!url.startsWith('http')) {
        alert("URL tidak valid! Harus berawalan https://");
        return false;
    }
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
