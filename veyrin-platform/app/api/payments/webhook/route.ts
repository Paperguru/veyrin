import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 503 });
    const signature = req.headers.get("x-razorpay-signature") || "";
    const raw = await req.text();
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (expected.length !== signature.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });

    const event = JSON.parse(raw);
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId) {
        const db = createAdminClient();
        const { data: order } = await db.from("payment_orders").select("id,user_id,course_id").eq("razorpay_order_id", orderId).maybeSingle();
        if (order) {
          await db.from("payment_orders").update({ status: "paid", razorpay_payment_id: payment.id, paid_at: new Date().toISOString() }).eq("id", order.id);
          await db.from("enrollments").upsert({ user_id: order.user_id, course_id: order.course_id, status: "active", progress: 0 }, { onConflict: "user_id,course_id" });
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Webhook processing failed." }, { status: 400 });
  }
}
