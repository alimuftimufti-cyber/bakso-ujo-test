
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE (AUTO CONNECT) ---
// Saya masukkan kunci yang Boss berikan di sini agar langsung connect.

const HARDCODED_URL = 'https://wqjczpsdrpcmbaaubxal.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamN6cHNkcnBjbWJhYXVieGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMjIsImV4cCI6MjA4MDk5NTAyMn0.jKp4JHxCNvLzIStAWUmmixeHHMTWmqNFKUvum-Veb1o';

// 1. Coba baca dari Environment (Vercel/Vite)
const env = (import.meta as any).env || {};
let finalUrl = env.VITE_SUPABASE_URL || HARDCODED_URL;
let finalKey = env.VITE_SUPABASE_ANON_KEY || HARDCODED_KEY;

// 2. Cek LocalStorage (jika user pernah input manual sebelumnya dan berbeda)
try {
    const storedUrl = localStorage.getItem('bakso_ujo_url');
    const storedKey = localStorage.getItem('bakso_ujo_anon_key');
    if (storedUrl && storedUrl.startsWith('http')) finalUrl = storedUrl;
    if (storedKey && storedKey.startsWith('ey')) finalKey = storedKey;
} catch (e) {
    console.warn("Akses LocalStorage gagal.");
}

// 3. Validasi Format
const isValidUrl = finalUrl && finalUrl.startsWith('http');
const isValidKey = finalKey && finalKey.startsWith('ey');

// 4. Buat Client
// Jika kunci valid, kita buat client. Jika tidak, null (Offline Mode).
export const supabase = (isValidUrl && isValidKey) 
  ? createClient(finalUrl, finalKey) 
  : null;

// --- FUNGSI BANTUAN ---

export const saveCredentials = (url: string, key: string) => {
    if (!url.startsWith('http')) {
        alert("URL tidak valid! Harus berawalan https://");
        return false;
    }
    if (!key.startsWith('ey')) {
        alert("Format Kunci Salah! Harus berawalan 'ey...'.");
        return false;
    }
    localStorage.setItem('bakso_ujo_url', url);
    localStorage.setItem('bakso_ujo_anon_key', key);
    window.location.reload(); 
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

// Reset ke Default (Hardcoded)
export const resetToDefault = () => {
    localStorage.removeItem('bakso_ujo_url');
    localStorage.removeItem('bakso_ujo_anon_key');
    window.location.reload();
}

if (!supabase) {
    console.log("⚠️ Mode Offline");
} else {
    console.log("✅ Mode Online: Mencoba menghubungkan ke", finalUrl);
}
