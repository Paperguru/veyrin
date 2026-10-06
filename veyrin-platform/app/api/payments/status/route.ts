import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function razorpayFetch(path: string) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay is not configured on the server.");
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return fetch(`https://api.razorpay.com/v1${path}`, {
    method: "GET",
    headers: { Authorization: `Basic ${auth}` },
    cache: "no-store",
  });
}

export async function GET(req: Request) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");
    if (!orderId) return NextResponse.json({ error: "order_id is required." }, { status: 400 });

    const db = createAdminClient();
    const { data: paymentOrder, error: lookupError } = await db
      .from("payment_orders")
      .select("id,user_id,course_id,razorpay_order_id,amount,currency,status")
      .eq("razorpay_order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (lookupError) {
      const missingTable = lookupError.code === "PGRST205" || lookupError.message?.includes("payment_orders");
      return NextResponse.json({ error: missingTable ? "Payment table is not installed in Supabase." : lookupError.message }, { status: 500 });
    }
    if (!paymentOrder) return NextResponse.json({ error: "Payment order not found." }, { status: 404 });

    if (paymentOrder.status === "paid") {
      return NextResponse.json({ status: "paid", courseId: paymentOrder.course_id });
    }

    const response = await razorpayFetch(`/orders/${encodeURIComponent(orderId)}/payments`);
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: payload?.error?.description || "Unable to check payment status." }, { status: 502 });

    const payments = Array.isArray(payload?.items) ? payload.items : [];
    const captured = payments.find((payment: any) =>
      payment?.status === "captured" &&
      Number(payment?.amount) === Number(paymentOrder.amount) &&
      payment?.currency === paymentOrder.currency
    );

    if (captured) {
      await db.from("payment_orders").update({
        status: "paid",
        razorpay_payment_id: captured.id,
        paid_at: new Date().toISOString(),
      }).eq("id", paymentOrder.id);

      const { error: enrollmentError } = await db.from("enrollments").upsert({
        user_id: paymentOrder.user_id,
        course_id: paymentOrder.course_id,
        status: "active",
        progress: 0,
      }, { onConflict: "user_id,course_id" });

      if (enrollmentError) return NextResponse.json({ error: enrollmentError.message }, { status: 500 });
      return NextResponse.json({ status: "paid", courseId: paymentOrder.course_id });
    }

    return NextResponse.json({ status: "pending", courseId: paymentOrder.course_id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to check payment status." }, { status: 500 });
  }
}
