import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#05070f" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full opacity-8 blur-3xl"
          style={{ background: "radial-gradient(circle, #3b82f6, transparent)" }} />
      </div>

      <div className="text-center">
        <p className="text-8xl font-black mb-4" style={{
          background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          404
        </p>
        <h1 className="text-2xl font-bold text-white mb-2">Siden blev ikke fundet</h1>
        <p className="text-sm mb-8" style={{ color: "#475569" }}>
          Den side du leder efter eksisterer ikke eller er blevet flyttet.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard"
            className="btn-gradient flex items-center gap-2 px-6 py-3 text-sm rounded-xl">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Gå til dashboard
          </Link>
          <Link href="/"
            className="btn-ghost flex items-center px-6 py-3 text-sm rounded-xl">
            Forside
          </Link>
        </div>
      </div>
    </div>
  );
}
