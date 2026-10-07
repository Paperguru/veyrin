"use client";
import { useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, RotateCcw, Sparkles } from "lucide-react";

type Q={id:string;category?:string;role?:string;difficulty?:string;question:string;course_id?:string|null};
export default function InterviewPractice({
  questions,
  title = "Interview Practice",
  subtitle = "Answer first. Submit your response. Then compare it with the model answer and continue.",
  premium = false,
}: {
  questions: Q[];
  title?: string;
  subtitle?: string;
  premium?: boolean;
}) {
 const categories=useMemo(()=>["All",...Array.from(new Set(questions.map(q=>q.category||"General").filter(Boolean)))],[questions]);
 const[category,setCategory]=useState("All");const[index,setIndex]=useState(0);const[draft,setDraft]=useState("");const[answer,setAnswer]=useState<string|null>(null);const[busy,setBusy]=useState(false);const[error,setError]=useState("");
 const filtered=useMemo(()=>category==="All"?questions:questions.filter(q=>(q.category||"General")===category),[questions,category]);
 const q=filtered[index];
 const changeCategory=(value:string)=>{setCategory(value);setIndex(0);setDraft("");setAnswer(null);setError("")};
 if(!q)return <main className="page"><div className="container"><div className="empty">No interview questions are available for this category yet.</div></div></main>;
 const submit=async()=>{if(!draft.trim())return setError("Write your answer before submitting.");setBusy(true);setError("");try{const r=await fetch(`/api/interview/questions/${q.id}/answer`,{cache:"no-store"});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not load answer");setAnswer(j.answer||"No answer added yet.")}catch(e){setError(e instanceof Error?e.message:"Could not load answer")}finally{setBusy(false)}};
 const next=()=>{setIndex(index>=filtered.length-1?0:index+1);setDraft("");setAnswer(null);setError("")};
 return <main className="page"><div className="container"><span className="eyebrow"><Sparkles size={13}/> Interview Lab</span><h1 className="page-title">{title}</h1><p className="sub">{subtitle}</p><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:22}}>{categories.map(c=><button key={c} className={`btn ${category===c?"primary":""}`} onClick={()=>changeCategory(c)}>{c}</button>)}</div><div style={{display:"grid",gridTemplateColumns:"1fr .32fr",gap:18,marginTop:24}}><section className="card"><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span className="pill">{q.category||"Interview"}</span>{q.difficulty&&<span className="pill">{q.difficulty}</span>}</div><span style={{color:"var(--muted)",fontSize:13}}>Question {index+1} of {filtered.length}</span></div><h2 style={{fontSize:30,lineHeight:1.3,marginTop:25}}>{q.question}</h2><div className="field" style={{marginTop:22}}><label>Your answer</label><textarea className="input textarea" style={{minHeight:190}} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Write how you would answer in a real interview..." disabled={Boolean(answer)}/></div>{error&&<div className="error" style={{marginTop:12}}>{error}</div>}{answer&&<div className="success" style={{marginTop:20}}><strong>Expected answer</strong><p style={{lineHeight:1.8,whiteSpace:"pre-wrap",marginBottom:0}}>{answer}</p></div>}<div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}>{!answer?<button className="btn primary" onClick={submit} disabled={busy}>{busy?<Loader2 size={16} className="spin"/>:<Check size={16}/>} {busy?"Loading answer…":"Submit answer"}</button>:<button className="btn primary" onClick={next}><ChevronRight size={16}/> Next question</button>}<button className="btn" onClick={()=>{setDraft("");setAnswer(null);setError("")}}><RotateCcw size={16}/> Reset</button></div></section><aside className="card"><h3>Practice session</h3><p style={{color:"var(--muted)",lineHeight:1.7}}>No marks. No score. Practise structuring your answer before seeing the expected answer.</p><div style={{marginTop:20}}><strong>{index+1}</strong> / {filtered.length}</div><div style={{height:7,background:"#152434",borderRadius:10,marginTop:10}}><div style={{height:"100%",width:`${((index+1)/filtered.length)*100}%`,background:"linear-gradient(90deg,var(--accent),var(--accent2))",borderRadius:10}}/></div><div className="notice" style={{marginTop:20}}>Category: <strong>{category}</strong></div></aside></div></div></main>
}
