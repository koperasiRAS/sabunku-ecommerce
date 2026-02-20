"use client";

import Link from "next/link";
import { useCart } from "@/lib/cartStore";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Navbar() {
  const { totalItems } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = pathname.startsWith("/admin");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-lg group-hover:shadow-blue-300 transition-all duration-300">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
              Cemerlang
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className={`text-sm font-medium transition-colors duration-200 ${
                pathname === "/products"
                  ? "text-blue-600"
                  : "text-slate-600 hover:text-blue-600"
              }`}
            >
              Produk
            </Link>
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors duration-200"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              <span>Keranjang</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[20px] h-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-md animate-fade-in">
                  {totalItems}
                </span>
              )}
            </Link>
            {!isAdmin && (
              <Link
                href="/admin/login"
                className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors duration-200"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Mobile menu button + Cart icon */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href="/cart"
              className="relative p-2 text-slate-600 hover:text-blue-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 shadow">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-600 hover:text-blue-600 transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 animate-fade-in">
            <Link
              href="/products"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-600 hover:text-blue-600"
            >
              Produk
            </Link>
            <Link
              href="/cart"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-600 hover:text-blue-600"
            >
              Keranjang
            </Link>
            {!isAdmin && (
              <Link
                href="/admin/login"
                onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-400 hover:text-slate-600"
              >
                Admin
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
