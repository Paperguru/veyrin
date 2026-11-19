import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(){const db=createAdminClient();const{data,error}=await db.from("materials").select("id,title,slug,description,content_type,access_type,body,file_name,course_id,upgrade_course_id,featured,created_at").eq("published",true).order("featured",{ascending:false}).order("created_at",{ascending:false});if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({materials:data||[]});}
