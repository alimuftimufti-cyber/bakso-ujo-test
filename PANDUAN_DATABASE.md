
# PANDUAN SETUP DATABASE & ONLINE (LENGKAP)

Halo Boss Bakso Ujo! Ikuti panduan ini satu per satu agar aplikasi bisa online dengan sempurna.

## TAHAP 1: BUAT DATABASE DI SUPABASE
1. Buka situs [supabase.com](https://supabase.com).
2. Klik tombol **"Start your project"**.
3. Login menggunakan akun **GitHub** Anda.
4. Klik **"New Project"**.
5. Isi form:
   - **Name:** `bakso-ujo-db`
   - **Database Password:** (Isi password yang kuat & CATAT di kertas!)
   - **Region:** `Singapore` (Paling cepat untuk Indonesia).
6. Klik **"Create new project"** dan tunggu sekitar 2 menit (sampai loading selesai dan layar dashboard muncul).

## TAHAP 2: JALANKAN PERINTAH SQL (MANTRA AJAIB)
1. Di dashboard Supabase (menu kiri), klik ikon **SQL Editor** (gambar terminal `>_` atau kertas).
2. Klik tombol **New Query** (atau kertas kosong).
3. Buka file `database.txt` yang ada di kode aplikasi Anda.
4. **COPY SEMUA TEKS** yang ada di dalam `database.txt` tersebut.
5. Kembali ke Supabase, **PASTE** ke kotak editor SQL tadi.
6. Klik tombol **RUN** (di pojok kanan bawah editor).
   - Pastikan muncul tulisan sukses: *"Success. No rows returned"* atau similar.
   
## TAHAP 3: AMBIL KUNCI RAHASIA (API KEYS)
1. Di dashboard Supabase (menu kiri paling bawah), klik ikon **Settings** (Roda Gigi).
2. Pilih menu **API**.
3. Anda akan melihat kotak **Project URL** dan **Project API Keys**.
   - Salin **Project URL** (Simpan di notepad sementara).
   - Salin **anon public key** (Simpan di notepad sementara).

## TAHAP 4: MASUKKAN KUNCI KE VERCEL
1. Buka dashboard [vercel.com](https://vercel.com).
2. Pilih proyek `bakso-ujo`.
3. Klik menu **Settings** (di bagian atas) -> pilih **Environment Variables** (menu kiri).
4. Masukkan kunci yang tadi disalin:

   **Kunci 1:**
   - Key: `VITE_SUPABASE_URL`
   - Value: (Paste URL Project dari Supabase)
   - Klik **Save** / **Add**.

   **Kunci 2:**
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: (Paste anon key dari Supabase)
   - Klik **Save** / **Add**.

## TAHAP 5: UPDATE APLIKASI
1. Kembali ke halaman utama proyek di Vercel.
2. Klik tab **Deployments**.
3. Klik tanda titik tiga (...) di deployment paling atas, lalu pilih **Redeploy**.
4. Tunggu sampai selesai.

## TAHAP TERAKHIR
Setelah Anda melakukan **TAHAP 1 sampai 5** di atas, beri tahu saya:

> **"Saya sudah jalankan SQL dari database.txt dan sudah simpan API Key di Vercel. Tolong update kodingan React (App.tsx) agar menggunakan Supabase sekarang."**

Saya akan mengubah kode aplikasi dari mode "Offline" menjadi mode "Online Database" segera setelah Anda siap!
