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

    // 1. Verify order exists and is cancelled
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "cancelled") {
      return NextResponse.json(
        { error: "Only cancelled orders can be deleted" },
        { status: 400 }
      );
    }

    // 2. Delete order items first (foreign key)
    await supabase.from("order_items").delete().eq("order_id", order_id);

    // 3. Delete the order
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", order_id);

    if (deleteError) {
      console.error("❌ Delete order error:", JSON.stringify(deleteError));
      return NextResponse.json(
        { error: "Failed to delete order", details: deleteError.message },
        { status: 500 }
      );
    }

    console.log(`✅ Order ${order_id} deleted permanently`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Delete order exception:", err);
    return NextResponse.json(
      { error: "Failed to delete order", details: String(err) },
      { status: 500 }
    );
  }
}
