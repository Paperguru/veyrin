import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category");
  const db = createAdminClient();
  let query = db.from("coding_questions").select("id,title,category,difficulty,prompt,starter_code,course_id").eq("published", true).order("created_at", { ascending: true }).limit(500);
  if (category && category !== "all") query = query.eq("category", category);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data || [] });
}
