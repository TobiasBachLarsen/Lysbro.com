"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

const plans = [
  {
    id: "gratis",
    name: "Gratis",
    price: "0",
    description: "Til enkeltpersoner og studerende",
    features: ["Op til 3 møder/måned", "Maks. 5 deltagere pr. møde", "Krypterede møder", "Europæisk hosting", "Annoncer under møder"],
    badge: null,
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
  },
  {
    id: "pro",
    name: "Professionel",
    price: "200",
    description: "Til freelancere og små teams",
    features: ["Ubegrænsede møder", "Maks. 25 deltagere pr. møde", "Ingen reklamer", "Mødehistorik & optagelse", "Kalenderintegration", "E-mail invitationer"],
    badge: "Mest populær",
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
  },
  {
    id: "erhverv",
    name: "Erhverv",
    price: "1.000",
    description: "Til større organisationer",
    features: ["Ubegrænsede møder", "Op til 100+ deltagere", "Ingen reklamer", "GDPR-databehandleraftale", "SSO / SAML-login", "Admin-dashboard", "Prioriteret support & SLA"],
    badge: null,
    color: "#22d3ee",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
  },
];

const invoices: { date: string; description: string; amount: string }[] = [];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState("gratis");
  const [selected, setSelected] = useState("gratis");
  const [upgrading, setUpgrading] = useState(false);
  const [done, setDone] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (data?.plan) { setCurrentPlan(data.plan); setSelected(data.plan); }
    });
  }, []);

  const handleUpgrade = async () => {
    if (selected === currentPlan) return;
    setUpgrading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").upsert({ id: user?.id, plan: selected });
    setCurrentPlan(selected);
    setUpgrading(false);
    setDone(true);
  };

  return (
    <AppLayout activeHref="/subscription">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Abonnement</h1>
          <p className="text-xs" style={{ color: "#475569" }}>
            Du er på <span style={{ color: "#60a5fa" }}>{plans.find(p => p.id === currentPlan)?.name ?? "Gratis"}-planen</span>
            {currentPlan === "gratis" ? " — opgrader for at fjerne reklamer" : " — tak for dit abonnement"}
          </p>
        </div>
      </header>

      <main className="p-8 space-y-8">

        {done && (
          <div className="animate-fade-in flex items-center gap-3 rounded-xl px-5 py-4" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <svg className="h-5 w-5 shrink-0" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium" style={{ color: "#86efac" }}>
              Dit abonnement er opdateret. Ændringen træder i kraft med det samme.
            </p>
          </div>
        )}

        {/* Plan cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-5" style={{ color: "#475569" }}>Vælg plan</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className="relative flex flex-col rounded-2xl p-6 text-left transition-all duration-200"
                style={selected === plan.id ? {
                  background: plan.bg,
                  border: `1px solid ${plan.border}`,
                  boxShadow: `0 0 30px ${plan.bg}`,
                  transform: "translateY(-2px)",
                } : {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {currentPlan === plan.id && (
                  <span className="absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>
                    Nuværende
                  </span>
                )}
                {plan.badge && currentPlan !== plan.id && (
                  <span className="absolute top-4 right-4 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "rgba(139,92,246,0.2)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.35)" }}>
                    {plan.badge}
                  </span>
                )}

                {/* Radio indicator */}
                <div className="mb-4 flex h-4 w-4 items-center justify-center rounded-full" style={{
                  border: `2px solid ${selected === plan.id ? plan.color : "rgba(255,255,255,0.2)"}`,
                  background: selected === plan.id ? plan.color : "transparent",
                }}>
                  {selected === plan.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>

                <h3 className="text-base font-bold text-white">{plan.name}</h3>
                <p className="text-xs mt-1 mb-4" style={{ color: "#64748b" }}>{plan.description}</p>

                <div className="flex items-end gap-1 mb-5">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="mb-1 text-sm" style={{ color: "#475569" }}>{plan.id === "gratis" ? "gratis" : "kr./md."}</span>
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-xs" style={{ color: "#94a3b8" }}>
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full" style={{ background: `${plan.bg}`, border: `1px solid ${plan.border}` }}>
                        <svg className="h-2.5 w-2.5" style={{ color: plan.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleUpgrade}
            disabled={selected === currentPlan || upgrading || done}
            className="btn-gradient flex items-center gap-2 px-6 py-3"
            style={{ opacity: (selected === currentPlan || upgrading || done) ? 0.45 : 1, cursor: (selected === currentPlan || upgrading || done) ? "not-allowed" : "pointer" }}
          >
            {upgrading && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {upgrading ? "Opdaterer…" : "Skift abonnement"}
          </button>
          <p className="text-xs" style={{ color: "#334155" }}>
            Ingen binding · Opsig eller skift plan når som helst
          </p>
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
                className="flex items-center justify-between px-6 py-4 transition-all"
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
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
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                    style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.18)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.1)")}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl px-6 py-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg className="h-4 w-4 shrink-0" style={{ color: "#f87171" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Farezone — Opsig abonnement</p>
              </div>
              <p className="text-xs" style={{ color: "#7f1d1d" }}>
                Du bevarer adgang til udgangen af betalingsperioden. Alle data slettes efterfølgende.
              </p>
            </div>
            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.2)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.1)")}
              >
                Opsig abonnement
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-xs font-medium" style={{ color: "#f87171" }}>Er du sikker?</p>
                <button className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "#ef4444" }}>
                  Bekræft opsigelse
                </button>
                <button onClick={() => setCancelConfirm(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>
                  Fortryd
                </button>
              </div>
            )}
          </div>
        </div>

      </main>
    </AppLayout>
  );
}

