-- ============================================
-- RESET DATA: Hapus semua data, mulai dari awal
-- Jalankan di Supabase SQL Editor
-- ⚠️ HATI-HATI: Semua data akan HILANG PERMANEN!
-- ============================================

-- 1. Hapus semua order items
DELETE FROM order_items;

-- 2. Hapus semua orders
DELETE FROM orders;

-- 3. Hapus semua reviews
DELETE FROM reviews;

-- 4. Hapus semua product variants
DELETE FROM product_variants;

-- 5. Hapus semua products
DELETE FROM products;

-- Selesai! Database sekarang kosong dan siap diisi ulang via Admin.
-- Tambahkan produk baru lewat halaman /admin