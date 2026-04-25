"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function RoomPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "demo";
  const roomName = `agora-${id}-room`;

  const [connecting, setConnecting] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setConnecting(false), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (connecting) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [connecting]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: "#020308" }}>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex h-14 items-center justify-between px-6"
        style={{ background: "linear-gradient(to bottom, rgba(2,3,8,0.95) 60%, transparent)" }}>
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 12px rgba(59,130,246,0.4)" }}>
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <span className="text-sm font-black tracking-tight text-white">Agora</span>
          {!connecting && (
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#ef4444" }} />
              LIVE · {fmt(seconds)}
            </div>
          )}
        </div>

        <Link href="/meetings"
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
          style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(239,68,68,0.28)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(239,68,68,0.15)")}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
          Forlad møde
        </Link>
      </div>

      {/* Connecting overlay */}
      {connecting && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.1))", border: "1px solid rgba(59,130,246,0.3)" }}>
              <svg className="h-9 w-9" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center"
              style={{ background: "#05070f" }}>
              <svg className="h-4 w-4 animate-spin" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </span>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">Forbinder til møde…</p>
            <p className="text-sm mt-1" style={{ color: "#475569" }}>Kontrollerer kamera og mikrofon</p>
          </div>
        </div>
      )}

      {/* Jitsi iframe */}
      {!connecting && (
        <iframe
          src={`https://meet.jit.si/${roomName}`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full flex-1"
          style={{ border: "none" }}
        />
      )}

      {/* Bottom controls */}
      {!connecting && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
          <button
            onClick={() => setMuted((m) => !m)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all"
            style={{
              background: muted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
              border: muted ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.12)",
              color: muted ? "#f87171" : "#94a3b8",
            }}
          >
            {muted ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => setVideoOff((v) => !v)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all"
            style={{
              background: videoOff ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)",
              border: videoOff ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.12)",
              color: videoOff ? "#f87171" : "#94a3b8",
            }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </button>

          <Link href="/meetings"
            className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all"
            style={{ background: "#ef4444", color: "#fff", boxShadow: "0 4px 20px rgba(239,68,68,0.4)" }}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
