import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE ---
// PENTING: Agar "Langsung Online Semua", Boss harus mengisi 2 baris di bawah ini 
// dengan URL dan KEY yang benar dari Komputer 1 (Lihat menu Setting Database).

const HARDCODED_URL = 'https://wqjczpsdrpcmbaaubxal.supabase.co'; // <--- MASUKKAN URL DI SINI (Contoh: 'https://xyz.supabase.co')
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamN6cHNkcnBjbWJhYXVieGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMjIsImV4cCI6MjA4MDk5NTAyMn0.jKp4JHxCNvLzIStAWUmmixeHHMTWmqNFKUvum-Veb1o'; // <--- MASUKKAN KEY DI SINI (Contoh: 'eyJhb...')

// 1. Cek Environment Variables (Vercel)
const env = (import.meta as any).env || {};
let finalUrl = env.VITE_SUPABASE_URL || HARDCODED_URL;
let finalKey = env.VITE_SUPABASE_ANON_KEY || HARDCODED_KEY;

// 2. Cek LocalStorage (Jika user pernah input manual)
try {
    const storedUrl = localStorage.getItem('bakso_ujo_url');
    const storedKey = localStorage.getItem('bakso_ujo_anon_key');
    
    // Prioritas: Jika Hardcoded kosong, baru pakai LocalStorage
    // Jika Hardcoded ada isinya, kita pakai Hardcoded (agar konsisten di semua device)
    const hasHardcoded = HARDCODED_URL.length > 10 && HARDCODED_KEY.length > 20;

    if (!hasHardcoded && storedUrl && storedUrl.startsWith('http') && storedKey && storedKey.length > 20) {
        console.log("Menggunakan konfigurasi dari LocalStorage.");
        finalUrl = storedUrl;
        finalKey = storedKey;
    } else if (hasHardcoded) {
        console.log("Menggunakan konfigurasi Hardcoded (Permanen).");
        finalUrl = HARDCODED_URL;
        finalKey = HARDCODED_KEY;
    }
} catch (e) {
    console.warn("Gagal membaca penyimpanan lokal.");
}

// 3. Validasi & Buat Client
const isValidUrl = finalUrl && finalUrl.startsWith('http');
const isValidKey = finalKey && finalKey.length > 20;

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

export const resetToDefault = () => {
    localStorage.removeItem('bakso_ujo_url');
    localStorage.removeItem('bakso_ujo_anon_key');
    window.location.reload();
}

export const hasSavedCredentials = () => {
    return !!localStorage.getItem('bakso_ujo_url') && !!localStorage.getItem('bakso_ujo_anon_key');
};

if (!supabase) {
    console.log("⚠️ Mode Offline (Belum ada URL/Key yang valid)");
} else {
    console.log(`✅ Mode Online: Terhubung ke ${finalUrl}`);
}
