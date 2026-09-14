"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

const DAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];
const MONTHS = ["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"];
const COLORS = ["#60a5fa","#a78bfa","#22d3ee","#4ade80","#f59e0b","#f87171"];
const BGGS   = ["rgba(59,130,246,0.15)","rgba(139,92,246,0.15)","rgba(6,182,212,0.15)","rgba(34,197,94,0.15)","rgba(245,158,11,0.15)","rgba(239,68,68,0.15)"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export default function CalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [meetingsByDay, setMeetingsByDay] = useState<Record<number, { id: string; title: string; time: string; color: string; bg: string }[]>>({});

  useEffect(() => {
    const supabase = createClient();
    const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const to   = `${year}-${String(month + 1).padStart(2, "0")}-${String(getDaysInMonth(year, month)).padStart(2, "0")}`;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      const [{ data: own }, { data: inviteMsgs }] = await Promise.all([
        supabase.from("meetings").select("id, title, date, time").gte("date", from).lte("date", to),
        user
          ? supabase.from("messages").select("meeting_data").eq("receiver_id", user.id).eq("type", "meeting_invite").eq("invite_status", "accepted")
          : Promise.resolve({ data: [] }),
      ]);

      const ownIds = new Set((own ?? []).map((m: { id: string }) => m.id));
      const invited = ((inviteMsgs ?? []) as { meeting_data: { meeting_id: string; title: string; date: string; time: string } | null }[])
        .filter((msg) => {
          const md = msg.meeting_data;
          return md && md.date >= from && md.date <= to && !ownIds.has(md.meeting_id);
        })
        .map((msg) => ({ id: msg.meeting_data!.meeting_id, title: msg.meeting_data!.title, date: msg.meeting_data!.date, time: msg.meeting_data!.time }));

      const all = [...(own ?? []), ...invited];
      const byDay: Record<number, { id: string; title: string; time: string; color: string; bg: string }[]> = {};
      all.forEach((m, i) => {
        const day = parseInt(m.date.slice(8, 10));
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push({ id: m.id, title: m.title, time: m.time ?? "", color: COLORS[i % COLORS.length], bg: BGGS[i % BGGS.length] });
      });
      setMeetingsByDay(byDay);
    });
  }, [year, month]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedMeetings = selectedDay ? (meetingsByDay[selectedDay] ?? []) : [];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <AppLayout activeHref="/calendar">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Kalender</h1>
          <p className="text-xs" style={{ color: "#475569" }}>Overblik over dine møder</p>
        </div>
        <Link href="/meetings/new" className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Nyt møde
        </Link>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* Calendar grid */}
          <div className="xl:col-span-2 glass rounded-2xl overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover-icon-btn" style={{ color: "#64748b" }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
              </button>
              <h2 className="text-base font-bold text-white">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover-icon-btn" style={{ color: "#64748b" }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-4 pt-4 pb-2">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold uppercase tracking-wider py-1" style={{ color: "#334155" }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 px-4 pb-4">
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const hasMeeting = !!meetingsByDay[day];
                const isToday = isCurrentMonth && day === today;
                const isSelected = day === selectedDay;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={`relative flex flex-col items-center rounded-xl py-2 transition-all ${!isSelected ? "cal-day-inactive" : ""}`}
                    style={isSelected ? {
                      background: "linear-gradient(135deg, rgba(59,130,246,0.25), rgba(6,182,212,0.15))",
                      border: "1px solid rgba(59,130,246,0.4)",
                    } : isToday ? {
                      background: "rgba(59,130,246,0.1)",
                      border: "1px solid rgba(59,130,246,0.2)",
                    } : {
                      border: "1px solid transparent",
                    }}
                  >
                    <span className="text-sm font-semibold" style={{ color: isSelected ? "#fff" : isToday ? "#60a5fa" : "#94a3b8" }}>{day}</span>
                    {hasMeeting && (
                      <div className="mt-1 flex gap-0.5">
                        {meetingsByDay[day].slice(0, 3).map((m, i) => (
                          <span key={i} className="h-1 w-1 rounded-full" style={{ background: m.color }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side panel: selected day */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">
                {selectedDay
                  ? `${selectedDay}. ${MONTHS[month]}`
                  : "Vælg en dag"}
              </h3>

              {selectedDay && selectedMeetings.length === 0 && (
                <div className="text-center py-8">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <svg className="h-6 w-6" style={{ color: "#334155" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
                  </div>
                  <p className="text-sm" style={{ color: "#334155" }}>Ingen møder denne dag</p>
                  <Link href="/meetings/new" className="mt-3 inline-block text-xs font-semibold" style={{ color: "#60a5fa" }}>+ Opret møde</Link>
                </div>
              )}

              <div className="space-y-3">
                {selectedMeetings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-3 transition-all"
                    style={{ background: m.bg, border: `1px solid ${m.color}22` }}>
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: m.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{m.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{m.time}</p>
                    </div>
                    <Link href={`/room/${m.id}`} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-white" style={{ background: m.color }}>
                      Start
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Month summary */}
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Denne måned</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748b" }}>Møder planlagt</span>
                  <span className="font-semibold text-white">{Object.values(meetingsByDay).reduce((sum, day) => sum + day.length, 0)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </AppLayout>
  );
}
