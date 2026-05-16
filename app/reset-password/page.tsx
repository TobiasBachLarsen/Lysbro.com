"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase";
import { LysbroIcon } from "@/app/components/LysbroLogo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Adgangskoderne matcher ikke.");
      return;
    }
    if (password.length < 6) {
      setError("Adgangskoden skal være mindst 6 tegn.");
      return;
    }
    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      setError("Noget gik galt. Prøv at anmode om et nyt link.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4" style={{ background: "#05070f" }}>
      <div className="w-full max-w-sm">

        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #06b6d4)", boxShadow: "0 0 16px rgba(59,130,246,0.4)" }}>
            <LysbroIcon className="h-5 w-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-white">Lysbro</span>
        </Link>

        {done ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
            <svg className="mx-auto h-12 w-12 mb-4" style={{ color: "#4ade80" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-base font-semibold text-white">Adgangskode opdateret!</p>
            <p className="mt-2 text-sm" style={{ color: "#94a3b8" }}>Du bliver nu sendt videre til login…</p>
          </div>
        ) : (
          <div className="rounded-2xl p-8" style={{ background: "#080b18", border: "1px solid rgba(255,255,255,0.06)" }}>
            <h2 className="text-xl font-bold text-white">Ny adgangskode</h2>
            <p className="mt-1 text-sm" style={{ color: "#64748b" }}>Vælg en ny adgangskode til din konto.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "#94a3b8" }}>Ny adgangskode</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-dark"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: "#94a3b8" }}>Bekræft adgangskode</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-dark"
                />
              </div>

              {error && (
                <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <p className="text-sm" style={{ color: "#fca5a5" }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn-gradient w-full flex items-center justify-center gap-2 py-3.5"
                style={{ opacity: isLoading ? 0.75 : 1, cursor: isLoading ? "not-allowed" : "pointer" }}
              >
                {isLoading && (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                )}
                {isLoading ? "Gemmer…" : "Gem ny adgangskode"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
