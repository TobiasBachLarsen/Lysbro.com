export type PlanId = "gratis" | "pro" | "erhverv";

export interface PlanMeta {
  id: PlanId;
  label: string;
  price: string;
  color: string;
  meetingsUsed: number;
  meetingsMax: number | null;
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  participants: Participant[];
  description?: string;
  past?: boolean;
}

export interface Participant {
  name: string;
  email: string;
  initials: string;
  color: string;
  rsvp: "accepted" | "pending" | "declined";
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  initials: string;
  color: string;
  meetings: number;
  online: boolean;
}

export interface Ad {
  brand: string;
  headline: string;
  sub: string;
  color: string;
  bg: string;
  border: string;
  logo: string;
}

export interface PopupAd extends Ad {
  cta: string;
  logoColor: string;
}
