import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const fullName = String(body.full_name || "").trim().replace(/\s+/g, " ");
  if (fullName.length < 2 || fullName.length > 80) return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 });
  const admin = createAdminClient();
  const nextMetadata = { ...(user.user_metadata || {}), full_name: fullName };
  const { error: authError } = await admin.auth.admin.updateUserById(user.id, { user_metadata: nextMetadata });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const { error: profileError } = await admin.from("profiles").upsert({ id: user.id, full_name: fullName }, { onConflict: "id" });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  return NextResponse.json({ ok: true, full_name: fullName });
}
