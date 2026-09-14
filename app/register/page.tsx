"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase";
import { LysbroIcon } from "@/app/components/LysbroLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) { setError("Adgangskoderne stemmer ikke overens."); return; }
    if (form.password.length < 8) { setError("Adgangskoden skal være mindst 8 tegn."); return; }
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });
    if (error) {
      setError(error.message === "User already registered" ? "Der findes allerede en konto med denne e-mail." : (typeof error.message === "string" ? error.message : "Der opstod en fejl. Prøv igen."));
      setIsLoading(false);
      return;
    }
    setConfirmed(true);
    setIsLoading(false);
  };

  const strength =
    form.password.length === 0 ? 0 :
    form.password.length < 6 ? 1 :
    form.password.length < 10 ? 2 : 3;

  const strengthLabel = ["", "Svag", "Okay", "Stærk"];
  const strengthColors = [
    ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)"],
    ["#ef4444", "rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)"],
    ["#f59e0b", "#f59e0b", "rgba(255,255,255,0.08)"],
    ["#22c55e", "#22c55e", "#22c55e"],
  ];
  const strengthTextColor = ["", "#f87171", "#fbbf24", "#4ade80"];

  return (
    <main className="flex min-h-screen" style={{ background: "#05070f" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center p-16 mesh-animated dot-grid">
        <div className="orb orb-blue animate-float" style={{ width: 500, height: 500, top: -100, left: -150, animationDelay: "0s" }} />
        <div className="orb orb-cyan animate-float" style={{ width: 300, height: 300, bottom: 0, right: -80, animationDelay: "3s" }} />

        <div className="relative z-10 max-w-md w-full">
          <Link href="/" className="mb-12 flex items-center gap-3 w-fit">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 24px rgba(59,130,246,0.5)" }}>
              <LysbroIcon className="h-6 w-6" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">Lysbro</span>
          </Link>

          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            Kom i gang på<br />
            <span className="gradient-text">30 sekunder</span>
          </h2>
          <p className="mb-10 leading-relaxed" style={{ color: "#94a3b8" }}>
            Ingen kreditkort påkrævet. Opret en konto og hold dit første møde i dag.
          </p>

          {/* Feature box */}
          <div className="glass rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: "#64748b" }}>Hvad er inkluderet — gratis</p>
            <div className="space-y-3.5">
              {[
                "2 møder pr. måned",
                "Op til 2 deltagere pr. møde",
                "End-to-end kryptering",
                "Europæisk hosting",
              ].map((f) => (
                <div key={f} className="flex items-center gap-3 text-sm" style={{ color: "#e2e8f0" }}>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ background: "rgba(6,182,212,0.15)" }}>
                    <svg className="h-3 w-3" style={{ color: "#06b6d4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-xs" style={{ color: "#475569" }}>Gratis-plan · Opgrader når du er klar · Ingen binding</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex w-full lg:w-[540px] shrink-0 flex-col items-center justify-center px-10 py-12" style={{ background: "#080b18", borderLeft: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-full max-w-sm">

          {confirmed && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="h-16 w-16 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <svg className="h-8 w-8" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black text-white">Bekræft din e-mail</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Vi har sendt en bekræftelsesmail til <span style={{ color: "#60a5fa" }}>{form.email}</span>. Klik på linket i mailen for at aktivere din konto.</p>
              <Link href="/login" className="mt-4 text-sm font-medium" style={{ color: "#6366f1" }}>Gå til login →</Link>
            </div>
          )}

          {!confirmed && (<>

          {/* Logo mobile */}
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-white">Lysbro</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white">Opret din konto</h1>
            <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
              Har du allerede en konto?{" "}
              <Link href="/login" className="font-semibold" style={{ color: "#60a5fa" }}>Log ind</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "#94a3b8" }}>Fulde navn</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="Anders Andersen"
                required
                className="input-dark"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "#94a3b8" }}>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="din@email.dk"
                required
                className="input-dark"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "#94a3b8" }}>Adgangskode</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Mindst 8 tegn"
                  required
                  className="input-dark pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition"
                  style={{ color: "#64748b" }}
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

              {/* Strength meter */}
              {form.password.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1.5 mb-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: strengthColors[strength][i] }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: strengthTextColor[strength] }}>
                      {strengthLabel[strength]}
                    </span>
                    <span className="text-xs" style={{ color: "#475569" }}>
                      {form.password.length} tegn
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: "#94a3b8" }}>Bekræft adgangskode</label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Gentag adgangskode"
                required
                className="input-dark"
                style={form.confirm.length > 0 ? {
                  borderColor: form.confirm === form.password ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
                } : {}}
              />
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

            <p className="text-xs" style={{ color: "#475569" }}>
              Ved at oprette en konto accepterer du vores{" "}
              <Link href="/terms" className="transition" style={{ color: "#60a5fa" }}>betingelser</Link>
              {" "}og{" "}
              <Link href="/terms" className="transition" style={{ color: "#60a5fa" }}>privatlivspolitik</Link>.
            </p>

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
              {isLoading ? "Opretter konto…" : "Opret konto gratis"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: "#334155" }}>
            Har du allerede en konto?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "#60a5fa" }}>
              Log ind →
            </Link>
          </p>
          </>)}
        </div>
      </div>
    </main>
  );
}
