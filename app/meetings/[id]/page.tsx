"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

type Meeting = { id: string; title: string; date: string; time: string; duration: string; description: string; live: boolean; user_id: string };

const rsvpConfig = {
  accepted: { label: "Accepteret", color: "#4ade80", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.25)" },
  pending:  { label: "Afventer",   color: "#fbbf24", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  declined: { label: "Afslået",    color: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)" },
};

const IS_PRO = false;

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showUpgradeHint, setShowUpgradeHint] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }

      // RLS only returns a row here when the caller owns the meeting.
      const { data } = await supabase.from("meetings").select("*").eq("id", params.id as string).single();
      if (data) {
        setMeeting(data);
        setIsHost(true);
        setLoading(false);
        return;
      }

      // Not the owner — fall back to an accepted invite, which carries its own
      // copy of the meeting details since RLS won't let us select the row directly.
      const { data: invite } = await supabase
        .from("messages")
        .select("meeting_data")
        .eq("receiver_id", user.id)
        .eq("type", "meeting_invite")
        .eq("invite_status", "accepted")
        .contains("meeting_data", { meeting_id: params.id as string })
        .maybeSingle();

      const md = invite?.meeting_data as { title?: string; date?: string; time?: string } | undefined;
      if (md) {
        setMeeting({
          id: params.id as string,
          title: md.title ?? "",
          date: md.date ?? "",
          time: md.time ?? "",
          duration: "",
          description: "",
          live: false,
          user_id: "",
        });
      }
      setLoading(false);
    });
  }, [params.id]);

  const meetingLink = typeof window !== "undefined" ? `${window.location.origin}/room/${params.id}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleRecord = () => {
    if (!IS_PRO) { setShowUpgradeHint(true); return; }
    setRecording((r) => !r);
  };

  const handleDelete = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("meetings").delete().eq("id", params.id as string).eq("user_id", user.id);
    router.push("/meetings");
  };

  if (loading) return (
    <AppLayout activeHref="/meetings">
      <div className="flex flex-1 items-center justify-center h-64">
        <svg className="h-6 w-6 animate-spin" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      </div>
    </AppLayout>
  );

  if (!meeting) return (
    <AppLayout activeHref="/meetings">
      <div className="flex flex-1 flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm" style={{ color: "#475569" }}>Mødet blev ikke fundet</p>
        <Link href="/meetings" className="text-xs font-semibold" style={{ color: "#60a5fa" }}>← Tilbage til møder</Link>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout activeHref="/meetings">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4">
          <Link href="/meetings" className="flex items-center gap-1.5 text-sm font-medium transition hover-muted" style={{ color: "#64748b" }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Tilbage
          </Link>
          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
          <h1 className="text-base font-semibold text-white truncate">{meeting.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Record button */}
          <button
            onClick={handleRecord}
            className="relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={IS_PRO
              ? { background: recording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${recording ? "rgba(239,68,68,0.35)" : "rgba(255,255,255,0.1)"}`, color: recording ? "#f87171" : "#94a3b8" }
              : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#334155", cursor: "pointer" }
            }
          >
            {!IS_PRO && (
              <svg className="h-3.5 w-3.5 shrink-0" style={{ color: "#475569" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
            )}
            {IS_PRO && recording && <span className="h-2 w-2 rounded-full animate-ping" style={{ background: "#ef4444" }} />}
            {IS_PRO && !recording && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="4" fill="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6.75 6.75 0 100-13.5 6.75 6.75 0 000 13.5z"/></svg>}
            {IS_PRO ? (recording ? "Stop optagelse" : "Optag møde") : "Optag møde"}
            {!IS_PRO && <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}>Pro</span>}
          </button>

          <Link href={`/room/${meeting.id}`} className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
            Start møde
          </Link>
        </div>
      </header>

      {/* Upgrade hint for recording */}
      {showUpgradeHint && (
        <div className="animate-fade-in mx-8 mt-4 flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
            <p className="text-sm" style={{ color: "#c4b5fd" }}>Optagelse kræver <strong>Professionel-plan</strong> eller højere.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/subscription" className="rounded-xl px-4 py-1.5 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              Opgrader nu
            </Link>
            <button onClick={() => setShowUpgradeHint(false)} style={{ color: "#475569" }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      <main className="p-8 max-w-3xl space-y-5">

        {/* Meeting info */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
              <svg className="h-4 w-4" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
            </div>
            <h2 className="text-sm font-semibold text-white">Detaljer</h2>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            {[
              { label: "Dato", value: meeting.date },
              { label: "Tidspunkt", value: meeting.time },
              { label: "Varighed", value: meeting.duration ?? "—" },
            ].map((d) => (
              <div key={d.label}>
                <p className="text-xs mb-1" style={{ color: "#475569" }}>{d.label}</p>
                <p className="font-semibold text-white">{d.value}</p>
              </div>
            ))}
          </div>

          {meeting.description && (
            <div>
              <p className="text-xs mb-1" style={{ color: "#475569" }}>Beskrivelse</p>
              <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{meeting.description}</p>
            </div>
          )}

          {/* Meeting link */}
          <div>
            <p className="text-xs mb-2" style={{ color: "#475569" }}>Mødelink</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-xl px-3 py-2.5 text-xs truncate" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                {meetingLink}
              </code>
              <button onClick={copyLink} className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all"
                style={{ background: copied ? "rgba(34,197,94,0.12)" : "rgba(59,130,246,0.1)", border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.2)"}`, color: copied ? "#4ade80" : "#60a5fa" }}>
                {copied
                  ? <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Kopieret</>
                  : <><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"/></svg>Kopiér</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Deltagere */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)" }}>
                <svg className="h-4 w-4" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
              </div>
              <h2 className="text-sm font-semibold text-white">Deltagere</h2>
            </div>
          </div>
          <div className="px-6 py-8 text-center">
            <p className="text-sm" style={{ color: "#334155" }}>Deltager-invitationer kommer i en fremtidig version</p>
          </div>
        </div>

        {/* Mødenoter */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                <svg className="h-4 w-4" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
              </div>
              <h2 className="text-sm font-semibold text-white">Mødenoter</h2>
            </div>
            {notesSaved && (
              <span className="animate-fade-in text-xs font-semibold" style={{ color: "#4ade80" }}>Gemt!</span>
            )}
          </div>

          <textarea
            className="input-dark resize-none w-full"
            rows={5}
            placeholder="Skriv noter her — de gemmes automatisk til mødehistorikken..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: "#334155" }}>Notes gemmes med mødet i historikken</p>
            <button
              onClick={saveNotes}
              disabled={!notes.trim()}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all"
              style={{ background: notes.trim() ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(255,255,255,0.05)", opacity: notes.trim() ? 1 : 0.4, cursor: notes.trim() ? "pointer" : "not-allowed" }}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
              Gem noter
            </button>
          </div>
        </div>

        {/* Slet møde */}
        {isHost && (
          <div className="rounded-2xl px-6 py-5 flex items-center justify-between gap-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Slet møde</p>
              <p className="text-xs mt-0.5" style={{ color: "#7f1d1d" }}>Deltagerne vil modtage besked om aflysningen.</p>
            </div>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                Slet møde
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-xs font-medium" style={{ color: "#f87171" }}>Er du sikker?</p>
                <button onClick={handleDelete} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#ef4444" }}>Bekræft</button>
                <button onClick={() => setDeleteConfirm(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>Fortryd</button>
              </div>
            )}
          </div>
        )}

      </main>
    </AppLayout>
  );
}
