"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";

type Contact = { id: string; name: string; email: string; initials: string; color: string };

const COLORS = [
  "linear-gradient(135deg, #3b82f6, #06b6d4)",
  "linear-gradient(135deg, #8b5cf6, #ec4899)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
];

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("contacts").select("*").eq("user_id", user.id).order("name");
      setContacts((data ?? []).map((c, i) => ({
        ...c,
        initials: c.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
        color: COLORS[i % COLORS.length],
      })));
      setLoading(false);
    });
  }, []);
  const [search, setSearch] = useState("");
  const [inviting, setInviting] = useState<string | null>(null);
  const [invited, setInvited] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<{ id: string; full_name: string; email: string }[]>([]);

  const searchUsers = async (q: string) => {
    if (q.length < 2) { setUserSuggestions([]); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("profiles").select("id, full_name, email")
      .neq("id", user?.id)
      .or(`email.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(5);
    setUserSuggestions(data ?? []);
  };

  const filtered = contacts.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = (id: string) => {
    setInviting(id);
    setTimeout(() => {
      setInviting(null);
      setInvited((prev) => [...prev, id]);
      setTimeout(() => setInvited((prev) => prev.filter((i) => i !== id)), 3000);
    }, 1000);
  };

  const handleAdd = async () => {
    if (!newName.trim()) { setAddError("Indtast et navn"); return; }
    if (!newEmail.includes("@")) { setAddError("Indtast en gyldig e-mail"); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("contacts").insert({ name: newName.trim(), email: newEmail.trim(), user_id: user?.id }).select().single();
    if (error) { setAddError("Kunne ikke tilføje kontakt"); return; }
    setContacts((prev) => [...prev, {
      ...data,
      initials: data.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
      color: COLORS[prev.length % COLORS.length],
    }]);
    setNewName(""); setNewEmail(""); setAddError(""); setShowAdd(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

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

        {/* Search */}
        <input
          className="input-dark max-w-sm"
          placeholder="Søg på navn eller e-mail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Add contact modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
            <div className="animate-fade-in w-full max-w-sm mx-4 glass rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Tilføj kontakt</h2>
                <button onClick={() => { setShowAdd(false); setAddError(""); }} style={{ color: "#475569" }}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="relative">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Søg bruger eller indtast e-mail</label>
                <input className="input-dark" placeholder="navn eller e-mail..." value={newEmail} onChange={(e) => { setNewEmail(e.target.value); setAddError(""); searchUsers(e.target.value); }} />
                {userSuggestions.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 rounded-xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)" }}>
                    {userSuggestions.map((u) => (
                      <button key={u.id} type="button" className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
                        onClick={() => { setNewEmail(u.email ?? ""); setNewName(u.full_name ?? ""); setUserSuggestions([]); }}
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
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>Navn</label>
                <input className="input-dark" placeholder="Fuldt navn" value={newName} onChange={(e) => { setNewName(e.target.value); setAddError(""); }} />
              </div>
              {addError && <p className="text-xs" style={{ color: "#f87171" }}>{addError}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={handleAdd} className="btn-gradient flex-1 py-2.5 text-sm rounded-xl">Tilføj</button>
                <button onClick={() => { setShowAdd(false); setAddError(""); }} className="btn-ghost flex-1 py-2.5 text-sm rounded-xl">Annuller</button>
              </div>
            </div>
          </div>
        )}

        {/* Contacts grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200"
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.25)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: c.color }}>
                    {c.initials}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                  <p className="text-xs truncate" style={{ color: "#475569" }}>{c.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs" style={{ color: "#334155" }}>
                <span>{c.email}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleInvite(c.id)}
                  disabled={inviting === c.id || invited.includes(c.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-white transition-all"
                  style={{
                    background: invited.includes(c.id) ? "rgba(34,197,94,0.2)" : "linear-gradient(135deg, #3b82f6, #06b6d4)",
                    border: invited.includes(c.id) ? "1px solid rgba(34,197,94,0.4)" : "none",
                    color: invited.includes(c.id) ? "#4ade80" : "#fff",
                  }}
                >
                  {inviting === c.id ? (
                    <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  ) : invited.includes(c.id) ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                  )}
                  {inviting === c.id ? "Inviterer…" : invited.includes(c.id) ? "Inviteret!" : "Inviter til møde"}
                </button>
                <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#475569"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                  onClick={() => handleDelete(c.id)}
                  title="Fjern kontakt"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-sm" style={{ color: "#334155" }}>Ingen kontakter matcher din søgning</p>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
