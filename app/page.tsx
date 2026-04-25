"use client";

import Link from "next/link";

const plans = [
  {
    name: "Gratis",
    price: "0",
    priceLabel: "gratis",
    description: "Til enkeltpersoner og studerende",
    features: ["3 møder pr. måned", "Op til 5 deltagere", "Krypterede møder", "Europæisk hosting", "Annoncer under møder"],
    note: null,
    cta: "Opret gratis konto",
    href: "/register",
    highlighted: false,
  },
  {
    name: "Professionel",
    price: "200",
    priceLabel: "kr./md.",
    description: "Til freelancere og små teams",
    features: ["Ubegrænsede møder", "Op til 25 deltagere", "Ingen reklamer", "Mødeoptagelse (30 dage)", "Kalenderintegration", "E-mail invitationer"],
    note: null,
    cta: "Vælg Professionel",
    href: "/register",
    highlighted: true,
  },
  {
    name: "Erhverv",
    price: "1.000",
    priceLabel: "kr./md.",
    description: "Til organisationer med høje krav",
    features: ["Ubegrænsede møder", "100+ deltagere", "Ingen reklamer", "GDPR-databehandleraftale", "SSO / SAML-login", "Admin-dashboard & SLA"],
    note: null,
    cta: "Kontakt os",
    href: "#contact",
    highlighted: false,
  },
];

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: "text-blue-400",
    bg: "rgba(59,130,246,0.12)",
    title: "End-to-end krypteret",
    description: "Alle møder er fuldt krypterede fra ende til ende. Ingen kan aflytte — heller ikke os.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
      </svg>
    ),
    color: "text-cyan-400",
    bg: "rgba(6,182,212,0.12)",
    title: "100% europæisk",
    description: "Servere udelukkende hos Hetzner i Europa. Dine data forlader aldrig EU.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    color: "text-violet-400",
    bg: "rgba(139,92,246,0.12)",
    title: "GDPR-compliant",
    description: "Bygget fra grunden til at overholde GDPR og dansk databeskyttelseslov.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    color: "text-amber-400",
    bg: "rgba(245,158,11,0.12)",
    title: "Start møde med ét klik",
    description: "Ingen installation, ingen ventetid. Klik og mød — direkte fra browseren.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: "text-green-400",
    bg: "rgba(34,197,94,0.12)",
    title: "Smart møde-planlægning",
    description: "Planlæg møder, send invitationer og håndter RSVP direkte fra portalen.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V7.5A2.25 2.25 0 0018 5.25H6A2.25 2.25 0 003.75 7.5V18A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
    color: "text-pink-400",
    bg: "rgba(236,72,153,0.12)",
    title: "Open source kernen",
    description: "Bygget på Jitsi Meet — gennemtestet teknologi med globalt fællesskab.",
  },
];

const avatars = ["M", "L", "K", "S", "A"];
const avatarColors = ["bg-blue-500", "bg-violet-500", "bg-cyan-500", "bg-pink-500", "bg-green-500"];

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: "#05070f" }}>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Agora</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: "#94a3b8" }}>
            <a href="#features" className="hover:text-white transition">Funktioner</a>
            <a href="#pricing" className="hover:text-white transition">Priser</a>
            <a href="#contact" className="hover:text-white transition">Kontakt</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium hover:text-white transition" style={{ color: "#94a3b8" }}>
              Log ind
            </Link>
            <Link href="/register" className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
              Kom i gang
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-44 mesh-animated dot-grid">
        {/* Orbs */}
        <div className="orb orb-blue animate-float" style={{ width: 600, height: 600, top: -200, left: -200, animationDelay: "0s" }} />
        <div className="orb orb-cyan animate-float" style={{ width: 400, height: 400, top: 100, right: -100, animationDelay: "2s" }} />
        <div className="orb orb-purple animate-float" style={{ width: 300, height: 300, bottom: 0, left: "40%", animationDelay: "4s" }} />

        <div className="relative mx-auto max-w-5xl px-6 text-center">
          {/* Badge */}
          <div className="animate-fade-in mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#93c5fd" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ background: "#4ade80", opacity: 0.75 }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#4ade80" }} />
            </span>
            Europæisk hosting &middot; GDPR-compliant &middot; Open source
          </div>

          {/* Headline */}
          <h1 className="mt-2 text-6xl font-black leading-[1.05] tracking-tight text-white md:text-7xl lg:text-8xl">
            Videomøder på
            <br />
            <span className="gradient-text">europæiske præmisser</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed" style={{ color: "#94a3b8" }}>
            Agora er en dansk videomøde-service bygget på Jitsi Meet og hostet udelukkende i Europa.
            Ingen data til USA. Ingen kompromiser.
          </p>

          {/* CTAs */}
          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-gradient flex w-full items-center justify-center gap-2 px-8 py-4 text-base rounded-2xl sm:w-auto">
              Start helt gratis
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <a href="#features" className="btn-ghost flex w-full items-center justify-center gap-2 px-8 py-4 text-base rounded-2xl sm:w-auto">
              Se funktioner
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm" style={{ color: "#64748b" }}>
            {["Gratis for altid", "Opgrader når du vil", "Data forbliver i EU", "Ingen kreditkort påkrævet"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Social proof bar */}
        <div className="relative mx-auto mt-20 max-w-5xl px-6">
          <div className="glass rounded-2xl px-8 py-5 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex -space-x-3">
              {avatars.map((a, i) => (
                <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full ${avatarColors[i]} text-xs font-bold text-white`} style={{ boxShadow: "0 0 0 2px #05070f" }}>
                  {a}
                </div>
              ))}
              <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: "rgba(255,255,255,0.08)", color: "#94a3b8", boxShadow: "0 0 0 2px #05070f" }}>
                +
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: "#94a3b8" }}>
              <span className="font-bold text-white">500+</span> europæiske virksomheder bruger Agora til daglige videomøder
            </p>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <svg key={i} className="h-4 w-4" style={{ color: "#fbbf24" }} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              ))}
              <span className="ml-1.5 text-sm font-semibold text-white">4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-32" style={{ background: "#05070f" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] gradient-text">Funktioner</p>
            <h2 className="text-4xl font-black text-white md:text-5xl">
              Hvorfor vælge Agora?
            </h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
              Samme kvalitet som de store platforme — med fuld kontrol over dine data og ingen kompromiser.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group glass rounded-2xl p-7 cursor-default"
                style={{ transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.35)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(59,130,246,0.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: f.bg }}>
                  <span className={f.color}>{f.icon}</span>
                </div>
                <h3 className="mb-2.5 text-base font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#94a3b8" }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-32" style={{ background: "linear-gradient(180deg, #05070f 0%, #080b18 50%, #05070f 100%)" }}>
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] gradient-text">Priser</p>
            <h2 className="text-4xl font-black text-white md:text-5xl">
              Enkle, gennemsigtige priser
            </h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: "#94a3b8" }}>
              Ingen overraskelser. Betal månedligt og opsig hvornår du vil.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-8 transition-all duration-300 ${plan.highlighted ? "gradient-border" : "glass"}`}
                style={plan.highlighted ? {
                  background: "rgba(59,130,246,0.08)",
                  boxShadow: "0 0 60px rgba(59,130,246,0.2)",
                  transform: "scale(1.03)",
                  border: "none",
                } : {}}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full px-4 py-1.5 text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 4px 16px rgba(59,130,246,0.4)" }}>
                      Mest populær
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm" style={{ color: plan.highlighted ? "#93c5fd" : "#64748b" }}>{plan.description}</p>
                  <div className="mt-6 flex items-end gap-1">
                    <span className="text-5xl font-black tracking-tight text-white">{plan.price}</span>
                    <span className="mb-2 text-sm" style={{ color: "#64748b" }}>{plan.priceLabel}</span>
                  </div>
                </div>

                <ul className="mb-8 flex-1 space-y-3.5">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-sm">
                      <svg className="h-4 w-4 shrink-0" style={{ color: plan.highlighted ? "#06b6d4" : "#3b82f6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span style={{ color: plan.highlighted ? "#e2e8f0" : "#94a3b8" }}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-200 ${plan.highlighted ? "btn-gradient" : "btn-ghost"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section id="contact" className="py-32" style={{ background: "#05070f" }}>
        <div className="mx-auto max-w-3xl px-6">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center gradient-border noise" style={{ background: "rgba(59,130,246,0.06)" }}>
            {/* Background orbs */}
            <div className="orb orb-blue" style={{ width: 300, height: 300, top: -100, right: -50, opacity: 0.5, filter: "blur(100px)" }} />
            <div className="orb orb-cyan" style={{ width: 200, height: 200, bottom: -50, left: -30, opacity: 0.4, filter: "blur(80px)" }} />

            <div className="relative">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] gradient-text">Kom i gang i dag</p>
              <h2 className="text-4xl font-black text-white leading-tight md:text-5xl">
                Klar til dit første<br />europæiske møde?
              </h2>
              <p className="mt-5 text-lg" style={{ color: "#94a3b8" }}>
                Opret en konto på 30 sekunder. Ingen kreditkort påkrævet.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/register" className="btn-gradient flex w-full items-center justify-center gap-2 px-8 py-4 text-base rounded-2xl sm:w-auto">
                  Opret gratis konto
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a href="mailto:kontakt@agora.eu" className="btn-ghost flex w-full items-center justify-center gap-2 px-8 py-4 text-base rounded-2xl sm:w-auto">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  kontakt@agora.eu
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ad bar (sticky bottom) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-2.5" style={{ background: "rgba(5,7,15,0.95)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest shrink-0" style={{ color: "#1e293b" }}>Annonce</span>
          <div className="h-3 w-px shrink-0" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-black text-white" style={{ background: "#8b5cf6" }}>T</div>
            <p className="text-xs hidden sm:block" style={{ color: "#475569" }}>
              <span className="font-semibold" style={{ color: "#94a3b8" }}>Telia Erhverv — </span>
              Mobilt bredbånd til hele teamet · Op til 20% rabat
            </p>
          </div>
        </div>
        <button className="shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition-all" style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
          Læs mere
        </button>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t py-10 pb-20" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#03050c" }}>
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="font-bold text-white">Agora</span>
          </div>
          <p className="text-sm" style={{ color: "#475569" }}>© 2026 Agora · Europæisk videomøde · GDPR-compliant</p>
          <nav className="flex gap-6 text-sm" style={{ color: "#475569" }}>
            <Link href="/terms" className="hover:text-white transition">Betingelser</Link>
            <a href="mailto:kontakt@agora.eu" className="hover:text-white transition">Kontakt</a>
          </nav>
        </div>
      </footer>

    </main>
  );
}
