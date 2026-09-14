"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/app/lib/supabase";
import { LysbroIcon } from "@/app/components/LysbroLogo";

type Phase = "checking" | "prejoin" | "waiting" | "admitted" | "meeting";

type LobbyEntry = {
  id: string;
  guest_name: string;
  status: string;
  created_at: string;
};

export default function RoomPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "demo";
  const roomName = `agora-${id}-room`;

  const [phase, setPhase] = useState<Phase>("checking");
  const [isHost, setIsHost] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [waitingGuests, setWaitingGuests] = useState<LobbyEntry[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [jitsiToken, setJitsiToken] = useState<string | null>(null);

  // Check if current user is the host
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setPhase("prejoin"); return; }

      const name = user.user_metadata?.full_name ?? user.email ?? "";
      setGuestName(name);

      const { data: meeting } = await supabase
        .from("meetings")
        .select("id, user_id")
        .eq("id", id)
        .single();

      if (meeting?.user_id === user.id) {
        setIsHost(true);
        const res = await fetch("/api/jitsi-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: `agora-${id}-room`, name: name }),
        });
        if (!res.ok) {
          setPhase("prejoin");
          return;
        }
        const { token } = await res.json();
        setJitsiToken(token);
        setPhase("meeting");
      } else {
        setPhase("prejoin");
      }
    });
  }, [id]);

  // Meeting timer
  useEffect(() => {
    if (phase !== "meeting") return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  // Host: subscribe to lobby entries
  useEffect(() => {
    if (phase !== "meeting" || !isHost) return;
    const supabase = createClient();

    supabase.from("meeting_lobby")
      .select("*")
      .eq("meeting_id", id)
      .eq("status", "waiting")
      .then(({ data }) => setWaitingGuests(data ?? []));

    const ch = supabase
      .channel(`lobby-host-${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "meeting_lobby",
        filter: `meeting_id=eq.${id}`,
      }, () => {
        supabase.from("meeting_lobby")
          .select("*")
          .eq("meeting_id", id)
          .eq("status", "waiting")
          .then(({ data }) => {
            setWaitingGuests(data ?? []);
            if ((data ?? []).length > 0) setShowPanel(true);
          });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [phase, isHost, id]);

  // Guest: subscribe to own lobby entry
  useEffect(() => {
    if (phase !== "waiting" || !lobbyId) return;
    const supabase = createClient();

    const ch = supabase
      .channel(`lobby-guest-${lobbyId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "meeting_lobby",
        filter: `id=eq.${lobbyId}`,
      }, (payload) => {
        if (payload.new.status === "admitted") setPhase("admitted");
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [phase, lobbyId]);

  // Admitted → fetch token and enter meeting
  useEffect(() => {
    if (phase !== "admitted") return;
    const t = setTimeout(async () => {
      const res = await fetch("/api/jitsi-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: `agora-${id}-room`, name: guestName }),
      });
      if (!res.ok) {
        setPhase("prejoin");
        return;
      }
      const { token } = await res.json();
      setJitsiToken(token);
      setPhase("meeting");
    }, 1500);
    return () => clearTimeout(t);
  }, [phase, id, guestName]);

  const handleKnock = async () => {
    if (!guestName.trim()) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("meeting_lobby")
      .insert({ meeting_id: id, guest_name: guestName.trim() })
      .select("id")
      .single();
    if (data?.id) {
      setLobbyId(data.id);
      setPhase("waiting");
    }
  };

  const handleAdmit = async (entryId: string) => {
    const supabase = createClient();
    await supabase.from("meeting_lobby").update({ status: "admitted" }).eq("id", entryId);
    setWaitingGuests((g) => g.filter((e) => e.id !== entryId));
  };

  const handleReject = async (entryId: string) => {
    const supabase = createClient();
    await supabase.from("meeting_lobby").update({ status: "rejected" }).eq("id", entryId);
    setWaitingGuests((g) => g.filter((e) => e.id !== entryId));
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Pre-join screen ──────────────────────────────────────────────────────────
  if (phase === "checking") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#020308" }}>
        <svg className="h-8 w-8 animate-spin" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (phase === "prejoin") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-4" style={{ background: "#020308" }}>
        <div className="orb orb-blue" style={{ width: 400, height: 400, top: -100, left: -100, opacity: 0.3, filter: "blur(80px)" }} />
        <div className="orb orb-cyan" style={{ width: 300, height: 300, bottom: -80, right: -80, opacity: 0.25, filter: "blur(80px)" }} />

        <div className="relative w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center gap-2.5">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
              <LysbroIcon className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">Lysbro</span>
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: "rgba(59,130,246,0.12)" }}>
                <svg className="h-5 w-5" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Dette møde har venteværelse</p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Arrangøren lukker dig ind</p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Dit navn</label>
              <input
                className="input-dark"
                placeholder="Hvad skal arrangøren kalde dig?"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleKnock()}
                autoFocus
              />
            </div>

            <button
              onClick={handleKnock}
              disabled={!guestName.trim()}
              className="btn-gradient w-full py-3 text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
              style={{ opacity: guestName.trim() ? 1 : 0.45, cursor: guestName.trim() ? "pointer" : "not-allowed" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Bank på
            </button>
          </div>

          <p className="mt-4 text-center text-xs" style={{ color: "#334155" }}>
            Din kamera og mikrofon aktiveres først inde i mødet
          </p>
        </div>
      </div>
    );
  }

  // ── Waiting screen ────────────────────────────────────────────────────────────
  if (phase === "waiting") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-4" style={{ background: "#020308" }}>
        <div className="orb orb-blue" style={{ width: 400, height: 400, top: -100, left: -100, opacity: 0.3, filter: "blur(80px)" }} />

        <div className="text-center max-w-xs">
          {/* Pulsing ring */}
          <div className="relative mx-auto mb-8 h-24 w-24">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(59,130,246,0.15)" }} />
            <div className="absolute inset-2 rounded-full animate-ping" style={{ background: "rgba(59,130,246,0.1)", animationDelay: "0.3s" }} />
            <div className="relative flex h-full w-full items-center justify-center rounded-full" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <svg className="h-10 w-10" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </div>

          <p className="text-xl font-bold text-white mb-2">Venter på at blive lukket ind…</p>
          <p className="text-sm mb-1" style={{ color: "#475569" }}>
            Arrangøren er blevet notificeret om at <span className="font-semibold" style={{ color: "#94a3b8" }}>{guestName}</span> venter
          </p>
          <p className="text-xs mb-8" style={{ color: "#334155" }}>Bliv på siden — du lukkes automatisk ind</p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}
          >
            Fortryd
          </Link>
        </div>
      </div>
    );
  }

  // ── Admitted flash ────────────────────────────────────────────────────────────
  if (phase === "admitted") {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center" style={{ background: "#020308" }}>
        <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
          <svg className="h-10 w-10" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-xl font-bold text-white">Du er lukket ind!</p>
        <p className="text-sm mt-1" style={{ color: "#475569" }}>Forbinder til mødet…</p>
      </div>
    );
  }

  // ── Meeting ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#020308" }}>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex h-14 items-center justify-between px-6"
        style={{ background: "linear-gradient(to bottom, rgba(2,3,8,0.95) 60%, transparent)" }}>
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 12px rgba(59,130,246,0.4)" }}>
            <LysbroIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-black tracking-tight text-white">Lysbro</span>
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
            LIVE · {fmt(seconds)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Host: waiting guests button */}
          {isHost && (
            <button
              onClick={() => setShowPanel((v) => !v)}
              className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all"
              style={{
                background: showPanel ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                border: showPanel ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: showPanel ? "#93c5fd" : "#94a3b8",
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Venteværelse
              {waitingGuests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white animate-pulse"
                  style={{ background: "#ef4444" }}>
                  {waitingGuests.length}
                </span>
              )}
            </button>
          )}

          <Link href="/meetings"
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover-red-btn"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Forlad møde
          </Link>
        </div>
      </div>

      {/* Jitsi iframe */}
      {jitsiToken && (
        <iframe
          src={`https://meet.lysbro.com/${roomName}?jwt=${jitsiToken}#config.prejoinPageEnabled=false&config.disableDeepLinking=true&config.toolbarButtons=["microphone","camera","desktop","chat","tileview","fullscreen","raisehand","participants-pane","select-background","settings","videoquality","noisesuppression","toggle-camera"]`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full flex-1"
          style={{ border: "none" }}
        />
      )}


      {/* Host: waiting room panel */}
      {isHost && showPanel && (
        <div
          className="absolute right-4 top-20 z-20 w-72 rounded-2xl overflow-hidden"
          style={{ background: "#080b18", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 60px rgba(0,0,0,0.7)" }}
        >
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <p className="text-sm font-bold text-white">Venteværelse</p>
            </div>
            <button onClick={() => setShowPanel(false)} style={{ color: "#475569" }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {waitingGuests.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm" style={{ color: "#334155" }}>Ingen venter lige nu</p>
              </div>
            ) : waitingGuests.map((guest) => (
              <div key={guest.id} className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                    {guest.guest_name[0].toUpperCase()}
                  </div>
                  <p className="text-sm font-medium text-white truncate">{guest.guest_name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleReject(guest.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg transition-all hover-red-btn"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                    title="Afvis"
                  >
                    <svg className="h-3.5 w-3.5" style={{ color: "#f87171" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleAdmit(guest.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover:opacity-85"
                    style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Luk ind
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
