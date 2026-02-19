-- ============================================
-- Create reviews table
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id);

CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Public can view reviews" ON reviews FOR
SELECT USING (true);

-- Anyone can submit a review
CREATE POLICY "Anyone can insert reviews" ON reviews FOR
INSERT
WITH
    CHECK (true);

-- Admin can delete reviews
CREATE POLICY "Admin can delete reviews" ON reviews FOR DELETE TO authenticated USING (true);