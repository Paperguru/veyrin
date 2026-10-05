"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { VeyrinBrand } from "@/components/brand";

function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default function Login() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);

  const submit=async(e:FormEvent)=>{
    e.preventDefault(); setMsg(""); setBusy(true);
    try {
      const sb=createClient();
      const result=mode==="login"
        ? await sb.auth.signInWithPassword({email,password})
        : await sb.auth.signUp({email,password});
      if(result.error) throw result.error;
      if(mode==="signup"){
        setMsg("Account created. Check your email if confirmation is enabled, then sign in.");
        setMode("login");
        return;
      }
      const check=await fetch("/api/auth",{cache:"no-store"});
      const data=await check.json();
      const next=safeNext(new URLSearchParams(window.location.search).get("next"));
      window.location.href=data.isAdmin?"/admin":(next || "/dashboard");
    } catch(err) {
      setMsg(err instanceof Error?err.message:"Unable to complete authentication.");
    } finally { setBusy(false); }
  };

  return <main className="page auth-page"><div className="container auth-shell"><div className="auth-card card"><div className="auth-brand"><VeyrinBrand link={false}/></div><span className="eyebrow">{mode==="login"?"Welcome back":"Create your account"}</span><h1 className="page-title auth-title">{mode==="login"?"Sign in to Veyrin.":"Join Veyrin."}</h1><p className="sub">{mode==="login"?"Access your learning, interview practice and purchased content.":"One account for learning, interview practice and your dashboard."}</p><form onSubmit={submit} className="auth-form"><div className="field"><label>Email address</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required/></div><div className="field"><label>Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimum 6 characters" autoComplete={mode==="login"?"current-password":"new-password"} required minLength={6}/></div><button className="btn primary auth-submit" type="submit" disabled={busy}>{mode==="login"?<LogIn size={17}/>:<UserPlus size={17}/>} {busy?"Please wait...":mode==="login"?"Sign in":"Create account"} {!busy&&<ArrowRight size={16}/>}</button></form>{msg&&<div className={msg.startsWith("Account")?"success":"error"} style={{marginTop:15}}>{msg}</div>}<button className="auth-switch" onClick={()=>{setMode(mode==="login"?"signup":"login");setMsg("")}}>{mode==="login"?"New to Veyrin? Create an account":"Already have an account? Sign in"}</button>{mode==="login"&&<p className="auth-note">Your account automatically receives the right access. Eligible admin accounts are sent to the Admin dashboard.</p>}</div><Link href="/" className="back-link">← Back to Veyrin</Link></div></main>;
}
