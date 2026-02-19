"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import type { Review } from "@/lib/types";

interface ReviewSectionProps {
  productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const supabase = createSupabaseBrowserClient();

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (data) setReviews(data as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !rating) return;

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      reviewer_name: name.trim(),
      rating,
      comment: comment.trim() || null,
    });

    if (!error) {
      setSuccess(true);
      setName("");
      setRating(5);
      setComment("");
      setShowForm(false);
      fetchReviews();
      setTimeout(() => setSuccess(false), 3000);
    }
    setSubmitting(false);
  };

  const StarIcon = ({ filled, half }: { filled: boolean; half?: boolean }) => (
    <svg className={`w-4 h-4 ${filled ? "text-amber-400" : "text-slate-200"}`} fill="currentColor" viewBox="0 0 20 20">
      {half ? (
        <>
          <defs>
            <linearGradient id="halfStar">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>
          <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </>
      ) : (
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      )}
    </svg>
  );

  const renderStars = (count: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon key={i} filled={i < Math.floor(count)} half={i === Math.floor(count) && count % 1 >= 0.5} />
    ));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="mt-12 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-40 mb-4"></div>
        <div className="h-20 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Ulasan Pelanggan</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex">{renderStars(avgRating)}</div>
              <span className="text-sm font-semibold text-slate-700">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-sm text-slate-400">
                ({reviews.length} ulasan)
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
        >
          {showForm ? "Batal" : "✏️ Tulis Ulasan"}
        </button>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-xl animate-fade-in">
          ✅ Ulasan berhasil dikirim! Terima kasih.
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-in"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Anda
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Rating
              </label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverRating(i + 1)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(i + 1)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-7 h-7 transition-colors ${
                        i < (hoverRating || rating) ? "text-amber-400" : "text-slate-200"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-slate-500 self-center">
                  {rating}/5
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Komentar (opsional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bagikan pengalaman Anda..."
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                submitting
                  ? "bg-slate-200 text-slate-400 cursor-wait"
                  : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]"
              }`}
            >
              {submitting ? "Mengirim..." : "Kirim Ulasan"}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-2xl">
          <p className="text-sm text-slate-400 mb-1">Belum ada ulasan</p>
          <p className="text-xs text-slate-300">Jadilah yang pertama memberikan ulasan!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    {review.reviewer_name}
                  </h4>
                  <div className="flex items-center gap-1 mt-0.5">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <span className="text-xs text-slate-400">
                  {formatDate(review.created_at)}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
