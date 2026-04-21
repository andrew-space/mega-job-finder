import Link from "next/link";
import { OpsRefreshPanel } from "@/features/ops/components/ops-refresh-panel";

export const metadata = {
  title: "Ops Dashboard · JobRadar",
  description: "Dashboard opérateur minimal pour monitorer et déclencher les refresh jobs.",
};

export default function OpsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
        <Link href="/" className="text-sm font-bold text-slate-900">
          JobRadar
        </Link>
        <Link
          href="/search"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          Retour recherche
        </Link>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Stage 4</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Dashboard opérateur
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
          Monitoring simple du pipeline refresh et déclenchement manuel sécurisé,
          sans infrastructure additionnelle.
        </p>

        <div className="mt-8">
          <OpsRefreshPanel />
        </div>
      </main>
    </div>
  );
}