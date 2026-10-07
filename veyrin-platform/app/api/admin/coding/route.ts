import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (!(user.email?.trim().toLowerCase() === process.env.ADMIN_EMAIL?.trim().toLowerCase() || user.user_metadata?.role === "admin")) {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { data, error } = await createAdminClient().from("coding_questions").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data || [] });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  try {
    const b = await req.json();
    const title = String(b.title || "").trim();
    const prompt = String(b.prompt || "").trim();
    const expected = String(b.expected_code || "").trim();
    if (!title || !prompt || !expected) return NextResponse.json({ error: "Title, problem and expected code are required." }, { status: 400 });
    const { data, error } = await createAdminClient().from("coding_questions").insert({
      title,
      category: String(b.category || "Python"),
      difficulty: String(b.difficulty || "Medium"),
      prompt,
      starter_code: String(b.starter_code || ""),
      expected_code: expected,
      explanation: String(b.explanation || ""),
      complexity: String(b.complexity || ""),
      course_id: b.course_id || null,
      published: b.published !== false,
      created_by: auth.user.id,
      updated_at: new Date().toISOString(),
    }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ question: data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "Question id is required" }, { status: 400 });
  const allowed = ["title", "category", "difficulty", "prompt", "starter_code", "expected_code", "explanation", "complexity", "course_id", "published"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (b[key] !== undefined) update[key] = b[key];
  update.updated_at = new Date().toISOString();
  const { data, error } = await createAdminClient().from("coding_questions").update(update).eq("id", b.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ question: data });
}

export async function DELETE(req: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "Question id is required" }, { status: 400 });
  const { error } = await createAdminClient().from("coding_questions").delete().eq("id", b.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
