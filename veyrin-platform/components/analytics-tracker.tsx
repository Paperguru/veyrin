"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export default function AnalyticsTracker(){const pathname=usePathname();useEffect(()=>{if(!pathname||pathname.startsWith("/admin")||pathname.startsWith("/auth"))return;fetch("/api/analytics/track",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event_type:"page_view",path:pathname}),keepalive:true}).catch(()=>{});},[pathname]);return null;}
