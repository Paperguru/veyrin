import Link from "next/link";
import { LockKeyhole, Download, ArrowLeft, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import PurchaseButton from "@/components/purchase-button";
export default async function MaterialPage({params}:{params:Promise<{slug:string}>}){
 const{slug}=await params; const db=createAdminClient();
 const{data:m}=await db.from("materials").select("*,course:courses!materials_course_id_fkey(id,title,slug,price),upgrade_course:courses!materials_upgrade_course_id_fkey(id,title,slug,price)").eq("slug",slug).eq("published",true).maybeSingle();
 if(!m)return <main className="page"><div className="container"><div className="error">Material not found.</div></div></main>;
 const sb=await createClient(); const{data:{user}}=await sb.auth.getUser();
 let unlocked=m.access_type==="free";
 if(m.access_type==="paid"&&m.course_id&&user){const{data:e}=await db.from("enrollments").select("status").eq("user_id",user.id).eq("course_id",m.course_id).maybeSingle();unlocked=e?.status==="active";}
 const upgrade=m.upgrade_course||m.course;
 return <main className="page"><div className="container"><Link href="/materials" style={{color:"var(--muted)",display:"inline-flex",gap:7,alignItems:"center"}}><ArrowLeft size={15}/> Interview material</Link><div style={{maxWidth:900,marginTop:25}}><span className="eyebrow">{m.access_type==="paid"?<><LockKeyhole size={13}/> Premium</>:<><FileText size={13}/> Free material</>}</span><h1 className="page-title" style={{marginTop:15}}>{m.title}</h1><p className="sub" style={{fontSize:18}}>{m.description}</p>{!unlocked?<div className="card" style={{marginTop:25}}><h2>This material is part of a paid preparation path.</h2><p className="sub">Login and purchase access to unlock the complete material.</p>{upgrade?<PurchaseButton slug={upgrade.slug} price={Number(upgrade.price)} title={upgrade.title}/>:<Link className="btn primary" href={`/login?next=/materials/${m.slug}`}>Login to continue</Link>}</div>:<><div className="card" style={{marginTop:25}}>{m.body&&<div style={{whiteSpace:"pre-wrap",lineHeight:1.85,color:"var(--text)"}}>{m.body}</div>}{m.file_name&&<div style={{display:"flex",gap:10,alignItems:"center",marginTop:m.body?25:0}}><a className="btn primary" href={`/api/materials/${m.slug}/download`}><Download size={16}/> Download {m.file_name}</a></div>}{!m.body&&!m.file_name&&<div className="empty">This material has no published content yet.</div>}</div>{m.access_type==="free"&&upgrade&&<div className="band" style={{marginTop:20}}><div><span className="eyebrow">Go deeper</span><h2 style={{fontSize:25,margin:"9px 0 4px"}}>{upgrade.title}</h2><p style={{margin:0,color:"var(--muted)"}}>Get the complete paid interview preparation path.</p></div><PurchaseButton slug={upgrade.slug} price={Number(upgrade.price)} title={upgrade.title}/></div>}</>}</div></div></main>;
}
