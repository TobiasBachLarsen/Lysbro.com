"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

type Contact = { id: string; name: string; initials: string; color: string };
type Message = { id: string; sender_id: string; receiver_id: string; content: string; read: boolean; created_at: string };

const colors = [
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "I går";
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Load current user + contacts
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      const { data: rows } = await supabase
        .from("contacts")
        .select("id, name, email")
        .eq("user_id", user.id);

      const emails = (rows ?? []).map((r: any) => r.email).filter(Boolean);
      const { data: profiles } = emails.length
        ? await supabase.from("profiles").select("id, email").in("email", emails)
        : { data: [] };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const list: Contact[] = (rows ?? [])
        .map((r: any, i: number) => {
          const profile = (profiles ?? []).find((p: any) => p.email === r.email);
          if (!profile) return null;
          return {
            id: profile.id,
            name: r.name ?? r.email,
            initials: initials(r.name ?? "?"),
            color: colors[i % colors.length],
          };
        })
        .filter(Boolean) as Contact[];
      setContacts(list);

      // Load last message per contact
      for (const c of list) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${c.id}),and(sender_id.eq.${c.id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: false })
          .limit(1);
        if (msgs?.[0]) setLastMessages((prev) => ({ ...prev, [c.id]: msgs[0] }));
      }
    });
  }, []);

  // Load messages + realtime when contact selected
  useEffect(() => {
    if (!selected || !userId) return;
    const supabase = createClient();

    // Load history
    supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${selected.id}),and(sender_id.eq.${selected.id},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        // Mark incoming as read
        supabase.from("messages").update({ read: true })
          .eq("receiver_id", userId).eq("sender_id", selected.id).eq("read", false)
          .then(() => {});
      });

    // Realtime
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`messages-${userId}-${selected.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
      }, (payload) => {
        const msg = payload.new as Message;
        const relevant =
          (msg.sender_id === userId && msg.receiver_id === selected.id) ||
          (msg.sender_id === selected.id && msg.receiver_id === userId);
        if (!relevant) return;
        setMessages((prev) => [...prev, msg]);
        setLastMessages((prev) => ({ ...prev, [selected.id]: msg }));
        if (msg.receiver_id === userId) {
          supabase.from("messages").update({ read: true }).eq("id", msg.id).then(() => {});
        }
      })
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [selected, userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selected || !userId || sending) return;
    setSending(true);
    const supabase = createClient();
    const content = input.trim();
    setInput("");
    const { error } = await supabase.from("messages").insert({ sender_id: userId, receiver_id: selected.id, content });
    if (error) console.error("[messages] send error:", error);
    setSending(false);
  };

  const handleSelect = (contact: Contact) => {
    setSelected(contact);
    setMessages([]);
  };

  return (
    <AppLayout activeHref="/messages">
      <div className="flex h-screen flex-col" style={{ marginTop: 0 }}>
        <div className="flex flex-1 overflow-hidden">

          {/* ── Conversation list ── */}
          <div className="flex w-72 shrink-0 flex-col" style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "#080b18" }}>
            <div className="flex h-16 items-center px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h1 className="text-base font-semibold text-white">Beskeder</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
              {contacts.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm" style={{ color: "#334155" }}>Ingen kontakter endnu</p>
                  <p className="text-xs mt-1" style={{ color: "#1e293b" }}>Tilføj kontakter for at starte en chat</p>
                </div>
              ) : contacts.map((c) => {
                const last = lastMessages[c.id];
                const isActive = selected?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                    style={{
                      background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                      borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                    }}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: c.color }}>
                        {c.initials}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                        {last && <p className="text-[10px] shrink-0 ml-2" style={{ color: "#334155" }}>{formatTime(last.created_at)}</p>}
                      </div>
                      <p className="text-xs truncate mt-0.5" style={{ color: "#475569" }}>
                        {last ? (last.sender_id === userId ? `Du: ${last.content}` : last.content) : "Ingen beskeder endnu"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Chat area ── */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3" style={{ background: "#05070f" }}>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <svg className="h-8 w-8" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white">Vælg en samtale</p>
                <p className="text-xs" style={{ color: "#334155" }}>Klik på en kontakt til venstre</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex h-16 shrink-0 items-center gap-3 px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#080b18" }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white shrink-0" style={{ background: selected.color }}>
                    {selected.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selected.name}</p>
                    <p className="text-xs" style={{ color: "#334155" }}>Kontakt</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ background: "#05070f" }}>
                  {messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm" style={{ color: "#334155" }}>Send den første besked</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-xs rounded-2xl px-4 py-2.5"
                          style={isMine ? {
                            background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
                            borderBottomRightRadius: 4,
                          } : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderBottomLeftRadius: 4,
                          }}
                        >
                          <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-right" : ""}`} style={{ color: isMine ? "rgba(255,255,255,0.55)" : "#334155" }}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="shrink-0 px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "#080b18" }}>
                  <div className="flex items-center gap-3">
                    <input
                      className="input-dark flex-1"
                      placeholder={`Besked til ${selected.name}…`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all"
                      style={{
                        background: input.trim() ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "rgba(255,255,255,0.05)",
                        opacity: input.trim() ? 1 : 0.4,
                        cursor: input.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
