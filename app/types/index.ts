export type PlanId = "gratis" | "pro" | "erhverv";

// ── DB row shapes returned from Supabase queries ──────────────────────────────

export interface ContactRow {
  id: string;
  user_id: string;
  name: string;
  email: string;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface ContactRequestRow {
  id: string;
  sender_id: string;
}

export interface InviteMessageRow {
  id: string;
  sender_id: string;
  meeting_data: { title?: string; org_name?: string } | null;
}

export interface OrgAnnouncementPayload {
  id: string;
  org_id: string;
  content: string;
  created_at: string;
}

export interface OrgMessagePayload {
  id: string;
  org_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface MessagePayload {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type?: string;
  created_at: string;
}

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
