-- ============================================
-- Fix: Allow checkout to save orders + update stock
-- Run this in Supabase SQL Editor (sekali saja)
-- ============================================

-- 1. Allow anyone to read product_variants (for stock check)
DROP POLICY IF EXISTS "Public can view product variants" ON product_variants;

CREATE POLICY "Public can view product variants" ON product_variants FOR
SELECT USING (true);

-- 2. Allow the API to update variant stock
DROP POLICY IF EXISTS "Anyone can update variant stock" ON product_variants;

CREATE POLICY "Anyone can update variant stock" ON product_variants FOR
UPDATE USING (true)
WITH
    CHECK (true);

-- 3. Allow anonymous users to insert orders
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;

CREATE POLICY "Anyone can insert orders" ON orders FOR
INSERT
WITH
    CHECK (true);

-- 4. Allow anonymous users to insert order items
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;

CREATE POLICY "Anyone can insert order items" ON order_items FOR
INSERT
WITH
    CHECK (true);

-- 5. Allow admin to update order status
DROP POLICY IF EXISTS "Admin can update orders" ON orders;

CREATE POLICY "Admin can update orders" ON orders FOR
UPDATE TO authenticated USING (true)
WITH
    CHECK (true);

-- 6. Make customer_phone nullable (we store address there now)
ALTER TABLE orders ALTER COLUMN customer_phone DROP NOT NULL;

ALTER TABLE orders ALTER COLUMN customer_phone SET DEFAULT '';

-- 7. Add variant_id to order_items if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'order_items' AND column_name = 'variant_id'
  ) THEN
    ALTER TABLE order_items ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
  END IF;
END $$;