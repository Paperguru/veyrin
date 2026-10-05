import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { genaiBankQuestions } from "@/lib/genai-bank";

export default async function GenAIIndiaBank() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?next=/interview/genai-india");

  const db = createAdminClient();
  const { data: course } = await db.from("courses").select("id,title,price").eq("slug", "genai-engineer-interview-bank-india").single();
  if (!course) return <main className="page"><div className="container"><div className="error">Question bank is not configured yet.</div></div></main>;
  const { data: enrollment } = await db.from("enrollments").select("status").eq("user_id", user.id).eq("course_id", course.id).maybeSingle();
  if (enrollment?.status !== "active") return <main className="page"><div className="container"><div className="card" style={{maxWidth:760,margin:"0 auto"}}><span className="eyebrow">Premium interview bank</span><h1 className="page-title">GenAI Engineer Interview Bank — India</h1><p className="sub">This question bank is available after purchase for ₹{Number(course.price).toLocaleString("en-IN")}.</p><Link className="btn primary" href="/courses/genai-engineer-interview-bank-india">Get access</Link></div></div></main>;

  const { data: questions } = await db.from("questions").select("id,category,difficulty,question,answer,explanation,tags").eq("course_id", course.id).order("created_at", { ascending: true });
  const visibleQuestions = questions?.length ? questions : genaiBankQuestions;
  return <main className="page"><div className="container"><span className="eyebrow">Your premium library</span><h1 className="page-title">GenAI Engineer Interview Bank — India</h1><p className="sub">Practice the technical depth expected across GenAI Engineer interviews: RAG, LLMs, agents, evaluation, Python and production system design.</p><div style={{display:"grid",gap:14,marginTop:28}}>{visibleQuestions.map((q:any,i:number)=><article className="card" key={q.id}><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}><span className="pill">{q.category}</span><span className="pill">{q.difficulty}</span></div><h2 style={{fontSize:20,lineHeight:1.35}}>Q{i+1}. {q.question}</h2>{q.answer&&<div style={{marginTop:15}}><strong>Answer framework</strong><p className="sub" style={{marginTop:7}}>{q.answer}</p></div>}{q.explanation&&<div style={{marginTop:12}}><strong>Why it matters</strong><p className="sub" style={{marginTop:7}}>{q.explanation}</p></div>}</article>)}</div></div></main>;
}
