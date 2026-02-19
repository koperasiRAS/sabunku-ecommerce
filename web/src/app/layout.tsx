import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cartStore";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    default: "SabunKu — Produk Sabun Berkualitas dari UMKM Lokal",
    template: "%s",
  },
  description:
    "Jual sabun cuci piring, sabun cuci tangan, sabun kendaraan, dan detergen berkualitas dengan harga terjangkau untuk kebutuhan sehari-hari Anda.",
  keywords: ["sabun", "cuci piring", "detergen", "UMKM", "sabun kendaraan", "sabun cuci tangan", "produk lokal"],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "SabunKu",
    title: "SabunKu — Produk Sabun Berkualitas dari UMKM Lokal",
    description: "Produk sabun berkualitas premium dengan harga terjangkau. Pesan langsung via WhatsApp.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[var(--color-bg)]">
        <CartProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
        </CartProvider>
      </body>
    </html>
  );
}
