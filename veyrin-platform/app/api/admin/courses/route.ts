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

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const db = createAdminClient();
  const { data, error } = await db.from("courses").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ courses: data });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const db = createAdminClient();
    const payload = {
      slug: String(body.slug || body.title || "new-course").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: String(body.title || "Untitled material"),
      description: String(body.description || ""),
      role: String(body.role || "AI Engineer"),
      level: String(body.level || "Intermediate"),
      duration: String(body.duration || "Self paced"),
      price: Math.max(0, Number(body.price || 0)),
      cover_emoji: String(body.cover_emoji || "✦"),
      published: Boolean(body.published),
      featured: Boolean(body.featured),
      content_type: String(body.content_type || "standard"),
      ppt_path: body.ppt_path || null,
      ppt_file_name: body.ppt_file_name || null,
      video_url: String(body.video_url || ""),
      video_title: String(body.video_title || ""),
      video_path: body.video_path || null,
      video_file_name: body.video_file_name || null,
    };
    const { data, error } = await db.from("courses").insert(payload).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ course: data });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 }); }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "Course id is required" }, { status: 400 });
    const allowed = ["title", "description", "role", "level", "duration", "price", "cover_emoji", "published", "featured", "slug", "content_type", "ppt_path", "ppt_file_name", "video_url", "video_title", "video_path", "video_file_name"] as const;
    const update: Record<string, unknown> = {};
    for (const key of allowed) if (body[key] !== undefined) update[key] = key === "price" ? Math.max(0, Number(body[key])) : body[key];
    const db = createAdminClient();
    const { data, error } = await db.from("courses").update(update).eq("id", body.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ course: data });
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 }); }
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Course id is required" }, { status: 400 });
  const db = createAdminClient();
  const { error } = await db.from("courses").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
