"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";
import { AVATAR_COLORS, getInitials, formatTime } from "@/app/lib/utils";

type Contact = { id: string; name: string; initials: string; color: string; avatar_url: string | null };
type MeetingData = { title: string; date: string; time: string; meeting_id: string };
type OrgData = { org_id: string; org_name: string };
type Message = { id: string; sender_id: string; receiver_id: string; content: string; read: boolean; created_at: string; type?: string; meeting_data?: MeetingData | OrgData; invite_status?: string };

function Avatar({ contact, size = 10 }: { contact: Pick<Contact, "initials" | "color" | "avatar_url" | "name">; size?: number }) {
  const cls = `h-${size} w-${size} shrink-0 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white`;
  return (
    <div className={cls} style={{ background: contact.color }}>
      {contact.avatar_url
        ? <img src={contact.avatar_url} alt={contact.name} className="h-full w-full object-cover" />
        : contact.initials}
    </div>
  );
}

export default function MessagesPage() {
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      // Kontakter fra contacts-tabellen
      const { data: rows } = await supabase.from("contacts").select("id, name, email").eq("user_id", user.id);
      const emails = (rows ?? []).map((r: any) => r.email).filter(Boolean);
      const { data: contactProfiles } = emails.length
        ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("email", emails)
        : { data: [] };
      const contactIdSet = new Set((contactProfiles ?? []).map((p: any) => p.id));

      // Folk der har sendt dig beskeder men ikke er kontakter (f.eks. invite-afsendere)
      const { data: receivedMsgs } = await supabase.from("messages")
        .select("sender_id").eq("receiver_id", user.id);
      const extraIds = [...new Set((receivedMsgs ?? [])
        .map((m: any) => m.sender_id)
        .filter((id: string) => id !== user.id && !contactIdSet.has(id)))];
      const { data: extraProfiles } = extraIds.length
        ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", extraIds)
        : { data: [] };

      // Samlet liste af alle profiler
      const allProfiles = [
        ...(contactProfiles ?? []).map((p: any) => {
          const row = (rows ?? []).find((r: any) => r.email === p.email);
          return { id: p.id, name: row?.name ?? p.full_name ?? p.email, avatar_url: p.avatar_url ?? null };
        }),
        ...(extraProfiles ?? []).map((p: any) => ({ id: p.id, name: p.full_name ?? p.email, avatar_url: p.avatar_url ?? null })),
      ];

      // Hent seneste besked for alle og sorter
      const lastMsgsMap: Record<string, Message> = {};
      await Promise.all(allProfiles.map(async (p) => {
        const { data: msgs } = await supabase.from("messages").select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.id}),and(sender_id.eq.${p.id},receiver_id.eq.${user.id})`)
          .order("created_at", { ascending: false }).limit(1);
        if (msgs?.[0]) lastMsgsMap[p.id] = msgs[0];
      }));
      setLastMessages(lastMsgsMap);

      const sorted = allProfiles.sort((a, b) => {
        const ta = lastMsgsMap[a.id]?.created_at ?? "";
        const tb = lastMsgsMap[b.id]?.created_at ?? "";
        return tb.localeCompare(ta);
      });

      setContacts(sorted.map((p, i) => ({
        id: p.id,
        name: p.name,
        initials: getInitials(p.name),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        avatar_url: p.avatar_url,
      })));
    });
  }, []);

  useEffect(() => {
    if (!selected || !userId) return;
    const supabase = createClient();

    supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${selected.id}),and(sender_id.eq.${selected.id},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? []);
        supabase.from("messages").update({ read: true })
          .eq("receiver_id", userId).eq("sender_id", selected.id).eq("read", false)
          .then(() => {});
      });

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`messages-${userId}-${selected.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        const relevant =
          (msg.sender_id === userId && msg.receiver_id === selected.id) ||
          (msg.sender_id === selected.id && msg.receiver_id === userId);
        if (!relevant) return;
        setMessages((prev) => [...prev, msg]);
        setLastMessages((prev) => ({ ...prev, [selected.id]: msg }));
        setContacts((prev) => {
          const idx = prev.findIndex((c) => c.id === selected.id);
          if (idx <= 0) return prev;
          const updated = [...prev];
          const [moved] = updated.splice(idx, 1);
          return [moved, ...updated];
        });
        if (msg.receiver_id === userId)
          supabase.from("messages").update({ read: true }).eq("id", msg.id).then(() => {});
      })
      .subscribe();

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [selected, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInviteResponse = async (msg: Message, accepted: boolean) => {
    const supabase = createClient();
    if (accepted && msg.meeting_data) {
      const md = msg.meeting_data as MeetingData;
      const { error } = await supabase.from("meetings").insert({
        title: md.title, date: md.date, time: md.time, user_id: userId,
      });
      if (error) return;
    }
    await supabase.from("messages").update({ invite_status: accepted ? "accepted" : "declined" }).eq("id", msg.id);
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, invite_status: accepted ? "accepted" : "declined" } : m));
  };

  const handleOrgInviteResponse = async (msg: Message, accepted: boolean) => {
    const supabase = createClient();
    if (accepted && msg.meeting_data) {
      const od = msg.meeting_data as OrgData;
      await supabase.from("organization_members").insert({ org_id: od.org_id, user_id: userId, role: "member" });
      await supabase.from("profiles").update({ org_id: od.org_id }).eq("id", userId);
    }
    await supabase.from("messages").update({ invite_status: accepted ? "accepted" : "declined" }).eq("id", msg.id);
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, invite_status: accepted ? "accepted" : "declined" } : m));
  };

  const handleSend = async () => {
    if (!input.trim() || !selected || !userId || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    await createClient().from("messages").insert({ sender_id: userId, receiver_id: selected.id, content });
    setSending(false);
  };

  return (
    <AppLayout activeHref="/messages">
      <div className="flex h-screen overflow-hidden">

        {/* Kontaktliste */}
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
                  onClick={() => { setSelected(c); setMessages([]); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                  style={{
                    background: isActive ? "rgba(59,130,246,0.08)" : "transparent",
                    borderLeft: isActive ? "2px solid #3b82f6" : "2px solid transparent",
                  }}
                >
                  <Avatar contact={c} size={10} />
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

        {/* Chat */}
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
              {/* Header */}
              <div className="flex h-16 shrink-0 items-center gap-3 px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#080b18" }}>
                <Avatar contact={selected} size={9} />
                <div>
                  <p className="text-sm font-semibold text-white">{selected.name}</p>
                  <p className="text-xs" style={{ color: "#334155" }}>Kontakt</p>
                </div>
              </div>

              {/* Beskeder */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ background: "#05070f" }}>
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm" style={{ color: "#334155" }}>Send den første besked</p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.sender_id === userId;
                  const isInvite = msg.type === "meeting_invite" && msg.meeting_data;
                  const isOrgInvite = msg.type === "org_invite" && msg.meeting_data;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      {isOrgInvite ? (
                        <div className="max-w-xs w-full rounded-2xl overflow-hidden" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", ...(isMine ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }) }}>
                          <div className="px-4 pt-4 pb-3">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="h-4 w-4 shrink-0" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#22d3ee" }}>Organisationsinvitation</span>
                            </div>
                            <p className="text-sm font-bold text-white mb-1">{(msg.meeting_data as OrgData).org_name}</p>
                            <p className="text-xs" style={{ color: "#64748b" }}>Du er inviteret til at joine denne organisation</p>
                            {!isMine && msg.invite_status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => handleOrgInviteResponse(msg, true)} className="flex-1 rounded-xl py-2 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}>Accepter</button>
                                <button onClick={() => handleOrgInviteResponse(msg, false)} className="flex-1 rounded-xl py-2 text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>Afvis</button>
                              </div>
                            )}
                            {msg.invite_status === "accepted" && (
                              <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "#4ade80" }}>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                {isMine ? "Invitation sendt" : "Accepteret — du er nu medlem"}
                              </div>
                            )}
                            {msg.invite_status === "declined" && (
                              <p className="mt-3 text-xs" style={{ color: "#f87171" }}>Afvist</p>
                            )}
                          </div>
                          <p className={`text-[10px] px-4 pb-3 ${isMine ? "text-right" : ""}`} style={{ color: "#334155" }}>{formatTime(msg.created_at)}</p>
                        </div>
                      ) : isInvite ? (
                        <div className="max-w-xs w-full rounded-2xl overflow-hidden" style={{
                          background: "rgba(59,130,246,0.08)",
                          border: "1px solid rgba(59,130,246,0.25)",
                          ...(isMine ? { borderBottomRightRadius: 4 } : { borderBottomLeftRadius: 4 }),
                        }}>
                          <div className="px-4 pt-4 pb-3">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="h-4 w-4 shrink-0" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#60a5fa" }}>Mødeindvitation</span>
                            </div>
                            <p className="text-sm font-bold text-white mb-1">{(msg.meeting_data as MeetingData).title}</p>
                            <p className="text-xs" style={{ color: "#64748b" }}>
                              {new Date((msg.meeting_data as MeetingData).date).toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })} · {(msg.meeting_data as MeetingData).time}
                            </p>
                            {!isMine && msg.invite_status === "pending" && (
                              <div className="flex gap-2 mt-3">
                                <button onClick={() => handleInviteResponse(msg, true)} className="flex-1 rounded-xl py-2 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>Accepter</button>
                                <button onClick={() => handleInviteResponse(msg, false)} className="flex-1 rounded-xl py-2 text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>Afvis</button>
                              </div>
                            )}
                            {msg.invite_status === "accepted" && (
                              <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "#4ade80" }}>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                {isMine ? "Accepteret" : "Accepteret — tilføjet til kalender"}
                              </div>
                            )}
                            {msg.invite_status === "declined" && (
                              <p className="mt-3 text-xs" style={{ color: "#f87171" }}>Afvist</p>
                            )}
                          </div>
                          <p className={`text-[10px] px-4 pb-3 ${isMine ? "text-right" : ""}`} style={{ color: "#334155" }}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      ) : (
                        <div
                          className="max-w-xs rounded-2xl px-4 py-2.5"
                          style={isMine
                            ? { background: "linear-gradient(135deg, #3b82f6, #06b6d4)", borderBottomRightRadius: 4 }
                            : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderBottomLeftRadius: 4 }}
                        >
                          <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-right" : ""}`} style={{ color: isMine ? "rgba(255,255,255,0.55)" : "#334155" }}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      )}
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
    </AppLayout>
  );
}
