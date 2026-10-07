"use client";
import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

type Ad={title:string;text:string;destination_url:string;image_url?:string};
export default function SiteAd(){
 const[ad,setAd]=useState<Ad|null>(null);
 useEffect(()=>{let alive=true;fetch("/api/site-ad",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(j=>{if(alive)setAd(j?.ad||null)}).catch(()=>{});return()=>{alive=false}},[]);
 if(!ad)return null;
 return <a className="site-ad" href={ad.destination_url} target="_blank" rel="noreferrer"><div className="site-ad-label">Sponsored</div>{ad.image_url&&<img src={ad.image_url} alt={ad.title} className="site-ad-image"/>}<div className="site-ad-body"><strong>{ad.title}</strong>{ad.text&&<span>{ad.text}</span>}<span className="site-ad-link">Visit <ExternalLink size={12}/></span></div></a>
}
