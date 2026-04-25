"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Forkert e-mail eller adgangskode.");
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="flex min-h-screen" style={{ background: "#05070f" }}>

      {/* ── Left decorative panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center p-16 mesh-animated dot-grid">
        {/* Animated orbs */}
        <div className="orb orb-blue animate-float" style={{ width: 500, height: 500, top: -150, left: -150, animationDelay: "0s" }} />
        <div className="orb orb-cyan animate-float" style={{ width: 350, height: 350, bottom: -100, right: -80, animationDelay: "2.5s" }} />
        <div className="orb orb-purple animate-float" style={{ width: 250, height: 250, top: "50%", left: "60%", animationDelay: "1.5s" }} />

        <div className="relative z-10 max-w-md w-full">
          {/* Logo */}
          <Link href="/" className="mb-12 flex items-center gap-3 w-fit">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 24px rgba(59,130,246,0.5)" }}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-white">Agora</span>
          </Link>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Europæiske videomøder.<br />
            <span className="gradient-text">På dine præmisser.</span>
          </h2>
          <p className="mb-10 leading-relaxed" style={{ color: "#94a3b8" }}>
            Sikre videomøder hostet udelukkende på europæisk infrastruktur. GDPR-compliant fra dag ét.
          </p>

          <div className="space-y-3">
            {[
              { icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              ), color: "text-blue-400", bg: "rgba(59,130,246,0.12)", text: "End-to-end krypteret" },
              { icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" /></svg>
              ), color: "text-cyan-400", bg: "rgba(6,182,212,0.12)", text: "Servere kun i Europa" },
              { icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              ), color: "text-violet-400", bg: "rgba(139,92,246,0.12)", text: "GDPR-compliant" },
              { icon: (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              ), color: "text-amber-400", bg: "rgba(245,158,11,0.12)", text: "Ingen installation — kør fra browser" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3.5 glass rounded-xl px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`} style={{ background: item.bg }}>
                  {item.icon}
                </div>
                <span className="text-sm font-medium" style={{ color: "#e2e8f0" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex w-full lg:w-[500px] shrink-0 flex-col items-center justify-center px-10 py-12" style={{ background: "#080b18", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-full max-w-sm">

          {/* Logo (mobile) */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Agora</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Velkommen tilbage</h1>
            <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
              Har du ikke en konto?{" "}
              <Link href="/register" className="font-semibold" style={{ color: "#60a5fa" }}>Opret gratis</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium" style={{ color: "#94a3b8" }}>E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@email.dk"
                required
                className="input-dark"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium" style={{ color: "#94a3b8" }}>Adgangskode</label>
                <Link href="/forgot-password" className="text-xs font-medium transition" style={{ color: "#60a5fa" }}>
                  Glemt adgangskode?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-dark pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                  style={{ color: "#64748b" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3.5" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <svg className="h-4 w-4 shrink-0" style={{ color: "#f87171" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm" style={{ color: "#fca5a5" }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gradient w-full flex items-center justify-center gap-2 py-3.5"
              style={{ opacity: isLoading ? 0.75 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
            >
              {isLoading && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {isLoading ? "Logger ind…" : "Log ind"}
            </button>
          </form>

          {/* Trust badges */}
          <div className="mt-8 grid grid-cols-3 gap-2">
            {[
              { label: "E2E krypteret", icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              )},
              { label: "EU hosting", icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              )},
              { label: "GDPR", icon: (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
              )},
            ].map((t) => (
              <div key={t.label} className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ color: "#60a5fa" }}>{t.icon}</span>
                <p className="text-xs font-medium" style={{ color: "#64748b" }}>{t.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs" style={{ color: "#334155" }}>
            Ingen konto?{" "}
            <Link href="/register" className="font-semibold transition" style={{ color: "#60a5fa" }}>
              Opret konto gratis →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
