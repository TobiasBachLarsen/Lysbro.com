"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/components/AppLayout";
import { PLANS } from "@/app/lib/data";
import { createClient } from "@/app/lib/supabase";
import type { PlanId } from "@/app/types";

const STATS = [
  { label: "Møder denne måned",  value: "månedlig",  iconBg: "rgba(59,130,246,0.15)",  iconColor: "#60a5fa", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg> },
  { label: "Kommende møder",     value: "kommende",  iconBg: "rgba(139,92,246,0.15)", iconColor: "#a78bfa", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg> },
  { label: "Møder i alt",        value: "total",     iconBg: "rgba(6,182,212,0.15)",  iconColor: "#22d3ee", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  { label: "Nuværende plan",     value: null,        iconBg: "rgba(245,158,11,0.15)", iconColor: "#fbbf24", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/></svg> },
];

const QUICK_ACTIONS = [
  { title: "Planlæg et møde",        desc: "Send invitationer og sæt tid",         href: "/meetings/new",  color: "#60a5fa", bg: "rgba(59,130,246,0.12)",  icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg> },
  { title: "Se historik",             desc: "Dine tidligere møder og statistik",    href: "/history",       color: "#a78bfa", bg: "rgba(139,92,246,0.12)", icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg> },
  { title: "Administrer abonnement", desc: "Skift plan eller se fakturaer",        href: "/subscription",  color: "#fbbf24", bg: "rgba(245,158,11,0.12)",  icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg> },
];

export default function DashboardPage() {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<PlanId>("gratis");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState<{ id: string; title: string; date: string; time: string }[]>([]);
  const [userName, setUserName] = useState("");
  const [monthlyMeetings, setMonthlyMeetings] = useState(0);
  const [totalMeetings, setTotalMeetings] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const firstOfMonth = today.slice(0, 7) + "-01";

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserName((user.user_metadata?.full_name ?? user.email ?? "").split(" ")[0]);

      supabase.from("meetings").select("id, title, date, time").eq("user_id", user.id).gte("date", today).order("date").limit(5).then(({ data }) => setUpcomingMeetings(data ?? []));
      supabase.from("meetings").select("id", { count: "exact" }).eq("user_id", user.id).gte("date", firstOfMonth).lte("date", today).then(({ count }) => setMonthlyMeetings(count ?? 0));
      supabase.from("meetings").select("id", { count: "exact" }).eq("user_id", user.id).then(({ count }) => setTotalMeetings(count ?? 0));

      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (data?.plan && data.plan in PLANS) setCurrentPlanId(data.plan as PlanId);
    });
  }, []);

  const plan = PLANS[currentPlanId] ?? PLANS.gratis;

  const handleStartMeeting = () => {
    setStarting(true);
    setTimeout(() => router.push("/room/instant"), 1_000);
  };

  const handleJoin = () => {
    if (joinCode.length < 3) return;
    setJoining(true);
    setTimeout(() => { setJoining(false); setJoinError(true); }, 1_200);
  };

  return (
    <AppLayout activeHref="/dashboard">

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">God dag{userName ? `, ${userName}` : ""} 👋</h1>
          <p className="text-xs" style={{ color: "#475569" }}>{new Date().toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex gap-3">
<Link href="/meetings/new" className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Planlæg
          </Link>
        </div>
      </header>

      <main className="p-8 space-y-8">

        {/* Countdown + Quick Join */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(6,182,212,0.12)" }}>
              <svg className="h-6 w-6" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#22d3ee" }}>Næste møde</p>
              {upcomingMeetings[0] ? (
                <>
                  <p className="text-sm font-bold text-white truncate">{upcomingMeetings[0].title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{upcomingMeetings[0].date} · {upcomingMeetings[0].time}</p>
                </>
              ) : (
                <p className="text-sm" style={{ color: "#334155" }}>Ingen kommende møder</p>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#60a5fa" }}>Deltag i møde</p>
            <div className="flex gap-2">
              <input
                className="input-dark flex-1 text-sm"
                placeholder="Indtast mødekode..."
                value={joinCode}
                onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleJoin(); }}
                style={joinError ? { borderColor: "rgba(239,68,68,0.6)", background: "rgba(239,68,68,0.06)" } : {}}
              />
              <button onClick={handleJoin} disabled={joining || joinCode.length < 3} className="btn-gradient rounded-xl px-4 text-sm flex items-center gap-2" style={{ opacity: joinCode.length < 3 ? 0.4 : 1 }}>
                {joining
                  ? <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                }
              </button>
            </div>
            {joinError
              ? <p className="mt-2 text-xs animate-fade-in" style={{ color: "#f87171" }}>Mødekoden blev ikke fundet. Tjek koden og prøv igen.</p>
              : <p className="mt-2 text-xs" style={{ color: "#334155" }}>Få koden fra møde-arrangøren</p>
            }
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: s.iconBg }}>
                  <span style={{ color: s.iconColor }}>{s.icon}</span>
                </div>
              </div>
              <p className="text-3xl font-black tracking-tight text-white">
                {s.label === "Møder denne måned" ? monthlyMeetings
                  : s.label === "Kommende møder" ? upcomingMeetings.length
                  : s.label === "Møder i alt" ? totalMeetings
                  : plan.label}
              </p>
              <p className="mt-1 text-xs" style={{ color: "#64748b" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Kommende møder */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-base font-semibold text-white">Kommende møder</h2>
            <Link href="/meetings" className="text-sm font-medium" style={{ color: "#60a5fa" }}>Se alle →</Link>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm" style={{ color: "#334155" }}>Ingen kommende møder</p>
                <Link href="/meetings/new" className="mt-2 inline-block text-xs font-semibold" style={{ color: "#60a5fa" }}>+ Planlæg et møde</Link>
              </div>
            ) : upcomingMeetings.map((m) => (
              <div key={m.id} className="group flex items-center justify-between px-6 py-4 transition-all hover:bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                    <svg className="h-5 w-5" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{m.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{m.date} · {m.time}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <Link href={`/meetings/${m.id}`} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>Detaljer</Link>
                  <Link href={`/room/${m.id}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>Start</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hurtige handlinger */}
        <div>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#475569" }}>Hurtige handlinger</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.title} href={a.href} className="glass group rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/20">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: a.bg }}>
                  <span style={{ color: a.color }}>{a.icon}</span>
                </div>
                <p className="text-sm font-semibold text-white">{a.title}</p>
                <p className="text-xs mt-1" style={{ color: "#475569" }}>{a.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium" style={{ color: a.color }}>
                  Gå til <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>
    </AppLayout>
  );
}
