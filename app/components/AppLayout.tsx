"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import type { PlanMeta } from "@/app/types";
import { PLANS } from "@/app/lib/data";

interface AppLayoutProps {
  children: React.ReactNode;
  activeHref: string;
  plan?: PlanMeta;
  sidebarExtra?: React.ReactNode;
}

export default function AppLayout({
  children,
  activeHref,
  plan = PLANS.gratis,
  sidebarExtra,
}: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: "#05070f" }}>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        activeHref={activeHref}
        plan={plan}
        extra={sidebarExtra}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto">{children}</div>

      {/* Mobile hamburger button */}
      <button
        className="fixed bottom-6 left-6 z-40 lg:hidden flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-2xl transition-transform active:scale-95"
        style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 8px 32px rgba(59,130,246,0.4)" }}
        onClick={() => setMobileOpen(true)}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
    </div>
  );
}
