import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  const isAdmin = user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === "admin";
  if (!isAdmin) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 400 }) };
  return { user };
}

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);

export async function GET() {
  const auth = await requireAdmin(); if ("error" in auth) return auth.error;
  const { data, error } = await createAdminClient().from("materials").select("*,course:courses!materials_course_id_fkey(id,title,slug,price),upgrade_course:courses!materials_upgrade_course_id_fkey(id,title,slug,price)").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ materials: data || [] });
}

export async function POST(req: Request) {
  const auth = await requireAdmin(); if ("error" in auth) return auth.error;
  try {
    const b = await req.json();
    const title = String(b.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (b.access_type === "paid" && !b.course_id) return NextResponse.json({ error: "Paid material must be linked to a course for access control." }, { status: 400 });
    const db = createAdminClient();
    const payload = {
      title,
      slug: slugify(String(b.slug || title)),
      description: String(b.description || ""),
      content_type: String(b.content_type || "pdf"),
      access_type: b.access_type === "paid" ? "paid" : "free",
      body: String(b.body || ""),
      file_path: b.file_path || null,
      file_name: b.file_name || null,
      course_id: b.course_id || null,
      upgrade_course_id: b.upgrade_course_id || null,
      published: Boolean(b.published),
      featured: Boolean(b.featured),
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await db.from("materials").insert(payload).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ material: data });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 }); }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(); if ("error" in auth) return auth.error;
  try {
    const b = await req.json(); if (!b.id) return NextResponse.json({ error: "Material id is required" }, { status: 400 });
    const allowed = ["title","slug","description","content_type","access_type","body","file_path","file_name","course_id","upgrade_course_id","published","featured"];
    const update: Record<string, unknown> = {};
    for (const key of allowed) if (b[key] !== undefined) update[key] = b[key];
    update.updated_at = new Date().toISOString();
    const { data, error } = await createAdminClient().from("materials").update(update).eq("id", b.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ material: data });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin(); if ("error" in auth) return auth.error;
  const b = await req.json(); if (!b.id) return NextResponse.json({ error: "Material id is required" }, { status: 400 });
  const { error } = await createAdminClient().from("materials").delete().eq("id", b.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
