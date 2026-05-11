"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";
import { getInitials, AVATAR_COLORS } from "@/app/lib/utils";

type Member = { id: string; user_id: string; role: string; name: string; email: string; avatar_url: string | null; meetings: number; joinedAt: string };
type UpcomingMeeting = { id: string; title: string; date: string; time: string; duration: string | null; ownerName: string };
type PastMeeting = { id: string; title: string; date: string; time: string; duration: string | null; ownerName: string };
type Announcement = { id: string; content: string; authorName: string; authorAvatar: string | null; created_at: string };
type MonthBar = { label: string; key: string; count: number };
type OrgMessage = { id: string; sender_id: string; senderName: string; senderAvatar: string | null; content: string; created_at: string };

type MemberRow = { id: string; user_id: string; role: string; created_at: string };
type ProfileRow = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };
type MeetingRow = { id: string; title: string; date: string; time: string; duration: string | null; user_id: string };
type AnnRow = { id: string; content: string; author_id: string; created_at: string };
type OrgMsgRow = { id: string; sender_id: string; content: string; created_at: string };
type RealtimeOrgMsg = { id: string; sender_id: string; content: string; created_at: string; org_id: string };
type RealtimeAnn = { id: string; content: string; author_id: string; created_at: string };

const FREE_SEATS = 5;
const EXTRA_SEAT_PRICE = 99;

const DA_MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function SeatBar({ used, free }: { used: number; free: number }) {
  const pct = Math.min((used / Math.max(free, 1)) * 100, 100);
  const over = Math.max(used - free, 0);
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="text-3xl font-black text-white">{used}</span>
          <span className="text-sm ml-1" style={{ color: "#64748b" }}>/ {free} inkluderede pladser</span>
        </div>
        {over > 0 && (
          <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }}>
            +{over} ekstra · {over * EXTRA_SEAT_PRICE} kr/md
          </span>
        )}
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: over > 0 ? "linear-gradient(90deg, #a78bfa, #fbbf24)" : "linear-gradient(90deg, #a78bfa, #8b5cf6)" }} />
      </div>
      <p className="mt-1.5 text-xs" style={{ color: "#475569" }}>
        {over === 0 ? `${free - used} plads${free - used === 1 ? "" : "er"} tilbage — yderligere +${EXTRA_SEAT_PRICE} kr/md per ekstra` : `Du betaler ekstra for ${over} plads${over === 1 ? "" : "er"}`}
      </p>
    </div>
  );
}

function MeetingBarChart({ bars }: { bars: MonthBar[] }) {
  const max = Math.max(...bars.map(b => b.count), 1);
  return (
    <div className="flex items-end gap-2 h-28 pt-2">
      {bars.map((bar) => (
        <div key={bar.key} className="flex-1 flex flex-col items-center gap-1.5">
          <span className="text-[10px] font-semibold" style={{ color: bar.count > 0 ? "#a78bfa" : "transparent" }}>{bar.count || ""}</span>
          <div className="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden" style={{ height: `${Math.max((bar.count / max) * 72, bar.count > 0 ? 8 : 2)}px`, background: bar.count > 0 ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)", border: bar.count > 0 ? "1px solid rgba(139,92,246,0.35)" : "1px solid rgba(255,255,255,0.06)" }}>
            {bar.count > 0 && <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t" style={{ background: "linear-gradient(90deg, #a78bfa, #8b5cf6)" }} />}
          </div>
          <span className="text-[10px]" style={{ color: "#334155" }}>{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Lige nu";
  if (mins < 60) return `${mins} min siden`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} time${hrs === 1 ? "" : "r"} siden`;
  const days = Math.floor(hrs / 24);
  return `${days} dag${days === 1 ? "" : "e"} siden`;
}

export default function AdminPage() {
  const [userId, setUserId] = useState("");
  const [plan, setPlan] = useState("");
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingMeeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<PastMeeting[]>([]);
  const [monthBars, setMonthBars] = useState<MonthBar[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orgMeetingsTotal, setOrgMeetingsTotal] = useState(0);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSearch, setInviteSearch] = useState<{ id: string; full_name: string; email: string; avatar_url: string | null }[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteDone, setInviteDone] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [tab, setTab] = useState<"oversigt" | "opslagstavle" | "historik" | "beskeder" | "medlemmer" | "indstillinger">("oversigt");

  const [orgMessages, setOrgMessages] = useState<OrgMessage[]>([]);
  const [orgMsgInput, setOrgMsgInput] = useState("");
  const [sendingOrgMsg, setSendingOrgMsg] = useState(false);
  const [newAnn, setNewAnn] = useState(false);
  const [newMsg, setNewMsg] = useState(false);
  const orgMsgBottomRef = useRef<HTMLDivElement>(null);
  const annChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const orgMsgChannelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const currentUserIdRef = useRef<string>("");

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    currentUserIdRef.current = user.id;

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    setPlan(profile?.plan ?? "");

    const { data: membership } = await supabase.from("organization_members")
      .select("org_id, role").eq("user_id", user.id).maybeSingle();

    if (!membership) { setLoading(false); return; }
    setUserRole(membership.role as "admin" | "member");

    const { data: orgData } = await supabase.from("organizations").select("id, name").eq("id", membership.org_id).single();
    setOrg(orgData);
    setNewOrgName(orgData?.name ?? "");

    const isAdmin = membership.role === "admin";
    const today = new Date().toISOString().slice(0, 10);

    let memberList: Member[] = [];
    if (isAdmin) {
      const { data: memberRows } = await supabase.from("organization_members")
        .select("id, user_id, role, created_at").eq("org_id", membership.org_id).order("created_at", { ascending: true });

      const userIds = (memberRows ?? []).map((m: MemberRow) => m.user_id);
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", userIds)
        : { data: [] as ProfileRow[] };

      memberList = await Promise.all((memberRows ?? []).map(async (m: MemberRow) => {
        const p = (profiles ?? []).find((p: ProfileRow) => p.id === m.user_id);
        const { count } = await supabase.from("meetings").select("id", { count: "exact" }).eq("user_id", m.user_id);
        return {
          id: m.id, user_id: m.user_id, role: m.role,
          name: p?.full_name ?? p?.email ?? "Ukendt",
          email: p?.email ?? "",
          avatar_url: p?.avatar_url ?? null,
          meetings: count ?? 0,
          joinedAt: m.created_at,
        };
      }));
      setMembers(memberList);

      const { count: orgMeetingCount } = await supabase.from("meetings")
        .select("id", { count: "exact" }).eq("org_id", membership.org_id);
      setOrgMeetingsTotal(orgMeetingCount ?? 0);
    } else {
      const { count: myOrgMeetingCount } = await supabase.from("meetings")
        .select("id", { count: "exact" }).eq("org_id", membership.org_id).eq("user_id", user.id);
      setOrgMeetingsTotal(myOrgMeetingCount ?? 0);
    }

    const upcomingQuery = supabase.from("meetings")
      .select("id, title, date, time, duration, user_id")
      .eq("org_id", membership.org_id)
      .gte("date", today)
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .limit(5);

    const { data: upcomingData } = isAdmin ? await upcomingQuery : await upcomingQuery.eq("user_id", user.id);
    setUpcoming((upcomingData ?? []).map((mt: MeetingRow) => {
      const owner = memberList.find(m => m.user_id === mt.user_id);
      return { id: mt.id, title: mt.title, date: mt.date, time: mt.time, duration: mt.duration, ownerName: owner?.name ?? "Ukendt" };
    }));

    const pastQuery = supabase.from("meetings")
      .select("id, title, date, time, duration, user_id")
      .eq("org_id", membership.org_id)
      .lt("date", today)
      .order("date", { ascending: false })
      .limit(50);

    const { data: pastData } = isAdmin ? await pastQuery : await pastQuery.eq("user_id", user.id);
    const pastList = (pastData ?? []).map((mt: MeetingRow) => {
      const owner = memberList.find(m => m.user_id === mt.user_id);
      return { id: mt.id, title: mt.title, date: mt.date, time: mt.time, duration: mt.duration, ownerName: owner?.name ?? "Ukendt" };
    });
    setPastMeetings(pastList);

    const bars: MonthBar[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const mo = d.getMonth();
      const count = pastList.filter(mt => {
        const md = new Date(mt.date);
        return md.getFullYear() === y && md.getMonth() === mo;
      }).length;
      bars.push({ label: DA_MONTHS[mo], key: `${y}-${mo}`, count });
    }
    setMonthBars(bars);

    const { data: annRows } = await supabase.from("org_announcements")
      .select("id, content, author_id, created_at")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .limit(20);

    const authorIds = [...new Set((annRows ?? []).map((a: AnnRow) => a.author_id))];
    const { data: authorProfiles } = authorIds.length
      ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", authorIds)
      : { data: [] as ProfileRow[] };

    setAnnouncements((annRows ?? []).map((a: AnnRow) => {
      const ap = (authorProfiles ?? []).find((p: ProfileRow) => p.id === a.author_id);
      return { id: a.id, content: a.content, authorName: ap?.full_name ?? ap?.email ?? "Ukendt", authorAvatar: ap?.avatar_url ?? null, created_at: a.created_at };
    }));

    const annSeenAt = typeof window !== "undefined" ? localStorage.getItem("announcements_seen_at") : null;
    const hasUnseenAnns = annSeenAt
      ? (annRows ?? []).some((a: AnnRow) => new Date(a.created_at) > new Date(annSeenAt))
      : (annRows ?? []).length > 0;
    if (hasUnseenAnns) setNewAnn(true);

    const { data: orgMsgRows } = await supabase.from("org_messages")
      .select("id, sender_id, content, created_at")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: true })
      .limit(100);

    const msgSenderIds = [...new Set((orgMsgRows ?? []).map((m: OrgMsgRow) => m.sender_id))];
    const { data: msgSenderProfiles } = msgSenderIds.length
      ? await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", msgSenderIds)
      : { data: [] as ProfileRow[] };

    setOrgMessages((orgMsgRows ?? []).map((m: OrgMsgRow) => {
      const p = (msgSenderProfiles ?? []).find((p: ProfileRow) => p.id === m.sender_id);
      return { id: m.id, sender_id: m.sender_id, senderName: p?.full_name ?? p?.email ?? "Ukendt", senderAvatar: p?.avatar_url ?? null, content: m.content, created_at: m.created_at };
    }));

    const msgSeenAt = typeof window !== "undefined" ? localStorage.getItem("org_messages_seen_at") : null;
    const hasUnseenMsgs = msgSeenAt
      ? (orgMsgRows ?? []).some((m: OrgMsgRow) => m.sender_id !== user.id && new Date(m.created_at) > new Date(msgSeenAt))
      : (orgMsgRows ?? []).some((m: OrgMsgRow) => m.sender_id !== user.id);
    if (hasUnseenMsgs) setNewMsg(true);

    setLoading(false);
  };

  useEffect(() => {
    if (!org?.id) return;
    const supabase = createClient();
    if (orgMsgChannelRef.current) supabase.removeChannel(orgMsgChannelRef.current);
    const ch = supabase
      .channel(`org-messages-${org.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "org_messages" }, async (payload) => {
        const m = payload.new as RealtimeOrgMsg;
        if (m.org_id !== org.id) return;
        const { data: p } = await supabase.from("profiles").select("full_name, email, avatar_url").eq("id", m.sender_id).single();
        const newMsg: OrgMessage = { id: m.id, sender_id: m.sender_id, senderName: p?.full_name ?? p?.email ?? "Ukendt", senderAvatar: p?.avatar_url ?? null, content: m.content, created_at: m.created_at };
        setOrgMessages((prev) => [...prev, newMsg]);
        if (m.sender_id !== currentUserIdRef.current) setNewMsg(true);
      })
      .subscribe();
    orgMsgChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [org?.id]);

  useEffect(() => {
    orgMsgBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [orgMessages]);

  useEffect(() => {
    if (!org) return;
    const supabase = createClient();
    if (annChannelRef.current) supabase.removeChannel(annChannelRef.current);
    const ch = supabase
      .channel(`org-announcements-${org.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "org_announcements", filter: `org_id=eq.${org.id}` }, async (payload) => {
        const a = payload.new as RealtimeAnn;
        const { data: p } = await supabase.from("profiles").select("full_name, email, avatar_url").eq("id", a.author_id).single();
        const ann: Announcement = { id: a.id, content: a.content, authorName: p?.full_name ?? p?.email ?? "Ukendt", authorAvatar: p?.avatar_url ?? null, created_at: a.created_at };
        setAnnouncements((prev) => [ann, ...prev]);
        if (a.author_id !== currentUserIdRef.current) setNewAnn(true);
      })
      .subscribe();
    annChannelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [org]);

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim() || !org) return;
    setPostingAnnouncement(true);
    const supabase = createClient();
    await supabase.from("org_announcements").insert({ org_id: org.id, author_id: userId, content: newAnnouncement.trim() });
    setNewAnnouncement("");
    setPostingAnnouncement(false);
    loadData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await createClient().from("org_announcements").delete().eq("id", id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleSendOrgMessage = async () => {
    if (!orgMsgInput.trim() || !org) return;
    setSendingOrgMsg(true);
    const supabase = createClient();
    await supabase.from("org_messages").insert({ org_id: org.id, sender_id: userId, content: orgMsgInput.trim() });
    setOrgMsgInput("");
    setSendingOrgMsg(false);
  };

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    setCreating(true);
    setCreateError("");
    const supabase = createClient();
    const { data: newOrg, error: orgErr } = await supabase.from("organizations").insert({ name: orgName.trim() }).select("id, name").single();
    if (orgErr) { setCreateError("Kunne ikke oprette organisation: " + orgErr.message); setCreating(false); return; }
    const { error: memberErr } = await supabase.from("organization_members").insert({ org_id: newOrg.id, user_id: userId, role: "admin" });
    if (memberErr) { setCreateError("Kunne ikke tilføje admin: " + memberErr.message); setCreating(false); return; }
    await supabase.from("profiles").update({ org_id: newOrg.id }).eq("id", userId);
    setCreating(false);
    loadData();
  };

  const handleRename = async () => {
    if (!org || !newOrgName.trim() || newOrgName.trim() === org.name) { setRenaming(false); return; }
    setRenameLoading(true);
    await createClient().from("organizations").update({ name: newOrgName.trim() }).eq("id", org.id);
    setOrg(prev => prev ? { ...prev, name: newOrgName.trim() } : prev);
    setRenaming(false);
    setRenameLoading(false);
  };

  const searchUsers = async (q: string) => {
    setInviteEmail(q);
    if (q.length < 2) { setInviteSearch([]); return; }
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url")
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`).limit(5);
    setInviteSearch((data ?? []).filter((u: ProfileRow) => !members.find(m => m.user_id === u.id)));
  };

  const handleInvite = async (invitee: { id: string; full_name: string; email: string }) => {
    if (!org) return;
    setInviting(true);
    const supabase = createClient();
    await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: invitee.id,
      content: `Du er inviteret til at joine organisationen "${org.name}"`,
      type: "org_invite",
      meeting_data: { org_id: org.id, org_name: org.name },
      invite_status: "pending",
    });
    setInviteEmail("");
    setInviteSearch([]);
    setInviteDone(invitee.full_name || invitee.email);
    setTimeout(() => setInviteDone(""), 3000);
    setInviting(false);
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    await createClient().from("organization_members").update({ role: newRole }).eq("id", memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
  };

  const handleRemove = async (memberId: string, memberUserId: string) => {
    const supabase = createClient();
    await supabase.from("organization_members").delete().eq("id", memberId);
    await supabase.from("profiles").update({ org_id: null }).eq("id", memberUserId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  if (!loading && plan !== "erhverv" && !userRole) return (
    <AppLayout activeHref="/admin">
      <header className="sticky top-0 z-30 flex h-16 items-center px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Organisation</h1>
          <p className="text-xs" style={{ color: "#475569" }}>Administrer din organisation og dine medlemmer</p>
        </div>
      </header>
      <main className="p-8">
        <div className="max-w-lg mx-auto glass rounded-2xl p-10 text-center space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.25)" }}>
            <svg className="h-8 w-8" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-2">Organisations-funktioner</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>Opret din organisation, inviter kolleger og administrer adgange — kun tilgængeligt på Erhverv-planen.</p>
          </div>
          <div className="rounded-xl p-4 text-left space-y-2" style={{ background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)" }}>
            {["Organisationsdashboard med statistik", "Inviter ubegrænsede kolleger", "Administrer roller og adgange", "Alle medlemmer får erhverv-fordele"].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-xs" style={{ color: "#94a3b8" }}>
                <svg className="h-3.5 w-3.5 shrink-0" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {f}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold" style={{ color: "#475569" }}>1.499 kr/md inkl. 5 brugere · +99 kr/md per ekstra</p>
            <a href="/subscription" className="inline-block btn-gradient px-6 py-3 text-sm rounded-xl font-semibold">Opgrader til Erhverv</a>
          </div>
        </div>
      </main>
    </AppLayout>
  );

  if (loading) return (
    <AppLayout activeHref="/admin">
      <div className="flex h-screen items-center justify-center">
        <svg className="h-6 w-6 animate-spin" style={{ color: "#3b82f6" }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
      </div>
    </AppLayout>
  );

  if (!org) return (
    <AppLayout activeHref="/admin">
      <div className="flex h-screen items-center justify-center p-8">
        <div className="w-full max-w-md glass rounded-2xl p-8 text-center space-y-5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
            <svg className="h-7 w-7" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Opret din organisation</h2>
            <p className="text-sm" style={{ color: "#64748b" }}>Giv din organisation et navn og inviter dine kolleger</p>
          </div>
          <input className="input-dark" placeholder="Organisationsnavn" value={orgName} onChange={(e) => { setOrgName(e.target.value); setCreateError(""); }} />
          {createError && <p className="text-xs text-left" style={{ color: "#f87171" }}>{createError}</p>}
          <button onClick={handleCreate} disabled={creating || !orgName.trim()} className="btn-gradient w-full py-3 rounded-xl text-sm font-semibold" style={{ opacity: !orgName.trim() ? 0.5 : 1 }}>
            {creating ? "Opretter…" : "Opret organisation"}
          </button>
        </div>
      </div>
    </AppLayout>
  );

  const extraSeats = Math.max(members.length - FREE_SEATS, 0);
  const adminTabs = ["oversigt", "opslagstavle", "historik", "beskeder", "medlemmer", "indstillinger"] as const;
  const memberTabs = ["oversigt", "opslagstavle", "historik", "beskeder"] as const;
  const tabs = userRole === "admin" ? adminTabs : memberTabs;

  const tabLabels: Record<string, string> = {
    oversigt: "Oversigt", opslagstavle: "Opslagstavle", historik: "Historik",
    beskeder: "Beskeder", medlemmer: "Medlemmer", indstillinger: "Indstillinger",
  };

  return (
    <AppLayout activeHref="/admin">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">{org.name}</h1>
          <p className="text-xs" style={{ color: "#475569" }}>Organisationsdashboard</p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {tabs.map((t) => {
            const hasAlert = (t === "opslagstavle" && newAnn) || (t === "beskeder" && newMsg);
            const alertColor = t === "opslagstavle" ? "#f59e0b" : "#8b5cf6";
            return (
              <button key={t} onClick={() => {
                setTab(t as "oversigt" | "opslagstavle" | "historik" | "beskeder" | "medlemmer" | "indstillinger");
                if (t === "opslagstavle") {
                  setNewAnn(false);
                  if (typeof window !== "undefined") localStorage.setItem("announcements_seen_at", new Date().toISOString());
                }
                if (t === "beskeder") {
                  setNewMsg(false);
                  if (typeof window !== "undefined") localStorage.setItem("org_messages_seen_at", new Date().toISOString());
                }
              }}
                className="relative rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                style={tab === t
                  ? { background: hasAlert ? `rgba(${t === "opslagstavle" ? "245,158,11" : "139,92,246"},0.2)` : "rgba(139,92,246,0.2)", color: hasAlert ? alertColor : "#c4b5fd", boxShadow: hasAlert ? `0 0 10px ${alertColor}55` : "none" }
                  : { color: hasAlert ? alertColor : "#475569" }}
              >
                {hasAlert && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full animate-pulse" style={{ background: alertColor, boxShadow: `0 0 6px ${alertColor}` }} />
                )}
                {tabLabels[t]}
              </button>
            );
          })}
        </div>
      </header>

      <main className="p-8 space-y-6">

        {/* OVERSIGT */}
        {tab === "oversigt" && (() => {
          type StatCard = { label: string; value: string | number; color: string; bg: string; border: string };
          const statCards: StatCard[] = [
            ...(userRole === "admin" ? [{ label: "Medlemmer", value: members.length, color: "#a78bfa", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" }] : []),
            { label: userRole === "admin" ? "Org-møder i alt" : "Mine org-møder", value: orgMeetingsTotal, color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
            { label: "Kommende møder", value: upcoming.length, color: "#22d3ee", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
            ...(userRole === "admin" ? [{ label: "Ekstra pladser", value: extraSeats === 0 ? "Ingen" : `+${extraSeats}`, color: extraSeats > 0 ? "#fbbf24" : "#4ade80", bg: extraSeats > 0 ? "rgba(251,191,36,0.08)" : "rgba(74,222,128,0.08)", border: extraSeats > 0 ? "rgba(251,191,36,0.2)" : "rgba(74,222,128,0.2)" }] : []),
          ];
          return (
          <>
            <div className={`grid gap-4 ${userRole === "admin" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
              {statCards.map(({ label, value, color, bg, border }) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                  <p className="text-2xl font-black text-white truncate">{value}</p>
                </div>
              ))}
            </div>

            {userRole === "admin" && (
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                    <svg className="h-4 w-4" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </div>
                  <h2 className="text-sm font-bold text-white">Pladsforbrug</h2>
                </div>
                <SeatBar used={members.length} free={FREE_SEATS} />
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Kommende møder */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(6,182,212,0.12)" }}>
                    <svg className="h-3.5 w-3.5" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
                  </div>
                  <h2 className="text-sm font-bold text-white">Kommende møder</h2>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {upcoming.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm" style={{ color: "#334155" }}>Ingen kommende møder planlagt</p>
                  ) : upcoming.map((mt) => (
                    <div key={mt.id} className="flex items-center gap-3 px-6 py-3.5">
                      <div className="shrink-0 rounded-xl px-2.5 py-1.5 text-center min-w-[44px]" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
                        <p className="text-xs font-black" style={{ color: "#22d3ee" }}>{new Date(mt.date).getDate()}</p>
                        <p className="text-[10px]" style={{ color: "#0e7490" }}>{new Date(mt.date).toLocaleDateString("da-DK", { month: "short" })}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{mt.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{mt.time?.slice(0,5)} · {mt.ownerName}{mt.duration ? ` · ${mt.duration}` : ""}</p>
                      </div>
                      <Link href={`/room/${mt.id}`} className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa" }}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
                        Start
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aktivitetsdiagram */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.12)" }}>
                    <svg className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">Mødeaktivitet</h2>
                    <p className="text-xs" style={{ color: "#475569" }}>Afholdte org-møder per måned</p>
                  </div>
                </div>
                <MeetingBarChart bars={monthBars} />
              </div>
            </div>
          </>
          );
        })()}

        {/* OPSLAGSTAVLE */}

        {tab === "opslagstavle" && (
          <div className="max-w-2xl space-y-5">
            {userRole === "admin" && (
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                    <svg className="h-4 w-4" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                  </div>
                  <h2 className="text-sm font-bold text-white">Opret opslag</h2>
                </div>
                <textarea
                  className="input-dark resize-none w-full"
                  rows={3}
                  placeholder="Skriv en besked til hele organisationen…"
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handlePostAnnouncement}
                    disabled={postingAnnouncement || !newAnnouncement.trim()}
                    className="btn-gradient px-5 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ opacity: !newAnnouncement.trim() ? 0.5 : 1 }}
                  >
                    {postingAnnouncement ? "Sender…" : "Send opslag"}
                  </button>
                </div>
              </div>
            )}

            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-sm font-bold text-white">Opslag</h2>
                <span className="text-xs" style={{ color: "#475569" }}>{announcements.length} i alt</span>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {announcements.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm" style={{ color: "#334155" }}>Ingen opslag endnu</p>
                    {userRole === "admin" && <p className="text-xs mt-1" style={{ color: "#1e293b" }}>Brug formularen ovenfor til at skrive til hele organisationen</p>}
                  </div>
                ) : announcements.map((a) => (
                  <div key={a.id} className="px-6 py-4 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
                            {a.authorAvatar ? <Image src={a.authorAvatar} alt={a.authorName} width={24} height={24} className="h-full w-full object-cover" /> : getInitials(a.authorName)}
                          </div>
                          <span className="text-xs font-semibold text-white">{a.authorName}</span>
                          <span className="text-xs" style={{ color: "#334155" }}>· {timeAgo(a.created_at)}</span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{a.content}</p>
                      </div>
                      {userRole === "admin" && (
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 rounded-lg p-1.5 transition-all"
                          style={{ color: "#334155", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#334155"; }}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HISTORIK */}
        {tab === "historik" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: "Afholdte org-møder", value: pastMeetings.length, color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
                { label: "Denne måned", value: monthBars[monthBars.length - 1]?.count ?? 0, color: "#a78bfa", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
                { label: "Seneste møde", value: pastMeetings[0] ? formatDate(pastMeetings[0].date) : "—", color: "#22d3ee", bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)" },
              ].map(({ label, value, color, bg, border }) => (
                <div key={label} className="rounded-2xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                  <p className="text-2xl font-black text-white truncate">{value}</p>
                </div>
              ))}
            </div>

            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-sm font-bold text-white">Afholdte møder</h2>
                <span className="text-xs" style={{ color: "#475569" }}>{pastMeetings.length} møder</span>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {pastMeetings.length === 0 ? (
                  <p className="px-6 py-12 text-center text-sm" style={{ color: "#334155" }}>Ingen afholdte org-møder endnu</p>
                ) : pastMeetings.map((mt) => (
                  <div key={mt.id} className="flex items-center gap-4 px-6 py-3.5 transition-all hover:bg-white/[0.02]">
                    <div className="shrink-0 rounded-xl px-2.5 py-1.5 text-center min-w-[44px]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <p className="text-xs font-black text-white">{new Date(mt.date).getDate()}</p>
                      <p className="text-[10px]" style={{ color: "#475569" }}>{new Date(mt.date).toLocaleDateString("da-DK", { month: "short" })}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{mt.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                        {mt.time?.slice(0, 5)}{mt.ownerName !== "Ukendt" ? ` · ${mt.ownerName}` : ""}{mt.duration ? ` · ${mt.duration}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "#475569", border: "1px solid rgba(255,255,255,0.06)" }}>
                      Afholdt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEDLEMMER */}
        {tab === "medlemmer" && (
          <>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,211,238,0.12)" }}>
                  <svg className="h-4 w-4" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"/></svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Inviter nyt medlem</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Søg på navn eller e-mail for at tilføje</p>
                </div>
              </div>
              <div className="relative max-w-sm">
                <input className="input-dark" placeholder="Søg på navn eller e-mail…" value={inviteEmail} onChange={(e) => searchUsers(e.target.value)} />
                {inviteSearch.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {inviteSearch.map((u) => (
                      <button key={u.id} onClick={() => handleInvite(u)} disabled={inviting}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.06] transition-all"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                          {u.avatar_url ? <Image src={u.avatar_url} alt={u.full_name || u.email} width={32} height={32} className="h-full w-full object-cover" /> : getInitials(u.full_name || u.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.full_name || "Unavngivet"}</p>
                          <p className="text-xs truncate" style={{ color: "#475569" }}>{u.email}</p>
                        </div>
                        <span className="ml-auto text-xs font-semibold shrink-0" style={{ color: "#a78bfa" }}>Tilføj</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {inviteDone && <p className="mt-3 text-xs animate-fade-in" style={{ color: "#4ade80" }}>✓ {inviteDone} er tilføjet til organisationen</p>}
            </div>

            <div className="flex items-center gap-3 rounded-xl px-5 py-3.5" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.18)" }}>
              <svg className="h-4 w-4 shrink-0" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <p className="text-sm flex-1" style={{ color: "#94a3b8" }}>
                <span className="font-bold text-white">{members.length}</span> af <span className="font-bold text-white">{FREE_SEATS}</span> inkluderede pladser brugt
                {extraSeats > 0 && <span style={{ color: "#fbbf24" }}> · +{extraSeats * EXTRA_SEAT_PRICE} kr/md i ekstra pladser</span>}
              </p>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <h2 className="text-sm font-bold text-white">Alle medlemmer</h2>
                <span className="text-xs" style={{ color: "#475569" }}>{members.length} i alt</span>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {members.map((m, i) => (
                  <div key={m.id} className="flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/[0.02]">
                    <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {m.avatar_url ? <Image src={m.avatar_url} alt={m.name} width={36} height={36} className="h-full w-full object-cover" /> : getInitials(m.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                      <p className="text-xs truncate" style={{ color: "#475569" }}>{m.email}</p>
                    </div>
                    <div className="hidden sm:flex flex-col items-end shrink-0">
                      <span className="text-xs font-semibold text-white">{m.meetings}</span>
                      <span className="text-[10px]" style={{ color: "#334155" }}>møder</span>
                    </div>
                    <div className="hidden sm:block text-xs shrink-0" style={{ color: "#334155" }}>Tilmeldt {formatDate(m.joinedAt)}</div>
                    <select value={m.role} onChange={(e) => handleRoleChange(m.id, e.target.value)} disabled={m.user_id === userId}
                      className="rounded-lg px-2 py-1 text-xs font-semibold"
                      style={{ background: m.role === "admin" ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.06)", color: m.role === "admin" ? "#a78bfa" : "#64748b", border: "1px solid rgba(255,255,255,0.08)", cursor: m.user_id === userId ? "not-allowed" : "pointer" }}
                    >
                      <option value="member">Medlem</option>
                      <option value="admin">Admin</option>
                    </select>
                    {m.user_id !== userId && (
                      <button onClick={() => handleRemove(m.id, m.user_id)} className="shrink-0 rounded-lg p-1.5 transition-all hover:text-red-400" style={{ color: "#334155", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* BESKEDER — org group chat */}
        {tab === "beskeder" && (
          <div className="max-w-2xl flex flex-col" style={{ height: "calc(100vh - 13rem)" }}>
            <div className="glass rounded-2xl overflow-hidden flex flex-col h-full">
              <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <svg className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Organisationschat</h2>
                  <p className="text-xs" style={{ color: "#475569" }}>{members.length > 0 ? `${members.length} medlemmer` : "Alle org-medlemmer"}</p>
                </div>
              </div>

              {/* Message list */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
                {orgMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <svg className="h-6 w-6" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>
                    </div>
                    <p className="text-sm font-semibold text-white">Ingen beskeder endnu</p>
                    <p className="text-xs" style={{ color: "#334155" }}>Vær den første til at skrive noget til hele organisationen</p>
                  </div>
                ) : orgMessages.map((msg, i) => {
                  const isMe = msg.sender_id === userId;
                  const prevMsg = orgMessages[i - 1];
                  const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                      {showHeader && (
                        <div className="h-8 w-8 shrink-0 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", marginTop: "0" }}>
                          {msg.senderAvatar ? <Image src={msg.senderAvatar} alt={msg.senderName} width={32} height={32} className="h-full w-full object-cover" /> : getInitials(msg.senderName)}
                        </div>
                      )}
                      {!showHeader && <div className="w-8 shrink-0" />}
                      <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                        {showHeader && (
                          <div className={`flex items-baseline gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-xs font-semibold text-white">{isMe ? "Dig" : msg.senderName}</span>
                            <span className="text-[10px]" style={{ color: "#334155" }}>{timeAgo(msg.created_at)}</span>
                          </div>
                        )}
                        <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                          style={isMe
                            ? { background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.35)", color: "#e2e8f0", borderBottomRightRadius: "6px" }
                            : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#cbd5e1", borderBottomLeftRadius: "6px" }
                          }>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={orgMsgBottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 px-4 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-2 items-end">
                  <textarea
                    className="input-dark flex-1 resize-none"
                    rows={1}
                    placeholder="Skriv en besked til organisationen…"
                    value={orgMsgInput}
                    onChange={(e) => setOrgMsgInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendOrgMessage(); } }}
                    style={{ maxHeight: "120px", overflowY: "auto" }}
                  />
                  <button
                    onClick={handleSendOrgMessage}
                    disabled={sendingOrgMsg || !orgMsgInput.trim()}
                    className="shrink-0 rounded-xl p-2.5 transition-all"
                    style={{ background: orgMsgInput.trim() ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.04)", border: `1px solid ${orgMsgInput.trim() ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.08)"}`, color: orgMsgInput.trim() ? "#a78bfa" : "#334155" }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* INDSTILLINGER */}
        {tab === "indstillinger" && (
          <div className="max-w-lg space-y-5">
            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <svg className="h-4 w-4" style={{ color: "#a78bfa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                </div>
                <h2 className="text-sm font-bold text-white">Organisationsoplysninger</h2>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Organisationsnavn</label>
                {renaming ? (
                  <div className="flex gap-2">
                    <input className="input-dark flex-1" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} autoFocus />
                    <button onClick={handleRename} disabled={renameLoading} className="btn-gradient px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0">{renameLoading ? "Gemmer…" : "Gem"}</button>
                    <button onClick={() => { setRenaming(false); setNewOrgName(org.name); }} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0">Annuller</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>{org.name}</div>
                    <button onClick={() => setRenaming(true)} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-semibold shrink-0">Rediger</button>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide" style={{ color: "#64748b" }}>Organisations-ID</label>
                <div className="rounded-xl px-4 py-2.5 text-xs font-mono truncate" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#334155" }}>{org.id}</div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,211,238,0.12)" }}>
                  <svg className="h-4 w-4" style={{ color: "#22d3ee" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>
                </div>
                <h2 className="text-sm font-bold text-white">Abonnement</h2>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Erhverv</p>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>1.499 kr/md inkl. {FREE_SEATS} pladser{extraSeats > 0 && ` + ${extraSeats * EXTRA_SEAT_PRICE} kr/md for ${extraSeats} ekstra`}</p>
                </div>
                <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: "rgba(34,211,238,0.12)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.25)" }}>Aktiv</span>
              </div>
              <SeatBar used={members.length} free={FREE_SEATS} />
            </div>

            <div className="rounded-2xl p-6 space-y-4" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
                  <svg className="h-4 w-4" style={{ color: "#f87171" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                </div>
                <h2 className="text-sm font-bold" style={{ color: "#f87171" }}>Farezone</h2>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">Slet organisation</p>
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>Fjerner alle medlemmer og sletter organisationen permanent. Kan ikke fortrydes.</p>
                </div>
                <button
                  className="shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.2)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)"; }}
                  onClick={() => alert("Kontakt support for at slette din organisation.")}
                >
                  Slet organisation
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </AppLayout>
  );
}
