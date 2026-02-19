# 🚀 Panduan Deploy — E-Commerce UMKM Sabun

## Daftar Isi

1. [Setup Supabase](#1-setup-supabase)
2. [Jalankan SQL Schema](#2-jalankan-sql-schema)
3. [Deploy Edge Function](#3-deploy-edge-function)
4. [Buat Akun Admin](#4-buat-akun-admin)
5. [Deploy ke Vercel](#5-deploy-ke-vercel)
6. [Environment Variables](#6-environment-variables)

---

## 1. Setup Supabase

1. Buka [supabase.com](https://supabase.com) dan daftar/masuk
2. Klik **"New Project"**
3. Isi nama project (contoh: `sabun-umkm`)
4. Pilih region terdekat (contoh: Southeast Asia - Singapore)
5. Set database password (simpan baik-baik!)
6. Tunggu project siap (~2 menit)

Setelah project jadi, catat:

- **Project URL** → `Settings > API > Project URL`
- **Anon Key** → `Settings > API > Project API keys (anon/public)`
- **Service Role Key** → `Settings > API > Project API keys (service_role)` ⚠️ Jangan expose ke frontend!

---

## 2. Jalankan SQL Schema

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy-paste seluruh isi file `supabase/schema.sql`
3. Klik **Run**
4. Pastikan tidak ada error

File ini akan membuat:

- Tabel `products`, `orders`, `order_items`
- RLS policies (baris keamanan)
- Index untuk performa
- 4 produk sabun sebagai data awal

---

## 3. Deploy Edge Function

### Opsi A: Via Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy checkout --no-verify-jwt
```

> `--no-verify-jwt` diperlukan karena public user (tanpa login) perlu akses ke checkout.

### Opsi B: Via Dashboard

1. Buka **Edge Functions** di Supabase Dashboard
2. Klik **"New Function"**
3. Nama: `checkout`
4. Copy-paste kode dari `supabase/functions/checkout/index.ts`
5. Tambahkan juga file `supabase/functions/_shared/cors.ts`
6. Deploy

### Set Edge Function Secrets

```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 4. Buat Akun Admin

1. Buka **Authentication** di Supabase Dashboard
2. Klik **"Add User"** > **"Create New User"**
3. Isi email dan password (contoh: `admin@sabunku.com`)
4. Klik **"Create User"**

Gunakan email & password ini untuk login di halaman `/admin/login`.

---

## 5. Deploy ke Vercel

### Persiapan

1. Push kode ke GitHub:

```bash
cd web
git init
git add .
git commit -m "Initial commit - E-Commerce UMKM Sabun"
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

2. Buka [vercel.com](https://vercel.com) dan connect repository

### Deploy

1. Klik **"Import"** pada repository
2. Framework preset akan otomatis terdeteksi sebagai **Next.js**
3. Set **Root Directory** ke `web`
4. Tambahkan environment variables (lihat section berikutnya)
5. Klik **Deploy**

---

## 6. Environment Variables

Tambahkan di Vercel (Settings > Environment Variables):

| Variable                                 | Value                                  | Keterangan                        |
| ---------------------------------------- | -------------------------------------- | --------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`               | `https://xxx.supabase.co`              | Project URL dari Supabase         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | `eyJhbGc...`                           | Anon/public key                   |
| `NEXT_PUBLIC_WA_NUMBER`                  | `628123456789`                         | Nomor WhatsApp Business (tanpa +) |
| `NEXT_PUBLIC_SUPABASE_EDGE_FUNCTION_URL` | `https://xxx.supabase.co/functions/v1` | Base URL Edge Functions           |

> ⚠️ **JANGAN** tambahkan `SUPABASE_SERVICE_ROLE_KEY` di Vercel/frontend. Key ini hanya digunakan di Edge Function.

---

## ✅ Checklist Sebelum Go Live

- [ ] SQL schema sudah dijalankan, 4 produk muncul
- [ ] Edge Function sudah di-deploy dan bisa diakses
- [ ] Akun admin sudah dibuat
- [ ] Environment variables sudah diset di Vercel
- [ ] Nomor WhatsApp sudah benar
- [ ] Test checkout → pesan masuk ke WhatsApp
- [ ] Test admin login → bisa CRUD produk
- [ ] Gambar produk sudah di-upload (ganti URL di admin dashboard)

---

## 🖼️ Gambar Produk

Secara default, gambar produk menggunakan path `/images/sabun-*.jpg`. Anda bisa:

1. **Upload gambar** ke folder `web/public/images/` dan gunakan path `/images/nama-file.jpg`
2. **Gunakan URL eksternal** — update image_url di admin dashboard dengan URL gambar dari hosting manapun
3. **Gunakan Supabase Storage** — upload gambar ke Supabase Storage dan gunakan public URL-nya

Untuk Next.js Image Optimization dengan URL eksternal, tambahkan domain di `next.config.ts`.
