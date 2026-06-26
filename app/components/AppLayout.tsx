"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { createClient } from "@/app/lib/supabase";
import { useUser } from "@/app/lib/useUser";
import { PLANS, BANNER_ADS, POPUP_ADS } from "@/app/lib/data";
import type { PlanMeta } from "@/app/types";

interface Props {
  children: React.ReactNode;
  activeHref: string;
  sidebarExtra?: React.ReactNode;
}

export default function AppLayout({ children, activeHref, sidebarExtra }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [plan, setPlan] = useState<PlanMeta>(PLANS.gratis);
  const { user } = useUser();

  // Ads
  const [adDismissed, setAdDismissed] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const [adIndex2, setAdIndex2] = useState(4);
  const [bottomAdIndex, setBottomAdIndex] = useState(2);
  const [bottomDismissed, setBottomDismissed] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupIndex, setPopupIndex] = useState(0);
  const [popupCountdown, setPopupCountdown] = useState(5);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("plan").eq("id", user.id).single().then(({ data }) => {
      if (data?.plan && PLANS[data.plan]) setPlan(PLANS[data.plan]);
    });
  }, [user]);

  const showAds = plan.id === "gratis";
  const ad = BANNER_ADS[adIndex];
  const ad2 = BANNER_ADS[adIndex2 % BANNER_ADS.length];
  const bottomAd = BANNER_ADS[bottomAdIndex];
  const popupAd = POPUP_ADS[popupIndex];

  // Roter banner-annonce hvert 30. sekund
  useEffect(() => {
    if (!showAds) return;
    const id = setInterval(() => {
      setAdIndex((i) => (i + 1) % BANNER_ADS.length);
      setAdDismissed(false);
    }, 30_000);
    return () => clearInterval(id);
  }, [showAds]);

  // Roter anden banner hvert 45. sekund
  useEffect(() => {
    if (!showAds) return;
    const id = setInterval(() => setAdIndex2((i) => (i + 1) % BANNER_ADS.length), 45_000);
    return () => clearInterval(id);
  }, [showAds]);

  // Roter bottom bar hvert 20. sekund
  useEffect(() => {
    if (!showAds) return;
    const id = setInterval(() => {
      setBottomAdIndex((i) => (i + 1) % BANNER_ADS.length);
      setBottomDismissed(false);
    }, 20_000);
    return () => clearInterval(id);
  }, [showAds]);

  // Popup-annonce hvert 10. minut
  useEffect(() => {
    if (!showAds) { setPopupVisible(false); return; }
    const id = setInterval(() => {
      setPopupIndex((i) => (i + 1) % POPUP_ADS.length);
      setPopupCountdown(5);
      setPopupVisible(true);
    }, 600_000);
    return () => clearInterval(id);
  }, [showAds]);

  // Countdown til popup kan lukkes
  useEffect(() => {
    if (!popupVisible || popupCountdown <= 0) return;
    const id = setTimeout(() => setPopupCountdown((c) => c - 1), 1_000);
    return () => clearTimeout(id);
  }, [popupVisible, popupCountdown]);

  return (
    <div className="flex min-h-screen" style={{ background: "#05070f" }}>

      {/* Popup-annonce */}
      {showAds && popupVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
          <div className="animate-fade-in relative w-full max-w-md mx-4 rounded-3xl overflow-hidden" style={{ background: "#0a0d1a", border: `1px solid ${popupAd.border}`, boxShadow: "0 0 80px rgba(0,0,0,0.8)" }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#334155" }}>Annonce · Gratis-plan</span>
              {popupCountdown > 0
                ? <span className="text-xs font-semibold" style={{ color: "#475569" }}>Luk om {popupCountdown} sek.</span>
                : <button onClick={() => setPopupVisible(false)} className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)" }}>
                    Luk <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
              }
            </div>
            <div className="p-8 text-center" style={{ background: popupAd.bg }}>
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white" style={{ background: popupAd.logoColor, boxShadow: `0 8px 32px ${popupAd.border}` }}>
                {popupAd.logo}
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: popupAd.color }}>{popupAd.brand}</p>
              <h2 className="text-2xl font-black text-white mb-2">{popupAd.headline}</h2>
              <p className="text-sm mb-8" style={{ color: "#94a3b8" }}>{popupAd.sub}</p>
              <button className="w-full rounded-2xl py-3.5 text-sm font-bold text-white" style={{ background: popupAd.logoColor, boxShadow: `0 8px 24px ${popupAd.border}` }}>
                {popupAd.cta}
              </button>
            </div>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs" style={{ color: "#334155" }}>Disse popups vises på Gratis-planen</p>
              <Link href="/subscription" onClick={() => setPopupVisible(false)} className="text-xs font-semibold" style={{ color: "#60a5fa" }}>Opgrader for at fjerne →</Link>
            </div>
          </div>
        </div>
      )}

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

      {/* Indhold */}
      <div className="flex-1 overflow-auto flex flex-col">

        {/* Banner-annonce (toppen) */}
        {showAds && !adDismissed && (
          <div className="animate-fade-in shrink-0">
            {/* Primær banner */}
            <div className="relative overflow-hidden" style={{ background: ad.bg, borderBottom: `1px solid ${ad.border}` }}>
              <div className="flex items-center justify-between px-4 py-1.5" style={{ borderBottom: `1px solid ${ad.border}`, background: "rgba(0,0,0,0.2)" }}>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#334155" }}>Sponsoreret indhold · Annonce</span>
                <button onClick={() => setAdDismissed(true)} style={{ color: "#334155" }}>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="flex items-center gap-5 px-6 py-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white" style={{ background: ad.color, boxShadow: `0 6px 20px ${ad.border}` }}>{ad.logo}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: ad.color }}>{ad.brand}</p>
                  <p className="text-base font-black text-white leading-tight">{ad.headline}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{ad.sub}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button className="rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: ad.color, boxShadow: `0 4px 20px ${ad.border}` }}>Læs mere →</button>
                  <Link href="/subscription" className="text-xs font-semibold" style={{ color: "#475569" }}>Fjern annoncer</Link>
                </div>
              </div>
            </div>
            {/* Sekundær kompakt banner */}
            <div className="flex items-center gap-4 px-6 py-2.5" style={{ background: ad2.bg, borderBottom: `1px solid ${ad2.border}` }}>
              <span className="text-[10px] font-semibold uppercase tracking-widest shrink-0" style={{ color: "#334155" }}>Annonce</span>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white" style={{ background: ad2.color }}>{ad2.logo}</div>
              <span className="text-xs font-bold shrink-0" style={{ color: ad2.color }}>{ad2.brand}</span>
              <span className="text-xs font-semibold text-white truncate">{ad2.headline}</span>
              <span className="hidden sm:inline text-xs shrink-0" style={{ color: "#64748b" }}>{ad2.sub}</span>
              <button className="ml-auto shrink-0 rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ background: ad2.color }}>Læs mere →</button>
            </div>
          </div>
        )}

        <div className={`flex-1${showAds && !bottomDismissed ? " pb-12" : ""}`}>{children}</div>

        {/* Sticky bottom bar */}
        {showAds && !bottomDismissed && (
          <div className="fixed bottom-0 left-0 lg:left-64 right-0 z-30 flex items-center gap-3 px-5 py-2.5" style={{ background: "#080b18", borderTop: `1px solid ${bottomAd.border}` }}>
            <span className="text-[10px] font-semibold uppercase tracking-widest shrink-0" style={{ color: "#334155" }}>Annonce</span>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white" style={{ background: bottomAd.color }}>{bottomAd.logo}</div>
            <span className="text-xs font-bold shrink-0" style={{ color: bottomAd.color }}>{bottomAd.brand}</span>
            <span className="hidden sm:inline text-xs font-semibold text-white truncate">{bottomAd.headline}</span>
            <span className="hidden md:inline text-xs shrink-0" style={{ color: "#64748b" }}>{bottomAd.sub}</span>
            <button className="ml-auto shrink-0 rounded-lg px-4 py-1.5 text-xs font-bold text-white" style={{ background: bottomAd.color, boxShadow: `0 4px 16px ${bottomAd.border}` }}>Læs mere →</button>
            <Link href="/subscription" className="shrink-0 text-xs" style={{ color: "#475569" }}>Fjern</Link>
            <button onClick={() => setBottomDismissed(true)} style={{ color: "#334155" }}>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile hamburger */}
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
