import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { courses as demoCourses } from "@/lib/demo-data";
export async function GET(){
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({courses:demoCourses});
  try{const sb=await createClient();const {data,error}=await sb.from("courses").select("*").eq("published",true).order("featured",{ascending:false}).order("created_at",{ascending:false});if(error||!data?.length)return NextResponse.json({courses:demoCourses});return NextResponse.json({courses:data});}
  catch{return NextResponse.json({courses:demoCourses});}
}
