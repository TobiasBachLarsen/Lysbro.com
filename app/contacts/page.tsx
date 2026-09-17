"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";
import { AVATAR_COLORS, getInitials } from "@/app/lib/utils";

type Contact = { id: string; profile_id: string | null; name: string; email: string; initials: string; color: string; avatar_url: string | null };
type Request = { id: string; sender_id: string; sender_name: string; sender_email: string; sender_avatar: string | null; created_at: string };
type Profile = { id: string; full_name: string; email: string };

const EMPTY_FORM = { name: "", email: "", error: "" };

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteContact, setInviteContact] = useState<Contact | null>(null);
  const [inviteForm, setInviteForm] = useState({ title: "", date: "", time: "" });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteDone, setInviteDone] = useState<string[]>([]);

  const closeModal = () => { setShowAdd(false); setForm(EMPTY_FORM); setSelectedUser(null); setSuggestions([]); };

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: contactData }, { data: requestData }] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", user.id).order("name"),
      supabase.from("contact_requests").select("id, sender_id, created_at").eq("receiver_id", user.id).eq("status", "pending"),
    ]);

    type ContactRaw = { id: string; user_id: string; name: string; email: string };
    type ProfileRaw = { id: string; email: string; avatar_url: string | null };

    const contactEmails = (contactData ?? [] as ContactRaw[]).map((c) => c.email).filter(Boolean);
    const { data: contactProfiles } = contactEmails.length
      ? await supabase.from("profiles").select("id, email, avatar_url").in("email", contactEmails)
      : { data: [] as ProfileRaw[] };

    setContacts(((contactData ?? []) as ContactRaw[]).map((c, i) => {
      const profile = (contactProfiles ?? [] as ProfileRaw[]).find((p) => p.email === c.email);
      return {
        ...c,
        profile_id: profile?.id ?? null,
        initials: getInitials(c.name),
        color: AVATAR_COLORS[i % AVATAR_COLORS.length],
        avatar_url: profile?.avatar_url ?? null,
      };
    }));

    if (requestData?.length) {
      const senderIds = requestData.map((r) => r.sender_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email, avatar_url").in("id", senderIds);
      setRequests(requestData.map((r) => {
        const p = profiles?.find((p) => p.id === r.sender_id);
        return { ...r, sender_name: p?.full_name ?? "Ukendt", sender_email: p?.email ?? "", sender_avatar: p?.avatar_url ?? null };
      }));
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const searchUsers = async (q: string) => {
    setSelectedUser(null);
    if (q.length < 2) { setSuggestions([]); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("profiles").select("id, full_name, email")
      .neq("id", user?.id)
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(5);
    setSuggestions(data ?? []);
  };

  const handleAdd = async () => {
    if (!form.email.includes("@")) { setForm((f) => ({ ...f, error: "Indtast en gyldig e-mail" })); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileMatch } = await supabase.from("profiles")
      .select("id, full_name, email").ilike("email", form.email.trim()).neq("id", user.id).maybeSingle();
    const registeredUser = selectedUser ?? profileMatch;

    if (registeredUser) {
      const { data: existing } = await supabase.from("contact_requests")
        .select("id").eq("sender_id", user.id).eq("receiver_id", registeredUser.id).maybeSingle();
      if (existing) { setForm((f) => ({ ...f, error: "Du har allerede sendt en anmodning til denne bruger" })); return; }

      const { data: alreadyContact } = await supabase.from("contacts")
        .select("id").eq("user_id", user.id).eq("email", registeredUser.email).maybeSingle();
      if (alreadyContact) { setForm((f) => ({ ...f, error: "Denne bruger er allerede i dine kontakter" })); return; }

      const { error } = await supabase.from("contact_requests").insert({ sender_id: user.id, receiver_id: registeredUser.id, status: "pending" });
      if (error) { setForm((f) => ({ ...f, error: `Fejl: ${error.message}` })); return; }
    } else {
      if (!form.name.trim()) { setForm((f) => ({ ...f, error: "Indtast et navn" })); return; }
      const { data, error } = await supabase.from("contacts").insert({ name: form.name.trim(), email: form.email.trim(), user_id: user.id }).select().single();
      if (error) { setForm((f) => ({ ...f, error: "Kunne ikke tilføje kontakt" })); return; }
      setContacts((prev) => [...prev, { ...data, initials: getInitials(data.name), color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length], avatar_url: null }]);
    }

    closeModal();
  };

  const handleAccept = async (req: Request) => {
    const supabase = createClient();
    const { error } = await supabase.rpc("accept_contact_request", { request_id: req.id });
    if (error) return;
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    setContacts((prev) => [...prev, {
      id: req.sender_id, profile_id: req.sender_id, name: req.sender_name, email: req.sender_email,
      initials: getInitials(req.sender_name), color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
      avatar_url: req.sender_avatar,
    }]);
  };

  const handleReject = async (id: string) => {
    await createClient().from("contact_requests").delete().eq("id", id);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDelete = async (id: string) => {
    await createClient().rpc("delete_contact_mutual", { contact_id: id });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleInvite = (contact: Contact) => {
    setInviteContact(contact);
    setInviteForm({ title: "", date: "", time: "" });
    setShowInviteModal(true);
  };

  const [inviteError, setInviteError] = useState("");

  const submitInvite = async () => {
    if (!inviteContact || !inviteForm.title || !inviteForm.date || !inviteForm.time) return;
    if (!inviteContact.profile_id) { setInviteError("Denne kontakt har ingen Lysbro-konto"); return; }
    setInviteLoading(true);
    setInviteError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setInviteLoading(false); return; }

    const { data: meeting, error: meetingErr } = await supabase
      .from("meetings")
      .insert({ title: inviteForm.title, date: inviteForm.date, time: inviteForm.time, user_id: user.id })
      .select("id")
      .single();

    if (meetingErr || !meeting) {
      setInviteLoading(false);
      setInviteError(`Fejl: ${meetingErr?.message ?? "Kunne ikke oprette møde"}`);
      return;
    }

    const { error: msgErr } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: inviteContact.profile_id,
      content: `Mødeindvitation: ${inviteForm.title}`,
      type: "meeting_invite",
      meeting_data: { title: inviteForm.title, date: inviteForm.date, time: inviteForm.time, meeting_id: meeting?.id },
      invite_status: "pending",
    });

    setInviteLoading(false);

    if (msgErr) {
      setInviteError(`Fejl: ${msgErr.message}`);
      return;
    }

    setShowInviteModal(false);
    const cid = inviteContact.id;
    setInviteDone((prev) => [...prev, cid]);
    setTimeout(() => setInviteDone((prev) => prev.filter((i) => i !== cid)), 3000);
  };

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout activeHref="/contacts">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Kontakter</h1>
          <p className="text-xs" style={{ color: "#475569" }}>{loading ? "…" : `${contacts.length} gemte kontakter`}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-gradient flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Tilføj kontakt
        </button>
      </header>

      <main className="p-8 space-y-6">

        {/* Kontaktanmodninger */}
        {requests.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#475569" }}>
              Kontaktanmodninger · {requests.length}
            </h2>
            {requests.map((req) => (
              <div key={req.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
                  {req.sender_avatar ? <img src={req.sender_avatar} alt={req.sender_name} className="h-full w-full object-cover" /> : getInitials(req.sender_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{req.sender_name}</p>
                  <p className="text-xs truncate" style={{ color: "#475569" }}>{req.sender_email}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAccept(req)} className="rounded-xl px-3 py-1.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                    Accepter
                  </button>
                  <button onClick={() => handleReject(req.id)} className="rounded-xl px-3 py-1.5 text-xs font-medium" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>
                    Afvis
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Søg */}
        <input
          className="input-dark max-w-sm"
          placeholder="Søg på navn eller e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Tilføj kontakt modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <div className="animate-fade-in w-full max-w-sm mx-4 glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Tilføj kontakt</h2>
                <button onClick={closeModal} style={{ color: "#475569" }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Søg bruger eller indtast e-mail</label>
                <input
                  className="input-dark"
                  placeholder="navn eller e-mail..."
                  value={form.email}
                  onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value, error: "" })); searchUsers(e.target.value); }}
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {suggestions.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all hover:bg-white/[0.06]"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        onClick={() => { setForm((f) => ({ ...f, email: u.email ?? "", name: u.full_name ?? "" })); setSuggestions([]); setSelectedUser(u); }}
                      >
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
                          {(u.full_name ?? u.email ?? "?")[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{u.full_name || "Unavngivet"}</p>
                          <p className="text-xs truncate" style={{ color: "#475569" }}>{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedUser ? (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <svg className="h-4 w-4 shrink-0" style={{ color: "#60a5fa" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <p className="text-xs" style={{ color: "#93c5fd" }}>Sender kontaktanmodning til <span className="font-semibold">{selectedUser.full_name}</span></p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Navn</label>
                  <input className="input-dark" placeholder="Fuldt navn" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, error: "" }))} />
                </div>
              )}

              {form.error && <p className="text-xs" style={{ color: "#f87171" }}>{form.error}</p>}


              <div className="flex gap-2 pt-1">
                <button onClick={handleAdd} className="btn-gradient flex-1 py-2.5 text-sm rounded-xl">
                  {selectedUser ? "Send anmodning" : "Tilføj"}
                </button>
                <button onClick={closeModal} className="btn-ghost flex-1 py-2.5 text-sm rounded-xl">Annuller</button>
              </div>
            </div>
          </div>
        )}

        {/* Kontaktliste */}
        {contacts.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] mb-4" style={{ color: "#475569" }}>Dine kontakter</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <div key={c.id} className="glass rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/25">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-xl overflow-hidden flex items-center justify-center text-sm font-bold text-white" style={{ background: c.color }}>
                      {c.avatar_url ? <img src={c.avatar_url} alt={c.name} className="h-full w-full object-cover" /> : c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                      <p className="text-xs truncate" style={{ color: "#475569" }}>{c.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleInvite(c)}
                      disabled={inviteDone.includes(c.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white transition-all"
                      style={{
                        background: inviteDone.includes(c.id) ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #3b82f6, #06b6d4)",
                        border: inviteDone.includes(c.id) ? "1px solid rgba(34,197,94,0.4)" : "none",
                        color: inviteDone.includes(c.id) ? "#4ade80" : "#fff",
                      }}
                    >
                      {inviteDone.includes(c.id) ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                      )}
                      {inviteDone.includes(c.id) ? "Invitation sendt!" : "Inviter til møde"}
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Fjern kontakt"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all hover:text-red-400 hover:border-red-500/30"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && search && (
                <div className="col-span-full text-center py-16">
                  <p className="text-sm" style={{ color: "#334155" }}>Ingen kontakter matcher din søgning</p>
                </div>
              )}
            </div>
          </div>
        )}

        {contacts.length === 0 && !loading && requests.length === 0 && (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: "#334155" }}>Du har ingen kontakter endnu</p>
            <button onClick={() => setShowAdd(true)} className="mt-3 text-xs font-semibold" style={{ color: "#60a5fa" }}>+ Tilføj din første kontakt</button>
          </div>
        )}

        {/* Mødeindvitation modal */}
        {showInviteModal && inviteContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <div className="animate-fade-in w-full max-w-sm mx-4 glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Inviter til møde</h2>
                  <p className="text-xs mt-0.5" style={{ color: "#475569" }}>Til {inviteContact.name}</p>
                </div>
                <button onClick={() => setShowInviteModal(false)} style={{ color: "#475569" }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Mødetitel</label>
                <input className="input-dark" placeholder="f.eks. Ugentligt team-møde" value={inviteForm.title} onChange={(e) => setInviteForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Dato</label>
                <input type="date" className="input-dark" value={inviteForm.date} onChange={(e) => setInviteForm((f) => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Tidspunkt</label>
                <input type="time" className="input-dark" value={inviteForm.time} onChange={(e) => setInviteForm((f) => ({ ...f, time: e.target.value }))} />
              </div>

              {inviteError && <p className="text-xs" style={{ color: "#f87171" }}>{inviteError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={submitInvite}
                  disabled={inviteLoading || !inviteForm.title || !inviteForm.date || !inviteForm.time}
                  className="btn-gradient flex-1 py-2.5 text-sm rounded-xl"
                  style={{ opacity: (!inviteForm.title || !inviteForm.date || !inviteForm.time) ? 0.5 : 1 }}
                >
                  {inviteLoading ? "Sender…" : "Send invitation"}
                </button>
                <button onClick={() => setShowInviteModal(false)} className="btn-ghost flex-1 py-2.5 text-sm rounded-xl">Annuller</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </AppLayout>
  );
}
