"use client";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { VeyrinBrand } from "@/components/brand";

function safeNext(value:string|null){if(!value||!value.startsWith("/")||value.startsWith("//"))return "/dashboard";return value}
export default function ResetPassword(){
 const[password,setPassword]=useState("");const[confirm,setConfirm]=useState("");const[msg,setMsg]=useState("");const[busy,setBusy]=useState(false);
 const submit=async(e:FormEvent)=>{e.preventDefault();setMsg("");if(password!==confirm)return setMsg("Passwords do not match.");if(password.length<6)return setMsg("Password must be at least 6 characters.");setBusy(true);try{const sb=createClient();const{error}=await sb.auth.updateUser({password});if(error)throw error;setMsg("Password updated. You can continue to Veyrin.");const next=safeNext(new URLSearchParams(window.location.search).get("next"));window.setTimeout(()=>{window.location.href=next},700)}catch(e){setMsg(e instanceof Error?e.message:"Could not update password.")}finally{setBusy(false)}};
 return <main className="page auth-page"><div className="container auth-shell"><div className="auth-card card"><div className="auth-brand"><VeyrinBrand link={false}/></div><span className="eyebrow">Password reset</span><h1 className="page-title auth-title">Choose a new password.</h1><p className="sub">Create a new password for your Veyrin account. Passwords are case-sensitive.</p><form onSubmit={submit} className="auth-form"><div className="field"><label>New password</label><input className="input" type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required/></div><div className="field"><label>Confirm password</label><input className="input" type="password" minLength={6} value={confirm} onChange={e=>setConfirm(e.target.value)} required/></div><button className="btn primary auth-submit" disabled={busy}><KeyRound size={17}/> {busy?"Saving…":"Update password"} {!busy&&<ArrowRight size={16}/>}</button></form>{msg&&<div className={msg.startsWith("Password updated")?"success":"error"} style={{marginTop:15}}>{msg}</div>}</div><Link href="/login" className="back-link">← Back to sign in</Link></div></main>
}
