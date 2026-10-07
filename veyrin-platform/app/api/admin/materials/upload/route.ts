import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function auth() {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const ok = user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === "admin";
  return ok ? user : null;
}
export async function POST(req: Request) {
  const user = await auth(); if (!user) return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  const b = await req.json().catch(() => ({}));
  const filename = String(b.filename || "").trim(); const size = Number(b.size || 0);
  if (!filename) return NextResponse.json({ error: "Filename is required" }, { status: 400 });
  if (!Number.isFinite(size) || size <= 0 || size > 50 * 1024 * 1024) return NextResponse.json({ error: "File must be between 1 byte and 50 MB." }, { status: 400 });
  const ext = filename.toLowerCase().split(".").pop();
  if (!ext || !["pdf","ppt","pptx","doc","docx"].includes(ext)) return NextResponse.json({ error: "Only PDF, PPT, PPTX, DOC or DOCX files are allowed." }, { status: 400 });
  const safe = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 150);
  const path = `materials/${user.id}/${Date.now()}-${safe}`;
  const { data, error } = await createAdminClient().storage.from("veyrin-files").createSignedUploadUrl(path);
  if (error || !data?.token) return NextResponse.json({ error: error?.message || "Could not prepare upload." }, { status: 500 });
  return NextResponse.json({ path, token: data.token });
}
