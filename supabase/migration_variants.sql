-- ============================================
-- Migration: Add Product Variants
-- Run this AFTER the initial schema.sql
-- ============================================

-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add variant_id to order_items
ALTER TABLE order_items
ADD COLUMN variant_id UUID REFERENCES product_variants (id) ON DELETE RESTRICT;

-- 3. RLS for product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view variants" ON product_variants FOR
SELECT USING (true);

CREATE POLICY "Admin can insert variants" ON product_variants FOR
INSERT
    TO authenticated
WITH
    CHECK (true);

CREATE POLICY "Admin can update variants" ON product_variants FOR
UPDATE TO authenticated USING (true)
WITH
    CHECK (true);

CREATE POLICY "Admin can delete variants" ON product_variants FOR DELETE TO authenticated USING (true);

-- Allow service_role to update variant stock (Edge Function)
CREATE POLICY "Service role can update variants" ON product_variants FOR
UPDATE TO service_role USING (true)
WITH
    CHECK (true);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants (product_id);

-- 5. Seed variants for existing products
-- Sabun Cuci Piring
INSERT INTO
    product_variants (
        product_id,
        name,
        price,
        stock
    )
SELECT id, '500ml', 15000, 100
FROM products
WHERE
    name = 'Sabun Cuci Piring Premium'
UNION ALL
SELECT id, '1 Liter', 25000, 60
FROM products
WHERE
    name = 'Sabun Cuci Piring Premium'
UNION ALL
SELECT id, '5 Liter', 100000, 30
FROM products
WHERE
    name = 'Sabun Cuci Piring Premium';

-- Sabun Cuci Tangan
INSERT INTO
    product_variants (
        product_id,
        name,
        price,
        stock
    )
SELECT id, '250ml', 12000, 150
FROM products
WHERE
    name = 'Sabun Cuci Tangan Antibakteri'
UNION ALL
SELECT id, '500ml', 20000, 80
FROM products
WHERE
    name = 'Sabun Cuci Tangan Antibakteri'
UNION ALL
SELECT id, '1 Liter', 35000, 40
FROM products
WHERE
    name = 'Sabun Cuci Tangan Antibakteri';

-- Sabun Kendaraan
INSERT INTO
    product_variants (
        product_id,
        name,
        price,
        stock
    )
SELECT id, '500ml', 25000, 80
FROM products
WHERE
    name = 'Sabun Kendaraan Super Foam'
UNION ALL
SELECT id, '1 Liter', 45000, 50
FROM products
WHERE
    name = 'Sabun Kendaraan Super Foam'
UNION ALL
SELECT id, '5 Liter', 180000, 20
FROM products
WHERE
    name = 'Sabun Kendaraan Super Foam';

-- Sabun Detergen
INSERT INTO
    product_variants (
        product_id,
        name,
        price,
        stock
    )
SELECT id, '500g', 18000, 120
FROM products
WHERE
    name = 'Sabun Detergen Serbaguna'
UNION ALL
SELECT id, '1 Kg', 32000, 70
FROM products
WHERE
    name = 'Sabun Detergen Serbaguna'
UNION ALL
SELECT id, '5 Kg', 140000, 25
FROM products
WHERE
    name = 'Sabun Detergen Serbaguna';