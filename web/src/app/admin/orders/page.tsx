"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";

interface OrderRow {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  total_price: number;
  status: string;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  confirmed: "bg-blue-50 text-blue-600 border-blue-200",
  shipped: "bg-purple-50 text-purple-600 border-purple-200",
  done: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cancelled: "bg-red-50 text-red-500 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  shipped: "Dikirim",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

const STATUS_FLOW = ["pending", "confirmed", "shipped", "done"];

export default function AdminOrdersPage() {
  const supabase = createSupabaseBrowserClient();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as OrderRow[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      showToast("Gagal update status");
    } else {
      showToast(`Status diubah ke "${STATUS_LABELS[newStatus]}"`);
      fetchOrders();
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const doneCount = orders.filter((o) => o.status === "done").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Pesanan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola dan pantau status pesanan pelanggan
          </p>
        </div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Dashboard
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 font-medium">Menunggu</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 font-medium">Dikirim</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{shippedCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs text-slate-500 font-medium">Selesai</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{doneCount}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "Semua" },
          { key: "pending", label: "Menunggu" },
          { key: "confirmed", label: "Dikonfirmasi" },
          { key: "shipped", label: "Dikirim" },
          { key: "done", label: "Selesai" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === tab.key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
            }`}
          >
            {tab.label}
            {tab.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => o.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 mt-3">Memuat pesanan...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <p className="text-slate-400">
            {filter === "all" ? "Belum ada pesanan." : `Tidak ada pesanan dengan status "${STATUS_LABELS[filter]}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 animate-fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-800">
                      {order.customer_name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${
                        STATUS_COLORS[order.status] || STATUS_COLORS.pending
                      }`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDate(order.created_at)}
                    {order.customer_phone && ` • ${order.customer_phone}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">
                    {formatRupiah(order.total_price)}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-50">
                {STATUS_FLOW.map((status) => {
                  const currentIdx = STATUS_FLOW.indexOf(order.status);
                  const statusIdx = STATUS_FLOW.indexOf(status);
                  const isNext = statusIdx === currentIdx + 1;
                  const isCurrent = status === order.status;

                  if (!isNext && !isCurrent) return null;

                  return (
                    <button
                      key={status}
                      onClick={() => !isCurrent && updateStatus(order.id, status)}
                      disabled={isCurrent}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        isCurrent
                          ? "bg-slate-100 text-slate-400 cursor-default"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      {isNext ? `→ ${STATUS_LABELS[status]}` : STATUS_LABELS[status]}
                    </button>
                  );
                })}
                {order.status !== "cancelled" && order.status !== "done" && (
                  <button
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all ml-auto"
                  >
                    Batalkan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
