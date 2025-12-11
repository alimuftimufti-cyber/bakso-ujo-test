
import { createClient } from '@supabase/supabase-js';

// --- KONFIGURASI SUPABASE (PERMANEN) ---
// Kunci ini ditanam langsung agar semua device (HP/Laptop) otomatis connect ke database yang sama.
// Tidak perlu setting manual satu per satu.

const PROJECT_URL = 'https://wqjczpsdrpcmbaaubxal.supabase.co';
const PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxamN6cHNkcnBjbWJhYXVieGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTkwMjIsImV4cCI6MjA4MDk5NTAyMn0.jKp4JHxCNvLzIStAWUmmixeHHMTWmqNFKUvum-Veb1o';

// 1. Cek apakah ada Environment Variables (Opsional, biasanya untuk Vercel)
const env = (import.meta as any).env || {};
let finalUrl = env.VITE_SUPABASE_URL || PROJECT_URL;
let finalKey = env.VITE_SUPABASE_ANON_KEY || PROJECT_KEY;

// 2. Override dengan LocalStorage HANYA JIKA user secara eksplisit mengubahnya lewat menu setting
// Namun, kita validasi ketat agar tidak error.
try {
    const storedUrl = localStorage.getItem('bakso_ujo_url');
    const storedKey = localStorage.getItem('bakso_ujo_anon_key');
    
    // Hanya gunakan settingan lokal jika valid dan lengkap
    if (storedUrl && storedUrl.startsWith('http') && storedKey && storedKey.length > 20) {
        console.log("Menggunakan konfigurasi manual dari device ini.");
        finalUrl = storedUrl;
        finalKey = storedKey;
    } else {
        // Jika settingan lokal kosong/rusak, gunakan default yang sudah ditanam
        console.log("Menggunakan konfigurasi otomatis (Hardcoded).");
    }
} catch (e) {
    console.warn("Gagal membaca penyimpanan lokal, menggunakan default.");
}

// 3. Buat Koneksi
export const supabase = createClient(finalUrl, finalKey);

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

// Reset ke Default (Menghapus settingan manual device ini dan kembali ke Hardcoded)
export const resetToDefault = () => {
    localStorage.removeItem('bakso_ujo_url');
    localStorage.removeItem('bakso_ujo_anon_key');
    window.location.reload();
}

// Log status untuk debugging
console.log(`🚀 Aplikasi Bakso Ujo terhubung ke: ${finalUrl}`);
