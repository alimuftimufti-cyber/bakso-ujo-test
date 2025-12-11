
# PANDUAN CARA ONLINE & UPDATE (BAKSO UJO)

Halo Boss! Berikut adalah panduan lengkap untuk meng-online-kan aplikasi dan cara melakukan update jika ada perubahan kode.

## BAGIAN A: JIKA BELUM PERNAH ONLINE (PERTAMA KALI)

### TAHAP 1: SIAPKAN AKUN
1. Buka [GitHub.com](https://github.com) -> Daftar Akun (Gratis).
2. Buka [Vercel.com](https://vercel.com) -> Login pakai akun GitHub tadi.

### TAHAP 2: UPLOAD KODE PERTAMA
1. Di GitHub, klik tombol **+** (pojok kanan atas) -> **New Repository**.
2. Isi nama repository: `bakso-ujo`.
3. Pilih **Public**.
4. Klik **Create repository**.
5. Klik link **"uploading an existing file"** (di bagian Quick setup).
6. Drag & Drop **SEMUA FILE** dari folder proyek Anda ke sana.
7. Klik **Commit changes**.

### TAHAP 3: SAMBUNGKAN KE VERCEL
1. Di Vercel, klik **Add New Project**.
2. Pilih Import dari GitHub (`bakso-ujo`).
3. **PENTING:** Masukkan Environment Variables (Kunci Supabase) di bagian "Environment Variables".
   - `VITE_SUPABASE_URL`: (Isi URL Supabase Anda)
   - `VITE_SUPABASE_ANON_KEY`: (Isi Anon Key Supabase Anda)
4. Klik **Deploy**.

---

## BAGIAN B: JIKA SUDAH ONLINE (CARA UPDATE PERUBAHAN)

Anda baru saja mengubah kode (misalnya `App.tsx` atau `supabaseClient.ts`)? Ikuti langkah ini agar website ikut berubah.

### LANGKAH UPDATE:
1. Buka repository **GitHub** `bakso-ujo` Anda.
2. Klik tombol **Add file** -> **Upload files**.
3. Tarik (Drag & Drop) file-file yang baru saja diubah (seperti `App.tsx`, `components/SettingsView.tsx`, `index.html`, dll) ke sana.
4. Di kotak pesan commit, tulis: *"Update fitur database online"*.
5. Klik tombol hijau **Commit changes**.

### LANGKAH C: CEK HASIL
1. **Vercel akan otomatis bekerja** begitu Anda klik Commit di GitHub. Anda tidak perlu buka Vercel lagi.
2. Tunggu sekitar 1-2 menit.
3. Buka website Anda (contoh: `bakso-ujo.vercel.app`).
4. **Refresh** halaman browser Anda.
5. Selesai! Aplikasi sudah ter-update dengan fitur Database Supabase.

---

## TROUBLESHOOTING (JIKA ERROR)
- Jika layar putih (blank): Cek di Vercel -> Dashboard -> Project -> Logs.
- Jika database tidak jalan: Pastikan Environment Variables di Vercel sudah benar (Tahap 3 Bagian A).
