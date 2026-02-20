import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Product } from "@/lib/types";
import type { Metadata } from "next";
import ProductDetailClient from "@/components/ProductDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("name, description, image_url, category, price, discount_price")
    .eq("id", id)
    .single();

  if (!product) {
    return { title: "Produk Tidak Ditemukan — Cemerlang" };
  }

  const price = product.discount_price || product.price;
  const title = `${product.name} — Cemerlang`;
  const description =
    product.description ||
    `Beli ${product.name} (${product.category}) dengan harga Rp${price.toLocaleString("id-ID")} di Cemerlang. Produk berkualitas, pesan langsung via WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image_url ? [{ url: product.image_url }] : [],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, variants:product_variants(*)")
    .eq("id", id)
    .single();

  if (error || !product) {
    notFound();
  }

  return <ProductDetailClient product={product as Product} />;
}
