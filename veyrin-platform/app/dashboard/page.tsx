import Link from "next/link";
import { ArrowRight, BookOpen, Code2, Flame, Target, UserRound } from "lucide-react";
import { courses as demoCourses } from "@/lib/demo-data";
import { VeyrinBrand } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function Dashboard(){
  const sb=await createClient();
  const {data:{user}}=await sb.auth.getUser();
  if(!user) return <main className="page"><div className="container"><div className="card"><h1 className="page-title">Please sign in.</h1><Link className="btn primary" href="/login?next=/dashboard">Sign in</Link></div></div></main>;

  const db=createAdminClient();
  const {data:enrollments}=await db.from("enrollments").select("id,status,progress,course_id,created_at").eq("user_id",user.id).eq("status","active").order("created_at",{ascending:false});
  const ids=(enrollments||[]).map(e=>e.course_id);
  const {data:purchasedCourses}=ids.length?await db.from("courses").select("id,slug,title,description,role,level,duration,price,cover_emoji,published").in("id",ids):{data:[]};
  const purchased=(purchasedCourses||[]).map(c=>({...c, progress:enrollments?.find(e=>e.course_id===c.id)?.progress||0}));
  const name=user.user_metadata?.full_name||user.email?.split("@")[0]||"there";

  return <main className="page"><div className="container"><div className="dashboard"><aside className="sidebar card"><div style={{marginBottom:18}}><VeyrinBrand/></div><div className="dashboard-label">Dashboard</div><Link className="side-link active" href="/dashboard">Overview</Link><Link className="side-link" href="/profile"><UserRound size={16}/> Profile</Link><Link className="side-link" href="/courses">Learning paths</Link><Link className="side-link" href="/interview">Interview Lab</Link><Link className="side-link" href="/coding">Coding Lab</Link></aside><section><span className="eyebrow">Your workspace</span><h1 className="page-title">Welcome, {name}.</h1><div className="stats" style={{marginTop:22}}><div className="card stat"><strong>{purchased.length}</strong><span>courses owned</span></div><div className="card stat"><strong>{purchased.reduce((n,c)=>n+(c.progress||0),0)}%</strong><span>total progress</span></div><div className="card stat"><strong>0</strong><span>questions completed</span></div><div className="card stat"><strong>0</strong><span>coding streak</span></div></div>

  <div className="card" style={{marginTop:18}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><span className="eyebrow">Purchased courses</span><h2 style={{margin:"12px 0 0"}}>Your library</h2></div><BookOpen/></div>{purchased.length? <div className="course-grid" style={{marginTop:18}}>{purchased.map(c=><article className="card" key={c.id}><div style={{fontSize:32}}>{c.cover_emoji}</div><strong>{c.title}</strong><p style={{color:"var(--muted)",fontSize:13,marginTop:7}}>{c.role} · {c.duration}</p><div style={{marginTop:14,height:6,borderRadius:999,background:"rgba(255,255,255,.08)"}}><div style={{height:"100%",width:`${Math.min(100,Math.max(0,c.progress))}%`,borderRadius:999,background:"var(--accent)"}}/></div><p style={{fontSize:12,marginTop:7}}>{c.progress||0}% complete</p><Link className="btn primary" href={c.slug==="genai-engineer-interview-bank-india"?"/interview/genai-india":`/courses/${c.slug}`} style={{marginTop:12}}>{c.slug==="genai-engineer-interview-bank-india"?"Open question bank":"Open course"}<ArrowRight size={15}/></Link></article>)}</div> : <div className="empty" style={{marginTop:18}}>You have not purchased any courses yet. <Link href="/courses" style={{color:"var(--accent)"}}>Browse the learning catalog.</Link></div>}</div>

  <div className="grid" style={{marginTop:18}}><div className="card"><Target/><h3>Interview readiness</h3><p>Practise technical and scenario questions.</p><Link className="btn" href="/interview" style={{display:"inline-flex",marginTop:15}}>Start practice</Link></div><div className="card"><Code2/><h3>Python reps</h3><p>Build the coding muscle expected in AI roles.</p><Link className="btn" href="/coding" style={{display:"inline-flex",marginTop:15}}>Open coding lab</Link></div><div className="card"><Flame/><h3>Keep learning</h3><p>Explore more role-focused paths when you are ready.</p><Link className="btn" href="/courses" style={{display:"inline-flex",marginTop:15}}>Browse courses</Link></div></div>
  </section></div></div></main>
}
