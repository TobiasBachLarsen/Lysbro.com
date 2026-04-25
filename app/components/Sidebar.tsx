"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PlanMeta } from "@/app/types";
import { createClient } from "@/app/lib/supabase";

// ── Icons ────────────────────────────────────────────────────────────────────

const Icons = {
  dashboard:    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  meetings:     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>,
  calendar:     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>,
  contacts:     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>,
  history:      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  subscription: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  profile:      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>,
};

const NAV_LINKS = [
  { href: "/profile",      label: "Profil",      icon: "profile"      },
  { href: "/dashboard",    label: "Overblik",    icon: "dashboard"    },
  { href: "/meetings",     label: "Møder",       icon: "meetings"     },
  { href: "/calendar",     label: "Kalender",    icon: "calendar"     },
  { href: "/contacts",     label: "Kontakter",   icon: "contacts"     },
  { href: "/history",      label: "Historik",    icon: "history"      },
  { href: "/subscription", label: "Abonnement",  icon: "subscription" },
] as const;

const NOTIFICATIONS: { id: number; text: string; sub: string; color: string; read: boolean }[] = [];

// ── Types ─────────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeHref: string;
  plan: PlanMeta;
  extra?: React.ReactNode;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({ activeHref, plan, extra, mobileOpen = false, onMobileClose }: SidebarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userInitials, setUserInitials] = useState("?");
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email ?? "");
        const name = user.user_metadata?.full_name ?? user.email ?? "";
        setUserInitials(name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2));
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        className="flex h-16 shrink-0 items-center gap-3 px-6"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-8 w-8 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 16px rgba(59,130,246,0.4)" }}
        >
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
        </div>
        <span className="text-lg font-black tracking-tight text-white">Agora</span>

        {/* Mobile close button */}
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg transition-all"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#475569")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ href, label, icon }) => {
          const active = href === activeHref;
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
              style={
                active
                  ? { background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(6,182,212,0.12))", border: "1px solid rgba(59,130,246,0.3)", color: "#ffffff" }
                  : { color: "#64748b", border: "1px solid transparent" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#94a3b8";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                  (e.currentTarget as HTMLAnchorElement).style.color = "#64748b";
                }
              }}
            >
              <span style={{ color: active ? "#60a5fa" : "inherit" }}>
                {Icons[icon as keyof typeof Icons]}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Plan usage card */}
        <div
          className="rounded-xl p-4"
          style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold" style={{ color: "#93c5fd" }}>{plan.label}-plan</p>
            {plan.meetingsMax && (
              <span className="text-xs" style={{ color: plan.meetingsUsed >= plan.meetingsMax ? "#f87171" : "#60a5fa" }}>
                {plan.meetingsUsed}/{plan.meetingsMax}
              </span>
            )}
          </div>
          <p className="text-xs mb-3" style={{ color: "#475569" }}>
            {plan.meetingsMax ? "møder brugt denne måned" : "ubegrænsede møder"}
          </p>
          {plan.meetingsMax && (
            <div className="h-1 w-full rounded-full mb-3" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-1 rounded-full transition-all"
                style={{
                  width: `${Math.min((plan.meetingsUsed / plan.meetingsMax) * 100, 100)}%`,
                  background: plan.meetingsUsed >= plan.meetingsMax ? "#ef4444" : "linear-gradient(90deg, #3b82f6, #06b6d4)",
                }}
              />
            </div>
          )}
          {plan.id === "gratis" && (
            <Link
              href="/subscription"
              onClick={onMobileClose}
              className="block text-center rounded-lg py-1.5 text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
            >
              Opgrader plan
            </Link>
          )}
        </div>

        {/* Extra slot */}
        {extra}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
            style={{ color: notifOpen ? "#94a3b8" : "#64748b", border: "1px solid transparent", background: notifOpen ? "rgba(255,255,255,0.05)" : "transparent" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
            onMouseLeave={(e) => { if (!notifOpen) { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; } }}
          >
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              Notifikationer
            </div>
            {unread > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: "#3b82f6" }}>
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl overflow-hidden"
              style={{ background: "#080b18", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 -24px 60px rgba(0,0,0,0.6)" }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs font-bold text-white">Notifikationer</p>
                <button className="text-xs" style={{ color: "#475569" }} onClick={() => setNotifOpen(false)}>
                  Luk
                </button>
              </div>
              {NOTIFICATIONS.map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-4 py-3 transition-all"
                  style={{ opacity: n.read ? 0.5 : 1, borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: n.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white leading-tight">{n.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{n.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}
          >
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userEmail}</p>
            <p className="text-xs" style={{ color: "#475569" }}>{plan.label}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="transition"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#f87171")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#475569")}
            title="Log ud"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-64 shrink-0 flex-col"
        style={{ background: "#080b18", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className="lg:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col transition-transform duration-300"
        style={{
          background: "#080b18",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
