"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

const plans = [
  {
    id: "gratis",
    name: "Gratis",
    price: "0",
    priceLabel: "gratis",
    description: "Til enkeltpersoner og studerende",
    features: ["2 møder pr. måned", "Op til 2 deltagere", "Krypterede møder", "Europæisk hosting", "Annoncer under møder"],
    inherit: null,
    badge: null,
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Professionel",
    price: "249",
    priceLabel: "kr./md.",
    description: "Til freelancere og små teams",
    features: ["Ubegrænsede møder", "Op til 25 deltagere", "Ingen reklamer", "Kalenderintegration", "E-mail invitationer"],
    inherit: "Alt i Gratis, plus:",
    badge: "Mest populær",
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    highlighted: true,
  },
  {
    id: "erhverv",
    name: "Erhverv",
    price: "1.499",
    priceLabel: "kr./md. inkl. 5 brugere",
    description: "Til organisationer med høje krav",
    features: ["100+ deltagere", "GDPR-databehandleraftale", "Admin-dashboard & SLA", "5 org-brugere inkl. · +99 kr/md per ekstra"],
    inherit: "Alt i Professionel, plus:",
    badge: null,
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    highlighted: false,
  },
];

const invoices: { date: string; description: string; amount: string }[] = [];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState("gratis");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (data?.plan) setCurrentPlan(data.plan);
    });
  }, []);

  const activePlan = plans.find(p => p.id === currentPlan) ?? plans[0];

  return (
    <AppLayout activeHref="/subscription">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Abonnement</h1>
          <p className="text-xs" style={{ color: "#475569" }}>
            Du er på <span style={{ color: "#60a5fa" }}>{activePlan.name}-planen</span>
            {currentPlan === "gratis" ? " — opgrader for at fjerne reklamer" : " — tak for dit abonnement"}
          </p>
        </div>
      </header>

      <main className="p-8 space-y-8">

        {/* Coming soon notice */}
        <div className="flex items-start gap-4 rounded-2xl px-6 py-5" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
          <svg className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#fbbf24" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#fbbf24" }}>Betalingsmodul under udvikling</p>
            <p className="text-xs mt-1" style={{ color: "#92400e" }}>
              Det er endnu ikke muligt at skifte abonnement selv. Planændringer håndteres manuelt — kontakt os for at opgradere.
            </p>
          </div>
        </div>

        {/* Plan cards — informational only */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: "#475569" }}>Tilgængelige planer</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlan;
              return (
                <div
                  key={plan.id}
                  className="relative flex flex-col rounded-2xl p-6"
                  style={isCurrent ? {
                    background: plan.bg,
                    border: `1px solid ${plan.border}`,
                    boxShadow: `0 0 30px ${plan.bg}`,
                  } : {
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    opacity: 0.7,
                  }}
                >
                  {isCurrent && (
                    <span className="absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>
                      Nuværende
                    </span>
                  )}
                  {plan.badge && !isCurrent && (
                    <span className="absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.35)" }}>
                      {plan.badge}
                    </span>
                  )}

                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <p className="text-xs mt-1 mb-4" style={{ color: "#64748b" }}>{plan.description}</p>

                  <div className="flex items-end gap-1 mb-5">
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="mb-1 text-sm" style={{ color: "#475569" }}>{plan.priceLabel}</span>
                  </div>

                  <ul className="flex-1 space-y-2.5">
                    {plan.inherit && (
                      <li className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#475569" }}>{plan.inherit}</li>
                    )}
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-xs" style={{ color: "#94a3b8" }}>
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: plan.bg, border: `1px solid ${plan.border}` }}>
                          <svg className="h-2.5 w-2.5" style={{ color: plan.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && (
                    <div className="mt-5 rounded-xl py-2.5 text-center text-xs font-semibold" style={{ background: "rgba(255,255,255,0.04)", color: "#334155", border: "1px solid rgba(255,255,255,0.06)" }}>
                      Kommer snart
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice history */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(59,130,246,0.12)" }}>
                <svg className="h-3.5 w-3.5" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h2 className="text-sm font-semibold text-white">Fakturering</h2>
            </div>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#64748b" }}>
              {invoices.length} fakturaer
            </span>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {invoices.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <p className="text-sm" style={{ color: "#334155" }}>
                  {currentPlan === "gratis" ? "Ingen fakturaer endnu — du er på Gratis-planen." : "Ingen fakturaer endnu."}
                </p>
              </div>
            ) : invoices.map((invoice) => (
              <div
                key={invoice.date}
                className="flex items-center justify-between px-6 py-4 transition-all hover-row"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <svg className="h-4 w-4" style={{ color: "#475569" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{invoice.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#334155" }}>{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">{invoice.amount}</span>
                  <button
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover-blue-btn"
                    style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </AppLayout>
  );
}
