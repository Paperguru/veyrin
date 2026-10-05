import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function admin() {
  const sb = await createClient(); const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  if (!(user.email === process.env.ADMIN_EMAIL || user.user_metadata?.role === "admin")) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not configured" }, { status: 400 }) };
  return { user };
}
export async function GET() { const a=await admin(); if("error" in a)return a.error; const {data,error}=await createAdminClient().from("questions").select("*").order("created_at",{ascending:false}).limit(100); if(error)return NextResponse.json({error:error.message},{status:500}); return NextResponse.json({questions:data}); }
export async function POST(req:Request) { const a=await admin(); if("error" in a)return a.error; try { const b=await req.json(); const {data,error}=await createAdminClient().from("questions").insert({course_id:b.course_id||null,category:b.category||"GenAI",role:b.role||"GenAI Engineer",difficulty:b.difficulty||"Hard",question:b.question,answer:b.answer||"",explanation:b.explanation||"",tags:Array.isArray(b.tags)?b.tags:[]}).select().single(); if(error)return NextResponse.json({error:error.message},{status:400}); return NextResponse.json({question:data}); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Invalid request"},{status:400});} }
