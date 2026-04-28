"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

type Meeting = { id: string; title: string; date: string; time: string; duration: string | null };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" });
}

function totalMinutes(meetings: Meeting[]) {
  return meetings.reduce((sum, m) => {
    const n = parseInt(m.duration ?? "0");
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
}

export default function HistoryPage() {
  const [historyMeetings, setHistoryMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("meetings")
        .select("id, title, date, time, duration")
        .eq("user_id", user.id)
        .lt("date", today)
        .order("date", { ascending: false });
      setHistoryMeetings(data ?? []);
      setLoading(false);
    });
  }, []);
  return (
    <AppLayout activeHref="/history">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Historik & statistik</h1>
          <p className="text-xs" style={{ color: "#475569" }}>Overblik over dine afholdte møder</p>
        </div>
        <button className="btn-ghost flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Eksportér CSV
        </button>
      </header>

      <main className="p-8 space-y-8">

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "Afholdte møder", value: historyMeetings.length, color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
              { label: "Timer i møder", value: `${Math.floor(totalMinutes(historyMeetings) / 60)}t ${totalMinutes(historyMeetings) % 60}m`, color: "#a78bfa", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
              { label: "Seneste møde", value: historyMeetings[0] ? formatDate(historyMeetings[0].date) : "—", color: "#22d3ee", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className="rounded-2xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                <p className="text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* History table */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: "#475569" }}>Afholdte møder</h2>
          <div className="glass rounded-2xl overflow-hidden">

            {/* Table head */}
            <div className="grid grid-cols-5 px-6 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              {["Møde", "Dato", "Tidspunkt", "Varighed", "Deltagere"].map((h) => (
                <span key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: "#334155" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {loading && (
                <div className="flex justify-center py-12">
                  <svg className="h-5 w-5 animate-spin" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                </div>
              )}
              {!loading && historyMeetings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: "#334155" }}>Ingen afholdte møder endnu</p>
                </div>
              )}
              {historyMeetings.map((m) => (
                <div
                  key={m.id}
                  className="grid grid-cols-5 items-center px-6 py-4 transition-all"
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                >
                  <div className="flex items-center gap-3 pr-4">
                    <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
                      <svg className="h-4 w-4" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-white truncate">{m.title}</span>
                  </div>
                  <span className="text-sm" style={{ color: "#64748b" }}>{formatDate(m.date)}</span>
                  <span className="text-sm" style={{ color: "#64748b" }}>{m.time}</span>
                  <div>
                    <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
                      {m.duration ?? "—"}
                    </span>
                  </div>
                  <div />
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
              <span className="text-xs" style={{ color: "#334155" }}>Viser {historyMeetings.length} møder</span>
            </div>
          </div>
        </div>

      </main>
    </AppLayout>
  );
}
