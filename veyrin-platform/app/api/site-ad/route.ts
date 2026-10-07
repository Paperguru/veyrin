import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = createAdminClient();
  const { data: ad, error } = await db.from("advertisements").select("id,title,text,destination_url,image_path,priority").eq("active", true).order("priority", { ascending: true }).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error || !ad) return NextResponse.json({ ad: null }, { headers: { "Cache-Control": "no-store" } });
  let image_url = "";
  if (ad.image_path) image_url = db.storage.from("veyrin-public").getPublicUrl(ad.image_path).data.publicUrl;
  return NextResponse.json({ ad: { ...ad, image_url } }, { headers: { "Cache-Control": "no-store" } });
}
