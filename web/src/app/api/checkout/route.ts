import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface CartItem {
  product_id: string;
  variant_id: string;
  quantity: number;
}

interface RequestBody {
  customer_name: string;
  items: CartItem[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { customer_name, items } = body;

    // Validate
    if (!customer_name || customer_name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nama pelanggan tidak valid (min 2 karakter)" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Keranjang belanja kosong" },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If no service role key, use anon key (less secure but works for dev)
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch all variants in the cart
    const variantIds = items.map((item) => item.variant_id);
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, product_id, name, price, stock")
      .in("id", variantIds);

    if (variantsError || !variants) {
      return NextResponse.json(
        { error: "Gagal mengambil data varian" },
        { status: 500 }
      );
    }

    // Fetch product names
    const productIds = [...new Set(variants.map((v: { product_id: string }) => v.product_id))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { error: "Gagal mengambil data produk" },
        { status: 500 }
      );
    }

    const productMap = new Map(products.map((p: { id: string; name: string }) => [p.id, p.name]));
    const variantMap = new Map(
      variants.map((v: { id: string; product_id: string; name: string; price: number; stock: number }) => [v.id, v])
    );

    // Validate stock
    let totalPrice = 0;
    const orderItems: {
      product_id: string;
      variant_id: string;
      name: string;
      variant_name: string;
      quantity: number;
      price: number;
    }[] = [];

    for (const item of items) {
      const variant = variantMap.get(item.variant_id) as {
        id: string;
        product_id: string;
        name: string;
        price: number;
        stock: number;
      } | undefined;

      if (!variant) {
        return NextResponse.json(
          { error: `Varian tidak ditemukan: ${item.variant_id}` },
          { status: 400 }
        );
      }

      if (item.quantity <= 0 || item.quantity > 100) {
        return NextResponse.json(
          { error: `Jumlah tidak valid untuk ${productMap.get(variant.product_id)}` },
          { status: 400 }
        );
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Stok ${productMap.get(variant.product_id)} (${variant.name}) tidak mencukupi. Tersisa: ${variant.stock}`,
          },
          { status: 400 }
        );
      }

      totalPrice += variant.price * item.quantity;
      orderItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        name: productMap.get(variant.product_id) || "",
        variant_name: variant.name,
        quantity: item.quantity,
        price: variant.price,
      });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: "",
        total_price: totalPrice,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Gagal membuat pesanan" },
        { status: 500 }
      );
    }

    // Insert order items
    const orderItemsData = orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Gagal menyimpan item pesanan" },
        { status: 500 }
      );
    }

    // Decrement variant stock
    for (const item of orderItems) {
      const variant = variantMap.get(item.variant_id) as { stock: number } | undefined;
      if (variant) {
        await supabase
          .from("product_variants")
          .update({ stock: variant.stock - item.quantity })
          .eq("id", item.variant_id);
      }
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      total_price: totalPrice,
      items: orderItems.map((item) => ({
        name: item.name,
        variant_name: item.variant_name,
        quantity: item.quantity,
        price: item.price,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", details: String(err) },
      { status: 500 }
    );
  }
}
