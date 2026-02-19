import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface StockItem {
  variant_id: string;
  quantity: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body as { items: StockItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    for (const item of items) {
      // Get current stock
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.variant_id)
        .single();

      if (variant && variant.stock >= item.quantity) {
        await supabase
          .from("product_variants")
          .update({ stock: variant.stock - item.quantity })
          .eq("id", item.variant_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to decrement stock", details: String(err) },
      { status: 500 }
    );
  }
}
