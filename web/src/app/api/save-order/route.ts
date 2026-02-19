import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface OrderItemPayload {
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  price: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer_name, customer_address, items, total_price } = body as {
      customer_name: string;
      customer_address: string;
      items: OrderItemPayload[];
      total_price: number;
    };

    if (!customer_name || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insert order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_address.trim() || "-",
        total_price,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("❌ Order insert error:", JSON.stringify(orderError));
      return NextResponse.json(
        { error: "Failed to create order", details: orderError?.message },
        { status: 500 }
      );
    }

    console.log("✅ Order created:", order.id);

    // 2. Insert order items (without variant_id to avoid missing column error)
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("❌ Order items insert error:", JSON.stringify(itemsError));
    } else {
      console.log("✅ Order items inserted");
    }

    // 3. Decrement stock for each variant
    for (const item of items) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.variant_id)
        .single();

      if (variant && variant.stock >= item.quantity) {
        const { error: stockError } = await supabase
          .from("product_variants")
          .update({ stock: variant.stock - item.quantity })
          .eq("id", item.variant_id);

        if (stockError) {
          console.error("❌ Stock update error:", JSON.stringify(stockError));
        } else {
          console.log(`✅ Stock decremented for variant ${item.variant_id}`);
        }
      }
    }

    return NextResponse.json({ success: true, order_id: order.id });
  } catch (err) {
    console.error("❌ Save order exception:", err);
    return NextResponse.json(
      { error: "Failed to save order", details: String(err) },
      { status: 500 }
    );
  }
}
