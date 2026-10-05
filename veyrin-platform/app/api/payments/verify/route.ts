import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    if (!process.env.RAZORPAY_KEY_SECRET) return NextResponse.json({ error: "Razorpay is not configured." }, { status: 503 });

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return NextResponse.json({ error: "Incomplete payment response." }, { status: 400 });

    const db = createAdminClient();
    const { data: paymentOrder } = await db.from("payment_orders").select("id,user_id,course_id,razorpay_order_id,amount,status").eq("razorpay_order_id", razorpay_order_id).eq("user_id", user.id).single();
    if (!paymentOrder) return NextResponse.json({ error: "Payment order not found." }, { status: 404 });

    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${paymentOrder.razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const valid = expected.length === razorpay_signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    if (!valid) return NextResponse.json({ error: "Payment signature verification failed." }, { status: 400 });

    await db.from("payment_orders").update({ status: "paid", razorpay_payment_id, razorpay_signature, paid_at: new Date().toISOString() }).eq("id", paymentOrder.id);
    const { error: enrollmentError } = await db.from("enrollments").upsert({ user_id: paymentOrder.user_id, course_id: paymentOrder.course_id, status: "active", progress: 0 }, { onConflict: "user_id,course_id" });
    if (enrollmentError) return NextResponse.json({ error: enrollmentError.message }, { status: 500 });

    return NextResponse.json({ ok: true, courseId: paymentOrder.course_id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to verify payment." }, { status: 500 });
  }
}
