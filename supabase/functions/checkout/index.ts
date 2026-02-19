import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface CartItem {
  product_id: string;
  variant_id: string;
  quantity: number;
}

interface RequestBody {
  customer_name: string;
  customer_phone: string;
  items: CartItem[];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parse and validate request body
    const body: RequestBody = await req.json();
    const { customer_name, customer_phone, items } = body;

    if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Nama pelanggan tidak valid (min 2 karakter)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customer_phone || !/^(08|628)\d{8,12}$/.test(customer_phone.replace(/[\s-]/g, ""))) {
      return new Response(
        JSON.stringify({ error: "Nomor telepon tidak valid" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Keranjang belanja kosong" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service_role key (server-only, bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch all variants in the cart
    const variantIds = items.map((item) => item.variant_id);
    const { data: variants, error: variantsError } = await supabase
      .from("product_variants")
      .select("id, product_id, name, price, stock")
      .in("id", variantIds);

    if (variantsError || !variants) {
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data varian" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch product names
    const productIds = [...new Set(variants.map((v) => v.product_id))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);

    if (productsError || !products) {
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data produk" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p.name]));
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // 3. Validate stock for each item
    let totalPrice = 0;
    const orderItems: { product_id: string; variant_id: string; name: string; variant_name: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const variant = variantMap.get(item.variant_id);

      if (!variant) {
        return new Response(
          JSON.stringify({ error: `Varian tidak ditemukan: ${item.variant_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (item.quantity <= 0 || item.quantity > 100) {
        return new Response(
          JSON.stringify({ error: `Jumlah tidak valid untuk ${productMap.get(variant.product_id)}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (variant.stock < item.quantity) {
        return new Response(
          JSON.stringify({
            error: `Stok ${productMap.get(variant.product_id)} (${variant.name}) tidak mencukupi. Tersisa: ${variant.stock}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const lineTotal = variant.price * item.quantity;
      totalPrice += lineTotal;

      orderItems.push({
        product_id: variant.product_id,
        variant_id: variant.id,
        name: productMap.get(variant.product_id) || "",
        variant_name: variant.name,
        quantity: item.quantity,
        price: variant.price,
      });
    }

    // 4. Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        total_price: totalPrice,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Gagal membuat pesanan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Insert order items
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
      // Rollback: delete the order
      await supabase.from("orders").delete().eq("id", order.id);
      return new Response(
        JSON.stringify({ error: "Gagal menyimpan item pesanan" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Decrement variant stock
    for (const item of orderItems) {
      const variant = variantMap.get(item.variant_id)!;
      const { error: stockError } = await supabase
        .from("product_variants")
        .update({ stock: variant.stock - item.quantity })
        .eq("id", item.variant_id);

      if (stockError) {
        console.error(`Failed to update stock for ${item.variant_id}:`, stockError);
      }
    }

    // 7. Return success
    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        total_price: totalPrice,
        items: orderItems.map((item) => ({
          name: item.name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
