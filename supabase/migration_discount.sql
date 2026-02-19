-- ============================================
-- Add discount_price to products
-- Run this in Supabase SQL Editor
-- ============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS discount_price NUMERIC CHECK (discount_price >= 0);