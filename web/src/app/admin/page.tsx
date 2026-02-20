"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Product } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";

interface VariantForm {
  id?: string;
  name: string;
  price: string;
  stock: string;
}

export default function AdminDashboard() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<{id:string;customer_name:string;total_price:number;status:string;created_at:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Product form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDiscount, setFormDiscount] = useState("");
  const [formVariants, setFormVariants] = useState<VariantForm[]>([]);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*, variants:product_variants(*)")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  }, [supabase]);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders(data);
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, [fetchProducts, fetchOrders]);

  const openAddModal = () => {
    setEditingId(null);
    setFormName("");
    setFormCategory("");
    setFormPrice("0");
    setFormStock("0");
    setFormImage("");
    setFormDesc("");
    setFormDiscount("");
    setFormVariants([{ name: "", price: "", stock: "" }]);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingId(product.id);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormPrice(String(product.price));
    setFormStock(String(product.stock));
    setFormImage(product.image_url || "");
    setFormDesc(product.description || "");
    setFormDiscount(product.discount_price ? String(product.discount_price) : "");
    setFormVariants(
      product.variants && product.variants.length > 0
        ? product.variants.map((v) => ({
            id: v.id,
            name: v.name,
            price: String(v.price),
            stock: String(v.stock),
          }))
        : [{ name: "", price: "", stock: "" }]
    );
    setShowModal(true);
  };

  const addVariantRow = () => {
    setFormVariants([...formVariants, { name: "", price: "", stock: "" }]);
  };

  const removeVariantRow = (index: number) => {
    setFormVariants(formVariants.filter((_, i) => i !== index));
  };

  const updateVariantRow = (index: number, field: keyof VariantForm, value: string) => {
    const updated = [...formVariants];
    updated[index] = { ...updated[index], [field]: value };
    setFormVariants(updated);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCategory.trim()) {
      showToast("Nama dan kategori wajib diisi");
      return;
    }

    // Validate variants
    const validVariants = formVariants.filter(
      (v) => v.name.trim() && v.price && v.stock
    );
    if (validVariants.length === 0) {
      showToast("Minimal 1 varian harus diisi (nama, harga, stok)");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        // Update product
        const { error: productError } = await supabase
          .from("products")
          .update({
            name: formName.trim(),
            category: formCategory.trim(),
            price: Number(validVariants[0].price),
            stock: validVariants.reduce((sum, v) => sum + Number(v.stock), 0),
            image_url: formImage.trim() || null,
            description: formDesc.trim() || null,
            discount_price: formDiscount ? Number(formDiscount) : null,
          })
          .eq("id", editingId);

        if (productError) throw productError;

        // Handle variants: delete removed, update existing, insert new
        const existingVariantIds = validVariants
          .filter((v) => v.id)
          .map((v) => v.id!);

        // Delete variants that were removed
        if (existingVariantIds.length > 0) {
          await supabase
            .from("product_variants")
            .delete()
            .eq("product_id", editingId)
            .not("id", "in", `(${existingVariantIds.join(",")})`);
        } else {
          await supabase
            .from("product_variants")
            .delete()
            .eq("product_id", editingId);
        }

        // Upsert variants
        for (const v of validVariants) {
          if (v.id) {
            await supabase
              .from("product_variants")
              .update({
                name: v.name.trim(),
                price: Number(v.price),
                stock: Number(v.stock),
              })
              .eq("id", v.id);
          } else {
            await supabase.from("product_variants").insert({
              product_id: editingId,
              name: v.name.trim(),
              price: Number(v.price),
              stock: Number(v.stock),
            });
          }
        }

        showToast("Produk berhasil diperbarui");
      } else {
        // Insert new product
        const { data: newProduct, error: productError } = await supabase
          .from("products")
          .insert({
            name: formName.trim(),
            category: formCategory.trim(),
            price: Number(validVariants[0].price),
            stock: validVariants.reduce((sum, v) => sum + Number(v.stock), 0),
            image_url: formImage.trim() || null,
            description: formDesc.trim() || null,
            discount_price: formDiscount ? Number(formDiscount) : null,
          })
          .select("id")
          .single();

        if (productError || !newProduct) throw productError;

        // Insert variants
        const variantInserts = validVariants.map((v) => ({
          product_id: newProduct.id,
          name: v.name.trim(),
          price: Number(v.price),
          stock: Number(v.stock),
        }));

        await supabase.from("product_variants").insert(variantInserts);

        showToast("Produk berhasil ditambahkan");
      }

      setShowModal(false);
      fetchProducts();
    } catch {
      showToast("Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      showToast("Gagal menghapus produk");
    } else {
      showToast("Produk berhasil dihapus");
      fetchProducts();
    }
    setDeleteId(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Product Stats
  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, p) => sum + (p.variants?.length || 0), 0);
  const lowStockVariants = products.reduce(
    (sum, p) =>
      sum +
      (p.variants?.filter((v) => v.stock > 0 && v.stock <= 10).length || 0),
    0
  );
  const outOfStockVariants = products.reduce(
    (sum, p) =>
      sum + (p.variants?.filter((v) => v.stock === 0).length || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola produk dan varian</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <a
            href="/admin/orders"
            className="px-4 py-2.5 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Pesanan
          </a>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-200/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Produk
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Sales Dashboard */}
      {(() => {
        const totalRevenue = orders.filter(o => o.status === 'done').reduce((s, o) => s + Number(o.total_price), 0);
        const pendingRevenue = orders.filter(o => o.status !== 'done' && o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_price), 0);
        const activeOrders = orders.filter(o => o.status !== 'cancelled');
        const totalOrders = activeOrders.length;
        const completedOrders = orders.filter(o => o.status === 'done').length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        const recentOrders = orders.slice(0, 5);
        const statusColor: Record<string,string> = { pending:'text-amber-600 bg-amber-50', confirmed:'text-blue-600 bg-blue-50', shipped:'text-purple-600 bg-purple-50', done:'text-emerald-600 bg-emerald-50', cancelled:'text-red-500 bg-red-50' };
        const statusLabel: Record<string,string> = { pending:'Menunggu', confirmed:'Dikonfirmasi', shipped:'Dikirim', done:'Selesai', cancelled:'Dibatalkan' };
        return (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">📊 Dashboard Penjualan</h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs text-slate-500 font-medium">Total Pendapatan</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{formatRupiah(totalRevenue)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">dari {completedOrders} pesanan selesai</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs text-slate-500 font-medium">Pending Revenue</p>
                <p className="text-xl font-bold text-amber-600 mt-1">{formatRupiah(pendingRevenue)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">belum selesai</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs text-slate-500 font-medium">Total Pesanan</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{totalOrders}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">tidak termasuk batal</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs text-slate-500 font-medium">Rata-rata/Order</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{totalOrders > 0 ? formatRupiah(Math.round(activeOrders.reduce((s,o) => s + Number(o.total_price), 0) / totalOrders)) : 'Rp0'}</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <p className="text-xs text-slate-500 font-medium">Dibatalkan</p>
                <p className="text-2xl font-bold text-red-500 mt-1">{cancelledOrders}</p>
              </div>
            </div>

            {/* Recent Orders */}
            {recentOrders.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Pesanan Terbaru</h3>
                  <a href="/admin/orders" className="text-xs text-blue-600 font-medium hover:text-blue-700">Lihat Semua →</a>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentOrders.map(order => (
                    <div key={order.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${statusColor[order.status] || 'text-slate-500 bg-slate-50'}`}>
                          {order.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{order.customer_name}</p>
                          <p className="text-[11px] text-slate-400">{new Date(order.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{formatRupiah(order.total_price)}</p>
                        <span className={`text-[10px] font-semibold ${statusColor[order.status] || ''} px-1.5 py-0.5 rounded-md`}>{statusLabel[order.status] || order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Product Stats */}
      <h2 className="text-lg font-bold text-slate-800 mb-4">📦 Inventori Produk</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Produk", value: totalProducts, color: "blue" },
          { label: "Total Varian", value: totalVariants, color: "cyan" },
          { label: "Stok Rendah", value: lowStockVariants, color: "amber" },
          { label: "Stok Habis", value: outOfStockVariants, color: "red" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
          >
            <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 mt-3">Memuat produk...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400">Belum ada produk. Tambahkan produk pertama Anda!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Produk</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Kategori</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Varian</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg shrink-0 overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{product.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {product.variants?.map((v) => (
                          <div key={v.id} className="flex items-center gap-2 text-xs">
                            <span className="font-medium text-slate-700">{v.name}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-blue-600">{formatRupiah(v.price)}</span>
                            <span className="text-slate-400">•</span>
                            <span
                              className={`font-medium ${
                                v.stock === 0
                                  ? "text-red-500"
                                  : v.stock <= 10
                                  ? "text-amber-500"
                                  : "text-emerald-600"
                              }`}
                            >
                              {v.stock} stok
                            </span>
                          </div>
                        ))}
                        {(!product.variants || product.variants.length === 0) && (
                          <span className="text-xs text-slate-300">Belum ada varian</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Produk?</h3>
            <p className="text-sm text-slate-500 mb-6">
              Produk dan semua variannya akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {editingId ? "Edit Produk" : "Tambah Produk Baru"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Sabun Cuci Piring Premium"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kategori *
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Cuci Piring"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  />
                </div>
                <div className="row-span-2">
                  <ImageUpload
                    currentUrl={formImage}
                    onUploaded={(url) => setFormImage(url)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="Deskripsi produk..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Harga Diskon (kosongkan jika tidak ada diskon)
                </label>
                <input
                  type="number"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(e.target.value)}
                  placeholder="Contoh: 8000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>

              {/* Variants Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Varian Produk *
                  </label>
                  <button
                    type="button"
                    onClick={addVariantRow}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Varian
                  </button>
                </div>

                <div className="space-y-2">
                  {formVariants.map((variant, i) => (
                    <div
                      key={i}
                      className="flex gap-2 items-center bg-slate-50 rounded-xl p-2 border border-slate-100"
                    >
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariantRow(i, "name", e.target.value)}
                        placeholder="Nama (500ml)"
                        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => updateVariantRow(i, "price", e.target.value)}
                        placeholder="Harga"
                        className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => updateVariantRow(i, "stock", e.target.value)}
                        placeholder="Stok"
                        className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                      />
                      {formVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariantRow(i)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                  saving
                    ? "bg-slate-200 text-slate-400 cursor-wait"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200/50"
                }`}
              >
                {saving ? "Menyimpan..." : editingId ? "Update" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
