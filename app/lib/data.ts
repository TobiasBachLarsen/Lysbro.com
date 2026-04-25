import type { PlanMeta, Ad, PopupAd } from "@/app/types";

export const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Overblik",
    icon: "dashboard" as const,
  },
  { href: "/meetings",     label: "Møder",       icon: "meetings"     as const },
  { href: "/calendar",     label: "Kalender",    icon: "calendar"     as const },
  { href: "/contacts",     label: "Kontakter",   icon: "contacts"     as const },
  { href: "/history",      label: "Historik",    icon: "history"      as const },
  { href: "/subscription", label: "Abonnement",  icon: "subscription" as const },
  { href: "/profile",      label: "Profil",      icon: "profile"      as const },
] as const;

export const PLANS: Record<string, PlanMeta> = {
  gratis:  { id: "gratis",  label: "Gratis",       price: "0",     color: "#60a5fa", meetingsUsed: 2,  meetingsMax: 3    },
  pro:     { id: "pro",     label: "Professionel", price: "200",   color: "#a78bfa", meetingsUsed: 14, meetingsMax: null },
  erhverv: { id: "erhverv", label: "Erhverv",      price: "1.000", color: "#22d3ee", meetingsUsed: 47, meetingsMax: null },
};


export const BANNER_ADS: Ad[] = [
  { brand: "Telia Erhverv",    headline: "Få mobilt bredbånd til hele teamet",    sub: "Op til 20% rabat på erhvervsabonnementer",    color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.2)",  logo: "T" },
  { brand: "Visma e-conomic",  headline: "Gratis regnskabsprogram i 3 måneder",   sub: "Danmarks mest brugte bogføringssystem",        color: "#06b6d4", bg: "rgba(6,182,212,0.08)",   border: "rgba(6,182,212,0.2)",   logo: "V" },
  { brand: "Just Eat Business", headline: "Mad til mødet — leveret på 30 min",    sub: "Bestil frokost til hele kontoret",             color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.2)",  logo: "J" },
];

export const POPUP_ADS: PopupAd[] = [
  { brand: "Cofidis Danmark",   headline: "Lån op til 150.000 kr.",        sub: "Hurtig udbetaling · Lav rente · Ingen gebyrer",       cta: "Ansøg nu",  color: "#ef4444", bg: "linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))",   border: "rgba(239,68,68,0.3)",   logo: "C", logoColor: "#ef4444" },
  { brand: "Telia Erhverv",     headline: "Spar 20% på erhvervsmobil",     sub: "Tilbuddet udløber om 24 timer — skynd dig!",          cta: "Se tilbud", color: "#8b5cf6", bg: "linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))", border: "rgba(139,92,246,0.3)",  logo: "T", logoColor: "#8b5cf6" },
  { brand: "Just Eat Business", headline: "Bestil mad til næste møde",     sub: "Gratis levering på din første bestilling i dag",      cta: "Bestil nu", color: "#f59e0b", bg: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))", border: "rgba(245,158,11,0.3)",  logo: "J", logoColor: "#f59e0b" },
];

export const MEETING_TEMPLATES = [
  { icon: "📅", label: "Ugentligt team-møde", title: "Ugentligt team-møde",  time: "10:00", duration: "60",  description: "Ugens status, blokkere og planer.",                            invites: "lars@firma.dk\nmette@design.dk" },
  { icon: "👤", label: "1:1",                 title: "1:1 møde",             time: "11:00", duration: "30",  description: "Individuel opfølgning.",                                       invites: "" },
  { icon: "🎯", label: "Sprint planning",      title: "Sprint planning",      time: "09:00", duration: "120", description: "Gennemgang og prioritering af næste sprint.",                  invites: "lars@firma.dk\nmette@design.dk\npeter@tech.dk" },
  { icon: "📊", label: "Kundepræsentation",   title: "Kundepræsentation",    time: "13:00", duration: "60",  description: "Præsentation af løsning og status for kunden.",               invites: "" },
];
