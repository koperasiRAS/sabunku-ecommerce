export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppUrl(
  phoneNumber: string,
  orderId: string,
  customerName: string,
  items: { name: string; variant_name: string; quantity: number; price: number }[],
  totalPrice: number
): string {
  const itemLines = items
    .map(
      (item) =>
        `• ${item.name} — ${item.variant_name} (${item.quantity}x) — ${formatRupiah(item.price * item.quantity)}`
    )
    .join("\n");

  const message = `Halo Admin, saya ingin konfirmasi pesanan:

Order ID: ${orderId}

${itemLines}

Total: ${formatRupiah(totalPrice)}
Nama: ${customerName}

Terima kasih! 🙏`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
