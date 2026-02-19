"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { useCart } from "@/lib/cartStore";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [imgError, setImgError] = useState(false);

  const variants = product.variants || [];
  const cheapestVariant = variants.length > 0
    ? variants.reduce((min, v) => (v.price < min.price ? v : min), variants[0])
    : null;

  const totalStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + v.stock, 0)
    : product.stock;

  const displayPrice = cheapestVariant ? cheapestVariant.price : product.price;
  const hasDiscount = product.discount_price !== null && product.discount_price !== undefined && product.discount_price > 0 && product.discount_price < displayPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cheapestVariant || totalStock <= 0) return;
    addItem(product, cheapestVariant);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  return (
    <Link href={`/products/${product.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-100/50 hover:-translate-y-1">
        {/* Product Image */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          {!imgError && product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-slate-600 rounded-lg shadow-sm">
              {product.category}
            </span>
          </div>

          {/* Discount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 text-[11px] font-bold bg-red-500 text-white rounded-lg shadow-sm">
                DISKON {Math.round(((displayPrice - product.discount_price!) / displayPrice) * 100)}%
              </span>
            </div>
          )}

          {/* Out of stock overlay */}
          {totalStock <= 0 && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-bold text-slate-700">
                Stok Habis
              </span>
            </div>
          )}

          {/* Variants count */}
          {variants.length > 1 && (
            <div className="absolute bottom-3 right-3">
              <span className="px-2 py-1 text-[10px] font-semibold bg-blue-500 text-white rounded-lg shadow-sm">
                {variants.length} varian
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-slate-400">
                {variants.length > 1 ? "Mulai dari" : "Harga"}
              </span>
              {hasDiscount ? (
                <div>
                  <div className="text-xs text-slate-400 line-through">
                    {formatRupiah(displayPrice)}
                  </div>
                  <div className="text-lg font-bold text-red-500">
                    {formatRupiah(product.discount_price!)}
                  </div>
                </div>
              ) : (
                <div className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  {formatRupiah(displayPrice)}
                </div>
              )}
            </div>

            <button
              onClick={handleQuickAdd}
              disabled={totalStock <= 0}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                addedFeedback
                  ? "bg-emerald-500 text-white scale-95"
                  : totalStock <= 0
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                  : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white active:scale-95"
              }`}
            >
              {addedFeedback ? "✓ Added" : "+ Keranjang"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
