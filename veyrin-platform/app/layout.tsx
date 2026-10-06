import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
export const metadata: Metadata={metadataBase:new URL("https://veyrin.in"),title:"Veyrin — Build the career companies hire for",description:"Practical AI, GenAI, Agentic AI, ML and Python interview preparation for ambitious engineers.",keywords:["AI Engineer interview preparation","GenAI interview","Agentic AI","Data Scientist","Python coding"]};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteHeader/>{children}<SiteFooter/></body></html>}
