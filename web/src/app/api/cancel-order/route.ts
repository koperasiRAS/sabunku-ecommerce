import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get order to verify it's not already cancelled/done
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "cancelled") {
      return NextResponse.json({ error: "Order already cancelled" }, { status: 400 });
    }

    if (order.status === "done") {
      return NextResponse.json({ error: "Cannot cancel completed order" }, { status: 400 });
    }

    // 2. Get order items to restore stock
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity, variant_id")
      .eq("order_id", order_id);

    // 3. Restore stock for each variant
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.variant_id) {
          const { data: variant } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.variant_id)
            .single();

          if (variant) {
            await supabase
              .from("product_variants")
              .update({ stock: variant.stock + item.quantity })
              .eq("id", item.variant_id);

            console.log(`✅ Stock restored +${item.quantity} for variant ${item.variant_id}`);
          }
        }
      }
    }

    // 4. Update order status to cancelled
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order_id);

    if (updateError) {
      console.error("❌ Cancel order error:", JSON.stringify(updateError));
      return NextResponse.json(
        { error: "Failed to cancel order", details: updateError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Order ${order_id} cancelled, stock restored`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Cancel order exception:", err);
    return NextResponse.json(
      { error: "Failed to cancel order", details: String(err) },
      { status: 500 }
    );
  }
}
