-- ============================================
-- Supabase Storage: Product Images Bucket
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create storage bucket
INSERT INTO
    storage.buckets (id, name, public)
VALUES (
        'product-images',
        'product-images',
        true
    ) ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access
CREATE POLICY "Public can view product images" ON storage.objects FOR
SELECT USING (bucket_id = 'product-images');

-- 3. Allow authenticated users (admin) to upload
CREATE POLICY "Admin can upload product images" ON storage.objects FOR
INSERT
    TO authenticated
WITH
    CHECK (bucket_id = 'product-images');

-- 4. Allow authenticated users (admin) to update
CREATE POLICY "Admin can update product images" ON storage.objects FOR
UPDATE TO authenticated USING (bucket_id = 'product-images');

-- 5. Allow authenticated users (admin) to delete
CREATE POLICY "Admin can delete product images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images');