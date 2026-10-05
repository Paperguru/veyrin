import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { VeyrinBrand } from "@/components/brand";

export function SiteFooter(){
  return <footer className="footer"><div className="container"><div className="footer-grid">
    <div><VeyrinBrand/><p style={{maxWidth:400,lineHeight:1.7}}>Practical preparation for the AI workforce. Learn the concepts, practise the questions, and build the confidence to perform in real interviews.</p></div>
    <div><h4>Learn</h4><Link href="/courses">Learning</Link><Link href="/interview">Interview Lab</Link><Link href="/coding">Python</Link></div>
    <div><h4>Company</h4><Link href="/about">About Veyrin</Link><Link href="/login">Login / Sign up</Link></div>
    <div><h4>Social</h4><a href={process.env.NEXT_PUBLIC_YOUTUBE_URL||"https://youtube.com"} target="_blank" rel="noreferrer"><Youtube size={17}/> YouTube</a><a href={process.env.NEXT_PUBLIC_LINKEDIN_URL||"https://linkedin.com"} target="_blank" rel="noreferrer"><Linkedin size={17}/> LinkedIn</a><a href={process.env.NEXT_PUBLIC_INSTAGRAM_URL||"https://instagram.com"} target="_blank" rel="noreferrer"><Instagram size={17}/> Instagram</a></div>
  </div><div className="brand-note">© {new Date().getFullYear()} Veyrin. All rights reserved. <strong>This is a brand of VB Mannschaft.</strong></div></div></footer>
}
