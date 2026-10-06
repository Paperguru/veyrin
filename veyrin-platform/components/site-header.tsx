"use client";

import Link from "next/link";
import { ArrowUpRight, LogIn, LogOut, Menu, ShieldCheck, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VeyrinBrand } from "@/components/brand";

type AuthState = { signedIn: boolean; isAdmin: boolean; email?: string };

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [auth, setAuth] = useState<AuthState>({ signedIn: false, isAdmin: false });
  const menuRef = useRef<HTMLDivElement>(null);

  const refreshAuth = async () => {
    try {
      const response = await fetch("/api/auth", { cache: "no-store" });
      const data = await response.json();
      setAuth({ signedIn: Boolean(data.signedIn), isAdmin: Boolean(data.isAdmin), email: data.email });
    } catch {
      setAuth({ signedIn: false, isAdmin: false });
    }
  };

  useEffect(() => {
    refreshAuth();
    const sb = createClient();
    const { data: listener } = sb.auth.onAuthStateChange(() => refreshAuth());
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const closeOnOutside = (event: MouseEvent) => {
      if (open && menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const logout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    closeMenu();
    window.location.href = "/";
  };

  return (
    <header className="nav">
      <div className="container nav-inner" ref={menuRef}>
        <VeyrinBrand />

        <nav className="navlinks" aria-label="Main navigation">
          <Link href="/courses">Learning</Link>
          <Link href="/interview">Interview Lab</Link>
          <Link href="/coding">Python</Link>
          <Link href="/videos">Videos</Link>
          <Link href="/about">About</Link>
        </nav>

        <div className="navactions">
          {!auth.signedIn ? (
            <Link className="btn ghost login-nav" href="/login" onClick={closeMenu}><LogIn size={16} /> Login</Link>
          ) : (
            <>
              {auth.isAdmin && <Link className="btn ghost login-nav" href="/admin" onClick={closeMenu}><ShieldCheck size={16} /> Admin</Link>}
              <Link className="btn ghost login-nav" href="/dashboard" onClick={closeMenu}><UserRound size={16} /> Dashboard</Link>
              <button className="btn ghost logout-nav" onClick={logout}><LogOut size={16} /> Log out</button>
            </>
          )}
          <Link className="btn primary" href="/courses" onClick={closeMenu}>Start learning <ArrowUpRight size={15} /></Link>
          <button className="btn mobile-menu" onClick={() => setOpen(value => !value)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {open && (
          <div className="mobile-nav" role="menu">
            <Link href="/courses" onClick={closeMenu}>Learning</Link>
            <Link href="/interview" onClick={closeMenu}>Interview Lab</Link>
            <Link href="/coding" onClick={closeMenu}>Python</Link>
            <Link href="/videos" onClick={closeMenu}>Videos</Link>
            <Link href="/about" onClick={closeMenu}>About</Link>
            {!auth.signedIn && <Link href="/login" onClick={closeMenu} className="mobile-login">Login / Sign up</Link>}
            {auth.signedIn && <Link href="/dashboard" onClick={closeMenu}>Dashboard</Link>}
            {auth.signedIn && auth.isAdmin && <Link href="/admin" onClick={closeMenu}>Admin</Link>}
            {auth.signedIn && <button className="mobile-logout" onClick={logout}><LogOut size={16}/> Log out</button>}
          </div>
        )}
      </div>
    </header>
  );
}
