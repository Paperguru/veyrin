import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VeyrinBrand } from "@/components/brand";
import ProfileEditor from "@/components/profile-editor";

export default async function ProfilePage(){
 const sb=await createClient();const{data:{user}}=await sb.auth.getUser();if(!user)redirect("/login?next=/profile");
 const db=createAdminClient();const{data:enrollments}=await db.from("enrollments").select("course_id,progress,status").eq("user_id",user.id).eq("status","active");const ids=(enrollments||[]).map(e=>e.course_id);const{data:courses}=ids.length?await db.from("courses").select("id,slug,title,role,duration,price,cover_emoji").in("id",ids):{data:[]};
 const displayName=user.user_metadata?.full_name||user.email?.split("@")[0]||"Veyrin learner";
 return <main className="page"><div className="container" style={{maxWidth:900}}><Link href="/dashboard" className="back-link">← Dashboard</Link><div className="card" style={{marginTop:18}}><VeyrinBrand link={false}/><div style={{display:"flex",gap:14,alignItems:"center",marginTop:28}}><div className="iconbox" style={{margin:0}}><UserRound/></div><div><span className="eyebrow">Your profile</span><h1 style={{margin:"8px 0 0"}}>{displayName}</h1><p className="sub" style={{marginTop:4}}>{user.email}</p></div></div></div><ProfileEditor initialName={displayName}/><div className="card" style={{marginTop:18}}><span className="eyebrow">Purchased courses</span><h2 style={{margin:"12px 0 18px"}}>Your library</h2>{courses?.length?<div className="course-grid">{courses.map(c=><article className="card" key={c.id}><div style={{fontSize:30}}>{c.cover_emoji}</div><h3>{c.title}</h3><p>{c.role} · {c.duration}</p><Link className="btn primary" href={c.slug==="genai-engineer-interview-bank-india"?"/interview/genai-india":`/courses/${c.slug}`} style={{marginTop:14}}>{c.slug==="genai-engineer-interview-bank-india"?"Open question bank":"Open course"}<ArrowRight size={15}/></Link></article>)}</div>:<div className="empty">No purchased courses yet.</div>}</div></div></main>
}
