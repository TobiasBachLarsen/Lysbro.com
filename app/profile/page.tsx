"use client";

import { useState, useRef, useEffect } from "react";
import AppLayout from "@/app/components/AppLayout";
import { createClient } from "@/app/lib/supabase";
import { getInitials } from "@/app/lib/utils";

const avatarColors = [
  { label: "Blå", value: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
  { label: "Lilla", value: "linear-gradient(135deg, #8b5cf6, #ec4899)" },
  { label: "Grøn", value: "linear-gradient(135deg, #10b981, #06b6d4)" },
  { label: "Orange", value: "linear-gradient(135deg, #f59e0b, #ef4444)" },
  { label: "Pink", value: "linear-gradient(135deg, #ec4899, #8b5cf6)" },
];

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [notifMeetingReminder, setNotifMeetingReminder] = useState(true);
  const [notifNewParticipant, setNotifNewParticipant] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savedProfile, setSavedProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setName(user.user_metadata?.full_name ?? user.email ?? "");
        const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();
        if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      }
    });
  }, []);

  const [avatarError, setAvatarError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.toLowerCase();
    if (ext.endsWith(".heic") || ext.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
      setAvatarError("HEIC understøttes ikke — brug JPG eller PNG.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAvatarError("");
    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const initials = getInitials(name);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingProfile(false); return; }

    let finalAvatarUrl = avatarUrl;

    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, avatarFile, { contentType: avatarFile.type });
      if (uploadError) {
        setAvatarError("Upload fejlede: " + uploadError.message);
        setSavingProfile(false);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      finalAvatarUrl = publicUrl;
      setAvatarUrl(publicUrl);
      setAvatarFile(null);
    }

    await supabase.from("profiles").upsert({ id: user.id, full_name: name, avatar_url: finalAvatarUrl });
    await supabase.auth.updateUser({ data: { full_name: name } });

    setSavingProfile(false);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2500);
  };

  const handleSavePw = async () => {
    if (!currentPw) { setPwError("Indtast din nuværende adgangskode"); return; }
    if (newPw.length < 8) { setPwError("Ny adgangskode skal være mindst 8 tegn"); return; }
    if (newPw !== confirmPw) { setPwError("Adgangskoderne stemmer ikke overens"); return; }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPw });
    if (signInError) { setPwError("Forkert nuværende adgangskode"); return; }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPw });
    if (updateError) { setPwError("Kunne ikke opdatere adgangskoden, prøv igen"); return; }

    setPwError("");
    setSavedPw(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setSavedPw(false), 2500);
  };

  return (
    <AppLayout activeHref="/profile">
      <header className="sticky top-0 z-30 flex h-16 items-center px-8" style={{ background: "rgba(5,7,15,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <h1 className="text-base font-semibold text-white">Min profil</h1>
          <p className="text-xs" style={{ color: "#475569" }}>Administrer dine kontoindstillinger</p>
        </div>
      </header>

      <main className="p-8 space-y-6 max-w-2xl">

        {/* Avatar + navn */}
        <div className="glass rounded-2xl p-6 space-y-6">
          <h2 className="text-sm font-bold text-white">Profiloplysninger</h2>

          {/* Avatar preview + upload */}
          <div className="flex items-center gap-6">
            {/* Avatar med klik-overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 8px 32px rgba(59,130,246,0.3)" }}
              title="Skift profilbillede"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Profilbillede" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white" style={{ background: avatarColors[selectedColor].value }}>
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)" }}>
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-[10px] font-semibold text-white">Skift</span>
              </div>
            </button>

            {/* Skjult fil-input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>Profilbillede</p>
                <p className="text-xs" style={{ color: "#475569" }}>Klik på billedet for at vælge et foto fra din enhed</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-all hover-blue-btn"
                  style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}
                >
                  Vælg billede
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all hover-red-btn"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                  >
                    Fjern
                  </button>
                )}
              </div>
              {avatarError && <p className="text-xs" style={{ color: "#f87171" }}>{avatarError}</p>}
              {!avatarUrl && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Eller vælg farve</p>
                  <div className="flex gap-2">
                    {avatarColors.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedColor(i)}
                        className="h-6 w-6 rounded-full transition-all"
                        style={{
                          background: c.value,
                          outline: selectedColor === i ? `2px solid #ffffff` : "2px solid transparent",
                          outlineOffset: "2px",
                          transform: selectedColor === i ? "scale(1.15)" : "scale(1)",
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navn */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Navn</label>
            <input
              className="input-dark"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dit fulde navn"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#64748b" }}>E-mail</label>
            <div className="relative">
              <input
                className="input-dark"
                value={email}
                readOnly
                style={{ color: "#475569", cursor: "not-allowed" }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ background: "rgba(255,255,255,0.06)", color: "#475569" }}>
                Låst
              </span>
            </div>
            <p className="mt-1.5 text-xs" style={{ color: "#334155" }}>E-mail kan ikke ændres. Kontakt support.</p>
          </div>

          {savedProfile && (
            <div className="animate-fade-in flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <svg className="h-4 w-4 shrink-0" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-sm" style={{ color: "#86efac" }}>Profil gemt!</p>
            </div>
          )}

          <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-gradient px-6 py-2.5 text-sm rounded-xl flex items-center gap-2" style={{ opacity: savingProfile ? 0.7 : 1 }}>
            {savingProfile && <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            {savingProfile ? "Gemmer…" : "Gem ændringer"}
          </button>
        </div>

        {/* Skift adgangskode */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Skift adgangskode</h2>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Nuværende adgangskode</label>
            <input type="password" className="input-dark" value={currentPw} onChange={(e) => { setCurrentPw(e.target.value); setPwError(""); }} placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Ny adgangskode</label>
            <input type="password" className="input-dark" value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwError(""); }} placeholder="Mindst 8 tegn" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: "#64748b" }}>Bekræft ny adgangskode</label>
            <input
              type="password"
              className="input-dark"
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setPwError(""); }}
              placeholder="Gentag adgangskode"
              style={confirmPw && newPw && confirmPw !== newPw ? { borderColor: "rgba(239,68,68,0.5)" } : confirmPw && confirmPw === newPw ? { borderColor: "rgba(34,197,94,0.5)" } : {}}
            />
          </div>

          {pwError && (
            <p className="text-xs animate-fade-in" style={{ color: "#f87171" }}>{pwError}</p>
          )}
          {savedPw && (
            <div className="animate-fade-in flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <svg className="h-4 w-4 shrink-0" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p className="text-sm" style={{ color: "#86efac" }}>Adgangskode opdateret!</p>
            </div>
          )}

          <button onClick={handleSavePw} className="btn-gradient px-6 py-2.5 text-sm rounded-xl">
            Opdater adgangskode
          </button>
        </div>

        {/* Notifikationer */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white">Notifikationer</h2>

          {[
            { label: "Påmindelser om møder", sub: "Modtag en besked 15 min før et møde starter", value: notifMeetingReminder, set: setNotifMeetingReminder },
            { label: "Ny deltager tilmeldt", sub: "Når nogen accepterer en møde-invitation", value: notifNewParticipant, set: setNotifNewParticipant },
            { label: "Nyheder og tilbud", sub: "Opdateringer om Lysbro og særlige tilbud", value: notifMarketing, set: setNotifMarketing },
          ].map((n) => (
            <div key={n.label} className="flex items-center justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-white">{n.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>{n.sub}</p>
              </div>
              <button
                onClick={() => n.set(!n.value)}
                className="relative shrink-0 rounded-full transition-all duration-200"
                style={{
                  width: 44,
                  height: 24,
                  background: n.value ? "linear-gradient(135deg, #3b82f6, #06b6d4)" : "rgba(255,255,255,0.1)",
                  border: n.value ? "none" : "1px solid rgba(255,255,255,0.12)",
                }}
              >
                <span
                  className="absolute top-0.5 rounded-full bg-white transition-all duration-200"
                  style={{
                    width: 20,
                    height: 20,
                    left: n.value ? 22 : 2,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Slet konto */}
        <div className="rounded-2xl px-6 py-5" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
          <div className="flex items-center gap-2 mb-1">
            <svg className="h-4 w-4 shrink-0" style={{ color: "#f87171" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            <p className="text-sm font-semibold" style={{ color: "#f87171" }}>Slet konto</p>
          </div>
          <p className="text-xs mb-4" style={{ color: "#7f1d1d" }}>Alle dine data slettes permanent. Handlingen kan ikke fortrydes.</p>
          <button className="rounded-xl px-4 py-2 text-sm font-medium transition-all" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
            Slet min konto
          </button>
        </div>

      </main>
    </AppLayout>
  );
}
