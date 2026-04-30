import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold text-blue-600 tracking-tight">Lysbro</Link>
          <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 transition">Log ind</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Betingelser for brug</h1>
        <p className="text-sm text-slate-400 mb-10">Sidst opdateret: 1. maj 2025</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">1. Generelt</h2>
            <p className="text-sm leading-relaxed">
              Disse betingelser regulerer din brug af Lysbro-platformen, herunder videomøde-tjenesten og brugerportalen.
              Ved at oprette en konto accepterer du at overholde disse betingelser. Lysbro drives fra Danmark og er underlagt dansk ret og EU-lovgivning.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">2. Abonnement og betaling</h2>
            <p className="text-sm leading-relaxed">
              Lysbro tilbyder tre abonnementsplaner: Starter (19 kr./md.), Professionel (79 kr./md.) og Erhverv (199 kr./md.).
              Abonnementet faktureres månedligt forud. Du kan til enhver tid opsige eller ændre dit abonnement,
              og opsigelsen træder i kraft ved udløbet af den igangværende betalingsperiode.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">3. Privatlivspolitik og GDPR</h2>
            <p className="text-sm leading-relaxed">
              Lysbro behandler dine personoplysninger i overensstemmelse med GDPR og dansk databeskyttelseslov.
              Alle data opbevares udelukkende på europæiske servere hos Hetzner. Vi videregiver aldrig dine data til tredjepart uden dit samtykke,
              og ingen data overføres til lande uden for EU/EØS.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">4. Acceptable brug</h2>
            <p className="text-sm leading-relaxed">
              Du må ikke anvende Lysbro til ulovlige formål, spredning af skadeligt indhold eller handlinger der forstyrrer tjenestens drift.
              Lysbro forbeholder sig retten til at suspendere konti, der overtræder disse retningslinjer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">5. Ansvarsbegrænsning</h2>
            <p className="text-sm leading-relaxed">
              Lysbro stræber efter høj oppetid og stabilitet, men kan ikke garantere uafbrudt adgang til tjenesten.
              Vi er ikke ansvarlige for tab opstået som følge af midlertidige nedbrud eller tekniske fejl.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">6. Ændringer i betingelserne</h2>
            <p className="text-sm leading-relaxed">
              Lysbro kan til enhver tid opdatere disse betingelser. Væsentlige ændringer varsles via e-mail med mindst 30 dages varsel.
              Fortsat brug af tjenesten efter ikrafttrædelse af nye betingelser anses som accept heraf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">7. Kontakt</h2>
            <p className="text-sm leading-relaxed">
              Har du spørgsmål til disse betingelser, kan du kontakte os på{" "}
              <a href="mailto:kontakt@agora.eu" className="text-blue-600 hover:underline">kontakt@agora.eu</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-slate-100 pt-8 flex items-center gap-4">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 transition font-medium">← Tilbage til forsiden</Link>
          <Link href="/register" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">Opret konto</Link>
        </div>
      </main>
    </div>
  );
}
