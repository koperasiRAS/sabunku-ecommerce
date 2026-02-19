"use client";

import { useState, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import Image from "next/image";

interface ImageUploadProps {
  currentUrl: string;
  onUploaded: (url: string) => void;
}

export default function ImageUpload({ currentUrl, onUploaded }: ImageUploadProps) {
  const supabase = createSupabaseBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(currentUrl);
  const [error, setError] = useState<string | null>(null);

  const compressImage = (file: File, maxWidth: number, quality: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      const canvas = document.createElement("canvas");
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Canvas not supported"));

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Compression failed"));
            },
            "image/webp",
            quality
          );
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Compress image
      const compressed = await compressImage(file, 1200, 0.8);

      // Generate unique filename
      const ext = "webp";
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = `products/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, compressed, {
          contentType: "image/webp",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Gagal upload gambar. Pastikan bucket 'product-images' sudah dibuat.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    onUploaded("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        Foto Produk
      </label>

      {preview ? (
        <div className="relative w-full aspect-video bg-slate-50 rounded-xl overflow-hidden border border-slate-200 group">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain"
            sizes="400px"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-slate-700 text-xs font-medium rounded-lg shadow hover:bg-slate-50 transition-colors"
            >
              Ganti
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg shadow hover:bg-red-600 transition-colors"
            >
              Hapus
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all duration-200 cursor-pointer"
        >
          {uploading ? (
            <>
              <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs font-medium">Mengupload...</span>
            </>
          ) : (
            <>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Klik untuk upload gambar</span>
              <span className="text-[10px]">JPG, PNG, WebP (max 5MB)</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1.5">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
