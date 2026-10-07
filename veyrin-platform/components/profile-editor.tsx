"use client";
import { useState } from "react";
import { Save } from "lucide-react";

export default function ProfileEditor({initialName}:{initialName:string}){
 const[name,setName]=useState(initialName);const[busy,setBusy]=useState(false);const[msg,setMsg]=useState("");
 const save=async()=>{setBusy(true);setMsg("");try{const r=await fetch("/api/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({full_name:name})});const j=await r.json();if(!r.ok)throw Error(j.error||"Could not update profile");setName(j.full_name);setMsg("Profile name updated.");window.setTimeout(()=>window.location.reload(),400)}catch(e){setMsg(e instanceof Error?e.message:"Could not update profile")}finally{setBusy(false)}};
 return <div className="card" style={{marginTop:18}}><span className="eyebrow">Profile settings</span><h2 style={{margin:"12px 0 8px"}}>Your name</h2><p className="sub">Change the name shown across your Veyrin account.</p><div className="field" style={{marginTop:16}}><label>Full name</label><input className="input" value={name} onChange={e=>setName(e.target.value)} maxLength={80}/></div><button className="btn primary" style={{marginTop:14}} disabled={busy||name.trim().length<2} onClick={save}><Save size={15}/> {busy?"Saving…":"Save name"}</button>{msg&&<div className={msg.endsWith("updated.")?"success":"error"} style={{marginTop:12}}>{msg}</div>}</div>
}
