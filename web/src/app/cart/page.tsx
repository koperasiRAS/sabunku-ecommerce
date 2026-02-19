"use client";

import { useCart } from "@/lib/cartStore";
import { formatRupiah } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setError("Nama lengkap harus diisi (min 2 karakter)");
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 10) {
      setError("Alamat lengkap harus diisi (min 10 karakter)");
      return;
    }

    // Save order to database + decrement stock (best-effort)
    try {
      const res = await fetch("/api/save-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName.trim(),
          customer_address: customerAddress.trim(),
          total_price: totalPrice,
          items: items.map((item) => ({
            product_id: item.product.id,
            variant_id: item.variant.id,
            product_name: item.product.name,
            variant_name: item.variant.name,
            quantity: item.quantity,
            price: item.variant.price,
          })),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        console.error("Save order failed:", result);
      } else {
        console.log("Order saved:", result);
      }
    } catch (err) {
      console.error("Save order error:", err);
    }

    // Build WhatsApp message
    const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || "62895321693131";

    const itemLines = items
      .map(
        (item) =>
          `• ${item.product.name} — ${item.variant.name} (${item.quantity}x) — ${formatRupiah(item.variant.price * item.quantity)}`
      )
      .join("\n");

    const message = `Halo Admin, saya ingin memesan:

${itemLines}

Total: ${formatRupiah(totalPrice)}

Nama: ${customerName.trim()}
Alamat: ${customerAddress.trim()}

Terima kasih! 🙏`;

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

    clearCart();
    window.open(waUrl, "_blank");
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-50 rounded-full mb-6">
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Keranjang Kosong</h2>
          <p className="text-sm text-slate-400 mb-6">Belum ada produk di keranjang belanja Anda</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-2xl shadow-lg shadow-blue-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            Lihat Produk
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
        Keranjang Belanja
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-3 space-y-4">
          {items.map((item) => (
            <div
              key={item.variant.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 animate-fade-in"
            >
              <Link href={`/products/${item.product.id}`} className="shrink-0">
                <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.id}`} className="hover:text-blue-600 transition-colors">
                  <h3 className="text-sm font-bold text-slate-800 truncate">
                    {item.product.name}
                  </h3>
                </Link>
                <p className="text-xs text-blue-500 font-medium mt-0.5">
                  Varian: {item.variant.name}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {formatRupiah(item.variant.price)}
                </p>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-semibold text-slate-700">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {formatRupiah(item.variant.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.variant.id)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium mt-0.5 transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sticky top-24">
            <h2 className="text-base font-bold text-slate-800 mb-4">
              Ringkasan Pesanan
            </h2>

            <div className="space-y-2 mb-4 text-sm">
              {items.map((item) => (
                <div key={item.variant.id} className="flex justify-between text-slate-500">
                  <span className="truncate mr-2">
                    {item.product.name} ({item.variant.name}) x{item.quantity}
                  </span>
                  <span className="font-medium text-slate-700 shrink-0">
                    {formatRupiah(item.variant.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-600">Total</span>
                <span className="text-xl font-bold text-slate-900">
                  {formatRupiah(totalPrice)}
                </span>
              </div>
            </div>

            {/* Checkout Form */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama Anda"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Jl. Contoh No. 123, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Checkout via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
