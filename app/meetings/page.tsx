"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

type Meeting = { id: string; title: string; date: string; time: string; duration: string; live: boolean };
type MeetingData = { meeting_id: string; title: string; date: string; time: string };

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      const [{ data: own }, { data: inviteMsgs }] = await Promise.all([
        supabase.from("meetings").select("*").order("date", { ascending: true }),
        supabase.from("messages").select("meeting_data").eq("receiver_id", user.id).eq("type", "meeting_invite").eq("invite_status", "accepted"),
      ]);

      const ownIds = new Set((own ?? []).map((m: Meeting) => m.id));
      const invited: Meeting[] = (inviteMsgs ?? [])
        .filter((msg: { meeting_data: MeetingData | null }) => msg.meeting_data && !ownIds.has((msg.meeting_data as MeetingData).meeting_id))
        .map((msg: { meeting_data: MeetingData }) => ({
          id: (msg.meeting_data as MeetingData).meeting_id,
          title: (msg.meeting_data as MeetingData).title,
          date: (msg.meeting_data as MeetingData).date,
          time: (msg.meeting_data as MeetingData).time,
          duration: "",
          live: false,
        }));

      const all = [...(own ?? []), ...invited].sort((a, b) => a.date.localeCompare(b.date));
      setMeetings(all);
      setLoading(false);
    });
  }, []);

  const upcoming = meetings.filter((m) => m.date >= today);
  const past = meetings.filter((m) => m.date < today);

  if (loading) return (
    <AppLayout activeHref="/meetings">
      <div className="flex flex-1 items-center justify-center h-64">
        <svg className="h-6 w-6 animate-spin" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout activeHref="/meetings">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Møder</h1>
          <p className="text-xs" style={{ color: "#475569" }}>Administrer dine kommende og tidligere møder</p>
        </div>
        <Link href="/meetings/new" className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Planlæg møde
        </Link>
      </header>

      <main className="p-8 space-y-8">

        {/* Upcoming */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#475569" }}>Kommende</h2>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa" }}>
              {upcoming.length}
            </span>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            {upcoming.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: "#334155" }}>Ingen kommende møder</p>
                <Link href="/meetings/new" className="mt-3 inline-block text-xs font-semibold" style={{ color: "#60a5fa" }}>+ Planlæg et møde</Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                {upcoming.map((m) => <MeetingRow key={m.id} meeting={m} />)}
              </div>
            )}
          </div>
        </section>

        {/* Past */}
        {past.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#475569" }}>Tidligere</h2>
            <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#475569" }}>
              {past.length}
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {past.map((m) => <MeetingRow key={m.id} meeting={m} dimmed />)}
            </div>
          </div>
        </section>
        )}

      </main>
    </AppLayout>
  );
}

function MeetingRow({ meeting, dimmed }: { meeting: Meeting; dimmed?: boolean }) {
  return (
    <div
      className={`group flex items-center justify-between px-6 py-4 transition-all hover-surface ${dimmed ? "hover:opacity-90" : ""}`}
      style={{ opacity: dimmed ? 0.65 : 1 }}
    >
      <div className="flex items-center gap-4">
        <div className="relative h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meeting.live ? "rgba(239,68,68,0.12)" : !dimmed ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.05)" }}>
          <svg className="h-5 w-5" style={{ color: meeting.live ? "#f87171" : !dimmed ? "#60a5fa" : "#475569" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          {meeting.live && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[#05070f] animate-pulse" style={{ background: "#ef4444" }} />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-white">{meeting.title}</p>
            {meeting.live && (
              <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                Live nu
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
            {meeting.date} · {meeting.time} · {meeting.duration}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Status badge */}
        <span className="rounded-full px-3 py-1 text-xs font-semibold" style={
          !dimmed
            ? { background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }
            : { background: "rgba(255,255,255,0.05)", color: "#475569", border: "1px solid rgba(255,255,255,0.08)" }
        }>
          {!dimmed ? "Kommende" : "Afholdt"}
        </span>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <Link href={`/meetings/${meeting.id}`}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8" }}>
            Detaljer
          </Link>
          {!dimmed && (
            <Link href={`/room/${meeting.id}`} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: meeting.live ? "#ef4444" : "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
              {meeting.live ? "Deltag nu" : "Start"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
