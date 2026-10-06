import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { courses as demoCourses } from "@/lib/demo-data";

export async function POST(req: Request) {
  try {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in before purchasing." }, { status: 401 });

    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: "Course slug is required." }, { status: 400 });
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Razorpay is not configured on the server." }, { status: 503 });
    }

    const db = createAdminClient();
    let { data: course, error: courseError } = await db
      .from("courses")
      .select("id,slug,title,price,published")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle();

    // Keep the launch product usable if the user has not yet run the seed SQL.
    // The payment API still requires the courses table to exist.
    if ((!course || courseError) && slug === "genai-engineer-interview-bank-india") {
      const demo = demoCourses.find((item) => item.slug === slug);
      if (demo) {
        const { data: seeded, error: seedError } = await db
          .from("courses")
          .upsert({
            slug: demo.slug,
            title: demo.title,
            description: demo.description,
            role: demo.role,
            level: demo.level,
            duration: demo.duration,
            price: demo.price,
            cover_emoji: demo.cover_emoji,
            published: true,
            featured: true,
          }, { onConflict: "slug" })
          .select("id,slug,title,price,published")
          .single();
        if (!seedError) course = seeded;
      }
    }

    if (!course) {
      const detail = courseError?.message ? ` ${courseError.message}` : "";
      return NextResponse.json({ error: `Course not found in the Veyrin catalog.${detail}` }, { status: 404 });
    }
    if (Number(course.price) <= 0) return NextResponse.json({ error: "This course does not require payment." }, { status: 400 });

    const { data: existing } = await db.from("enrollments").select("id,status").eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
    if (existing?.status === "active") return NextResponse.json({ alreadyEnrolled: true });

    const amount = Math.round(Number(course.price) * 100);
    const receipt = `veyrin_${user.id.slice(0, 8)}_${Date.now()}`.slice(0, 40);
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency: "INR", receipt, notes: { course_id: course.id, user_id: user.id, slug: course.slug } }),
      cache: "no-store",
    });
    const order = await response.json();
    if (!response.ok) return NextResponse.json({ error: order?.error?.description || "Unable to create Razorpay order." }, { status: 502 });

    const { error: saveError } = await db.from("payment_orders").insert({ user_id: user.id, course_id: course.id, razorpay_order_id: order.id, amount, currency: "INR", status: "created" });
    if (saveError) {
      const missingTable = saveError.code === "PGRST205" || saveError.message?.includes("payment_orders");
      return NextResponse.json({ error: missingTable ? "Payment table is not installed. Run supabase/migrations/20261005_payment_orders.sql in Supabase SQL Editor, then retry." : saveError.message }, { status: 500 });
    }

    return NextResponse.json({ orderId: order.id, amount, currency: "INR", keyId: process.env.RAZORPAY_KEY_ID, courseTitle: course.title, user: { name: user.user_metadata?.full_name || "", email: user.email || "", contact: user.phone || "" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create order." }, { status: 500 });
  }
}
