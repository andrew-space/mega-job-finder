import { JobsExplorer } from "@/components/jobs-explorer";
import { markDuplicates } from "@/lib/dedup";
import { mockJobs } from "@/lib/mock-jobs";

export default function Home() {
  const jobs = markDuplicates(mockJobs);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 pb-6 pt-4 sm:px-6 lg:px-8">
      <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">JobRadar</p>
        <h1 className="text-2xl font-semibold text-slate-900">Aggregateur emploi France, version demo</h1>
        <p className="text-sm text-slate-600">
          Split-view liste + carte, dedup intelligente, API mock prete a brancher sur France Travail et APEC.
        </p>
      </header>

      <JobsExplorer jobs={jobs} />
    </div>
  );
}
