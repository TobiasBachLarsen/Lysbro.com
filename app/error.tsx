"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-6" style={{ background: "#05070f" }}>
      <div className="h-16 w-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <svg className="h-8 w-8" style={{ color: "#f87171" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-black text-white mb-2">Noget gik galt</h1>
        <p className="text-sm" style={{ color: "#64748b" }}>Der opstod en uventet fejl. Prøv at genindlæse siden.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="btn-gradient px-5 py-2.5 text-sm font-semibold"
        >
          Prøv igen
        </button>
        <Link href="/dashboard" className="btn-ghost px-5 py-2.5 text-sm font-semibold">
          Gå til overblik
        </Link>
      </div>
    </div>
  );
}
