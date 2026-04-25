"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/components/AppLayout";
import { MEETING_TEMPLATES } from "@/app/lib/data";
import { createClient } from "@/app/lib/supabase";

export default function NewMeetingPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", date: "", time: "", duration: "60", description: "", invites: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const applyTemplate = (t: typeof MEETING_TEMPLATES[0]) => {
    setForm((prev) => ({ ...prev, title: t.title, time: t.time, duration: t.duration, description: t.description, invites: t.invites }));
    setAppliedTemplate(t.label);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("meetings").insert({
      user_id: user?.id,
      title: form.title,
      date: form.date,
      time: form.time,
      duration: form.duration ? `${form.duration} min` : null,
      description: form.description || null,
    });
    setIsLoading(false);
    if (error) { alert("Fejl: " + error.message); return; }
    setSent(true);
    setTimeout(() => router.push("/meetings"), 2000);
  };

  return (
    <AppLayout activeHref="/meetings">
      <header className="sticky top-0 z-30 flex h-16 items-center px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/meetings" className="flex items-center gap-2 text-sm font-medium transition mr-6" style={{ color: "#64748b" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#64748b")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Tilbage
        </Link>
        <div>
          <h1 className="text-base font-semibold text-white">Planlæg nyt møde</h1>
          <p className="text-xs" style={{ color: "#475569" }}>Udfyld detaljerne og send invitationer</p>
        </div>
      </header>

      <main className="p-8">
        <div className="max-w-2xl mx-auto">

          {/* Templates */}
          {!sent && (
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#475569" }}>Skabeloner</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MEETING_TEMPLATES.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="flex flex-col items-start gap-1.5 rounded-xl p-3 text-left transition-all"
                    style={appliedTemplate === t.label ? {
                      background: "rgba(59,130,246,0.15)",
                      border: "1px solid rgba(59,130,246,0.35)",
                    } : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={(e) => { if (appliedTemplate !== t.label) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { if (appliedTemplate !== t.label) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-xs font-semibold text-white leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
              {appliedTemplate && (
                <p className="mt-2 text-xs animate-fade-in" style={{ color: "#60a5fa" }}>
                  Skabelon &ldquo;{appliedTemplate}&rdquo; anvendt — tilpas detaljerne nedenfor
                </p>
              )}
            </div>
          )}

          {sent ? (
            <div className="animate-fade-in glass rounded-2xl p-12 text-center" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
              <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(34,197,94,0.15)" }}>
                <svg className="h-8 w-8" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-white mb-2">Mødet er oprettet!</p>
              <p className="text-sm" style={{ color: "#64748b" }}>Invitationer sendt til deltagerne. Sender dig videre…</p>
              <div className="mt-6 flex justify-center">
                <div className="h-1 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-1 rounded-full animate-pulse" style={{ width: "60%", background: "linear-gradient(90deg, #3b82f6, #06b6d4)" }} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Meeting details */}
              <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.15)" }}>
                    <svg className="h-4 w-4" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  </div>
                  <h2 className="text-sm font-semibold text-white">Mødeoplysninger</h2>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Mødetitel</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={set("title")}
                    placeholder="f.eks. Ugentligt team-møde"
                    required
                    className="input-dark"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Dato</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={set("date")}
                      required
                      className="input-dark"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Tidspunkt</label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={set("time")}
                      required
                      className="input-dark"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Varighed</label>
                  <select value={form.duration} onChange={set("duration")} className="input-dark select">
                    <option value="30">30 minutter</option>
                    <option value="60">1 time</option>
                    <option value="90">1,5 time</option>
                    <option value="120">2 timer</option>
                    <option value="180">3 timer</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>
                    Beskrivelse <span className="normal-case font-normal" style={{ color: "#334155" }}>(valgfri)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={set("description")}
                    placeholder="Hvad skal mødet handle om?"
                    rows={3}
                    className="input-dark resize-none"
                  />
                </div>
              </div>

              {/* Invites */}
              <div className="glass rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
                    <svg className="h-4 w-4" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                  </div>
                  <h2 className="text-sm font-semibold text-white">Invitationer</h2>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>E-mail adresser</label>
                  <textarea
                    value={form.invites}
                    onChange={set("invites")}
                    placeholder={"person1@firma.dk\nperson2@firma.dk"}
                    rows={4}
                    className="input-dark resize-none"
                    style={{ fontFamily: "ui-monospace, 'Cascadia Code', monospace", fontSize: "0.8125rem" }}
                  />
                  <p className="mt-2 text-xs" style={{ color: "#334155" }}>
                    Én e-mail per linje. Deltagerne modtager en invitation med mødelink og RSVP-mulighed.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gradient flex flex-1 items-center justify-center gap-2 py-3.5"
                  style={{ opacity: isLoading ? 0.75 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
                >
                  {isLoading && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                  {isLoading ? "Opretter møde…" : "Opret møde og send invitationer"}
                </button>
                <Link href="/meetings" className="btn-ghost flex items-center px-6 py-3.5 rounded-xl text-sm font-semibold">
                  Annuller
                </Link>
              </div>
            </form>
          )}

        </div>
      </main>
    </AppLayout>
  );
}
