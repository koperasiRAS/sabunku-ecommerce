import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Product } from "@/lib/types";
import type { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Produk — Cemerlang",
  description: "Temukan berbagai produk sabun berkualitas premium: sabun cuci piring, sabun cuci tangan, sabun kendaraan, dan detergen. Harga terjangkau, pesan via WhatsApp.",
};

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-50 rounded-full mb-4">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-700 mb-1">Gagal Memuat Produk</h2>
          <p className="text-sm text-slate-500">Terjadi kesalahan saat mengambil data. Silakan coba lagi nanti.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
          Katalog <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Produk</span>
        </h1>
        <p className="text-base text-slate-500 max-w-xl mx-auto">
          Pilih produk sabun berkualitas sesuai kebutuhan Anda
        </p>
      </div>

      {/* Product Grid */}
      <ProductGrid products={(products as Product[]) || []} />
    </div>
  );
}
