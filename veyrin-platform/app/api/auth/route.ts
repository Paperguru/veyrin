import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ signedIn: false, isAdmin: false }, { status: 200 });

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isAdmin = Boolean(adminEmail && user.email?.trim().toLowerCase() === adminEmail) || user.user_metadata?.role === "admin";
  return NextResponse.json({ signedIn: true, isAdmin, email: user.email || null });
}
