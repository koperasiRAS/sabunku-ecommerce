-- ============================================
-- E-Commerce UMKM Sabun — Database Schema
-- ============================================

-- 1. TABLES
-- --------------------------------------------

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    total_price NUMERIC NOT NULL CHECK (total_price >= 0),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC NOT NULL CHECK (price >= 0)
);

-- 2. ROW LEVEL SECURITY
-- --------------------------------------------

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products: public can read, only authenticated users (admin) can write
CREATE POLICY "Public can view products" ON products FOR
SELECT USING (true);

CREATE POLICY "Admin can insert products" ON products FOR
INSERT
    TO authenticated
WITH
    CHECK (true);

CREATE POLICY "Admin can update products" ON products FOR
UPDATE TO authenticated USING (true)
WITH
    CHECK (true);

CREATE POLICY "Admin can delete products" ON products FOR DELETE TO authenticated USING (true);

-- Orders: only service_role can insert (via Edge Function)
-- Authenticated admin can view orders
CREATE POLICY "Admin can view orders" ON orders FOR
SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert orders" ON orders FOR
INSERT
    TO service_role
WITH
    CHECK (true);

-- Order items: only service_role can insert (via Edge Function)
-- Authenticated admin can view
CREATE POLICY "Admin can view order items" ON order_items FOR
SELECT TO authenticated USING (true);

CREATE POLICY "Service role can insert order items" ON order_items FOR
INSERT
    TO service_role
WITH
    CHECK (true);

-- 3. INDEXES
-- --------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

-- 4. SEED DATA — 4 Soap Products
-- --------------------------------------------

INSERT INTO
    products (
        name,
        category,
        price,
        stock,
        image_url,
        description
    )
VALUES (
        'Sabun Cuci Piring Premium',
        'Cuci Piring',
        15000,
        100,
        '/images/sabun-cuci-piring.jpg',
        'Sabun cuci piring konsentrat dengan formula anti-lemak yang efektif membersihkan minyak dan sisa makanan membandel. Wangi lemon segar, lembut di tangan.'
    ),
    (
        'Sabun Cuci Tangan Antibakteri',
        'Cuci Tangan',
        12000,
        150,
        '/images/sabun-cuci-tangan.jpg',
        'Sabun cuci tangan cair antibakteri dengan kandungan moisturizer alami. Membunuh 99.9% kuman dan menjaga kelembapan kulit tangan.'
    ),
    (
        'Sabun Kendaraan Super Foam',
        'Kendaraan',
        25000,
        80,
        '/images/sabun-kendaraan.jpg',
        'Sabun pencuci kendaraan dengan formula super foam yang mengangkat kotoran tanpa merusak cat. Menghasilkan kilau maksimal dan perlindungan cat jangka panjang.'
    ),
    (
        'Sabun Detergen Serbaguna',
        'Detergen',
        18000,
        120,
        '/images/sabun-detergen.jpg',
        'Detergen serbaguna dengan teknologi deep clean yang efektif menghilangkan noda membandel. Cocok untuk semua jenis kain, harum tahan lama.'
    );