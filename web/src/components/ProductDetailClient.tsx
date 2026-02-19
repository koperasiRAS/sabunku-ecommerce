"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, ProductVariant } from "@/lib/types";
import { useCart } from "@/lib/cartStore";
import { formatRupiah } from "@/lib/utils";
import ReviewSection from "./ReviewSection";

export default function ProductDetailClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const variants = product.variants || [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  );
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock <= 0) return;
    addItem(product, selectedVariant);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1500);
  };

  const priceRange =
    variants.length > 0
      ? {
          min: Math.min(...variants.map((v) => v.price)),
          max: Math.max(...variants.map((v) => v.price)),
        }
      : null;

  const hasDiscount =
    product.discount_price !== null &&
    product.discount_price !== undefined &&
    product.discount_price > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 sm:mb-8 overflow-x-auto">
        <Link href="/" className="hover:text-blue-600 transition-colors shrink-0">
          Beranda
        </Link>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/products" className="hover:text-blue-600 transition-colors shrink-0">
          Produk
        </Link>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-slate-700 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Product Image */}
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          {hasDiscount && (
            <div className="absolute top-4 left-4 z-10">
              <span className="px-3 py-1.5 text-sm font-bold bg-red-500 text-white rounded-xl shadow-lg">
                DISKON {priceRange ? Math.round(((priceRange.min - product.discount_price!) / priceRange.min) * 100) : 0}%
              </span>
            </div>
          )}
          {!imgError && product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              width={600}
              height={600}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <svg className="w-24 h-24 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-slate-300 text-sm font-medium">{product.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-600 rounded-full">
              {product.category}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            {product.name}
          </h1>

          {/* Price range */}
          {priceRange && (
            <div className="mb-4">
              {hasDiscount ? (
                <div>
                  <div className="text-lg text-slate-400 line-through">
                    {priceRange.min === priceRange.max
                      ? formatRupiah(priceRange.min)
                      : `${formatRupiah(priceRange.min)} — ${formatRupiah(priceRange.max)}`}
                  </div>
                  <span className="text-2xl font-bold text-red-500">
                    {formatRupiah(product.discount_price!)}
                  </span>
                </div>
              ) : priceRange.min === priceRange.max ? (
                <span className="text-2xl font-bold text-blue-600">
                  {formatRupiah(priceRange.min)}
                </span>
              ) : (
                <span className="text-2xl font-bold text-blue-600">
                  {formatRupiah(priceRange.min)} — {formatRupiah(priceRange.max)}
                </span>
              )}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-slate-600 leading-relaxed mb-6 text-sm sm:text-base">
              {product.description}
            </p>
          )}

          {/* Variant Selector */}
          {variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">
                Pilih Varian
              </h3>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.stock <= 0}
                    className={`relative px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                      selectedVariant?.id === variant.id
                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                        : variant.stock <= 0
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="font-semibold">{variant.name}</div>
                    <div className="text-xs mt-0.5">
                      {formatRupiah(variant.price)}
                    </div>
                    {variant.stock <= 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full">
                          Habis
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected variant details */}
          {selectedVariant && (
            <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-slate-500">Harga:</span>
                  <span className="ml-2 text-xl font-bold text-slate-900">
                    {formatRupiah(selectedVariant.price)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Stok:</span>
                  <span
                    className={`ml-2 text-sm font-semibold ${
                      selectedVariant.stock > 10
                        ? "text-emerald-600"
                        : selectedVariant.stock > 0
                        ? "text-amber-600"
                        : "text-red-500"
                    }`}
                  >
                    {selectedVariant.stock > 0
                      ? `${selectedVariant.stock} tersedia`
                      : "Habis"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || selectedVariant.stock <= 0}
            className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
              addedFeedback
                ? "bg-emerald-500 text-white scale-[0.98]"
                : !selectedVariant || selectedVariant.stock <= 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200/50 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            }`}
          >
            {addedFeedback ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Ditambahkan ke Keranjang!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Tambah ke Keranjang
              </>
            )}
          </button>

          {/* Back link */}
          <Link
            href="/products"
            className="mt-4 text-center text-sm text-slate-400 hover:text-blue-600 transition-colors"
          >
            ← Kembali ke Katalog
          </Link>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection productId={product.id} />
    </div>
  );
}
