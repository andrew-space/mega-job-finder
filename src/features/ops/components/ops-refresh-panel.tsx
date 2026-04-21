"use client";

import { useState } from "react";

type OpsStatus = {
  lastAttemptAt: string | null;
  lastTrigger: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  lastDataSyncAt: string | null;
  totalJobs: number;
  lastSourceStats?: Array<{
    sourceType: string;
    fetched: number;
    inserted: number;
    updated: number;
    failed: boolean;
    error: string | null;
  }>;
};

type CompanySource = {
  id: string;
  companyName: string;
  careersUrl: string;
  sourceType: "greenhouse" | "lever" | "custom";
  sourceIdentifier: string;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DetectedSource = {
  sourceType: "greenhouse" | "lever" | "custom";
  sourceIdentifier: string;
};

function formatIso(value: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("fr-FR");
}

export function OpsRefreshPanel() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<OpsStatus | null>(null);
  const [sources, setSources] = useState<CompanySource[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [careersUrl, setCareersUrl] = useState("");
  const [detectedSource, setDetectedSource] = useState<DetectedSource | null>(null);
  const [running, setRunning] = useState(false);
  const [syncingSources, setSyncingSources] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  async function authorizedFetch(path: string, init?: RequestInit) {
    return fetch(path, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        "x-ops-token": token.trim(),
      },
      cache: "no-store",
    });
  }

  async function loadStatus() {
    if (!token.trim()) {
      setError("Token requis.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ops/refresh", {
        headers: { "x-ops-token": token.trim() },
        cache: "no-store",
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Impossible de charger le statut.");
      }

      setStatus(json.status as OpsStatus);
      setLastAction("Statut chargé");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  async function loadSources() {
    if (!token.trim()) {
      setError("Token requis.");
      return;
    }

    setLoadingSources(true);
    setError(null);

    try {
      const response = await authorizedFetch("/api/ops/sources");
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Impossible de charger les sources.");
      }

      setSources((json.sources ?? []) as CompanySource[]);
      setLastAction("Sources chargées");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoadingSources(false);
    }
  }

  async function detectSource() {
    if (!token.trim()) {
      setError("Token requis.");
      return;
    }

    if (!careersUrl.trim()) {
      setError("URL carrière requise.");
      return;
    }

    setDetecting(true);
    setError(null);

    try {
      const response = await authorizedFetch(
        `/api/ops/sources?detect=${encodeURIComponent(careersUrl.trim())}`
      );
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Détection impossible.");
      }

      setDetectedSource(json.detected as DetectedSource);
      setLastAction("Source détectée");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setDetecting(false);
    }
  }

  async function registerSource() {
    if (!token.trim()) {
      setError("Token requis.");
      return;
    }

    if (!companyName.trim() || !careersUrl.trim()) {
      setError("Nom entreprise et URL carrière requis.");
      return;
    }

    setSavingSource(true);
    setError(null);

    try {
      const response = await authorizedFetch("/api/ops/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          careersUrl: careersUrl.trim(),
          isActive: true,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Enregistrement source en échec.");
      }

      setCompanyName("");
      setCareersUrl("");
      setDetectedSource(null);
      await loadSources();
      setLastAction(`Source ajoutée: ${json.source?.companyName ?? "source"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSavingSource(false);
    }
  }

  async function toggleSource(source: CompanySource) {
    if (!token.trim()) {
      setError("Token requis.");
      return;
    }

    setError(null);

    try {
      const response = await authorizedFetch(`/api/ops/sources/${source.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !source.isActive }),
      });
      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Mise à jour source en échec.");
      }

      await loadSources();
      setLastAction(`${source.companyName}: ${source.isActive ? "désactivée" : "activée"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  async function triggerRefresh() {
    if (!token.trim()) {
      setError("Token requis.");
      return;
    }

    setRunning(true);
    setError(null);

    try {
      const response = await fetch("/api/ops/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-token": token.trim(),
        },
        body: JSON.stringify({ maxResults: 100 }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.debug?.code ?? json.error ?? "Refresh manuel en échec.");
      }

      setStatus(json.status as OpsStatus);
      setLastAction(`Refresh déclenché: ${json.result?.summary?.fetched ?? 0} offres fetchées`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setRunning(false);
    }
  }

  async function triggerCompanySourcesSync() {
    if (!token.trim()) {
      setError("Token requis.");
      return;
    }

    setSyncingSources(true);
    setError(null);

    try {
      const response = await fetch("/api/ops/sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ops-token": token.trim(),
        },
        body: JSON.stringify({ action: "sync", limit: 50 }),
      });

      const json = await response.json();
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "Sync sources en échec.");
      }

      await loadStatus();
      setLastAction(
        `Sync sources: ${json.result?.fetched ?? 0} fetchées, ${json.result?.inserted ?? 0} insérées, ${json.result?.updated ?? 0} mises à jour`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSyncingSources(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-slate-900">Refresh Control Panel</h2>
      <p className="mt-2 text-sm text-slate-500">
        Chargez le statut opérateur et déclenchez un refresh manuel protégé par token.
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="ADMIN_OPS_TOKEN"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2 sm:max-w-xs"
        />
        <button
          type="button"
          onClick={loadStatus}
          disabled={loading || running}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Chargement..." : "Charger statut"}
        </button>
        <button
          type="button"
          onClick={triggerRefresh}
          disabled={running || loading || syncingSources}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Refresh en cours..." : "Refresh now"}
        </button>
        <button
          type="button"
          onClick={triggerCompanySourcesSync}
          disabled={running || loading || syncingSources}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncingSources ? "Sync sources..." : "Sync company sources"}
        </button>
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
      {lastAction ? <p className="mt-4 text-sm text-slate-600">{lastAction}</p> : null}

      {status ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Dernière tentative</p>
            <p className="font-medium text-slate-900">{formatIso(status.lastAttemptAt)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Dernier succès</p>
            <p className="font-medium text-slate-900">{formatIso(status.lastSuccessAt)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Dernier trigger</p>
            <p className="font-medium text-slate-900">{status.lastTrigger ?? "-"}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Dernière sync DB</p>
            <p className="font-medium text-slate-900">{formatIso(status.lastDataSyncAt)}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Total offres DB</p>
            <p className="font-medium text-slate-900">{status.totalJobs}</p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="text-slate-500">Dernière erreur</p>
            <p className="font-medium text-slate-900">
              {status.lastErrorCode ? `${status.lastErrorCode} (${formatIso(status.lastErrorAt)})` : "Aucune"}
            </p>
            {status.lastErrorMessage ? (
              <p className="mt-1 text-xs text-slate-500">{status.lastErrorMessage}</p>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-200 p-3 text-sm sm:col-span-2">
            <p className="text-slate-500">Stats par source (dernier run)</p>
            {status.lastSourceStats && status.lastSourceStats.length > 0 ? (
              <div className="mt-2 space-y-1 text-xs text-slate-700">
                {status.lastSourceStats.map((stat) => (
                  <p key={`${stat.sourceType}-${stat.error ?? "ok"}`}>
                    {stat.sourceType}: fetched {stat.fetched} · inserted {stat.inserted} · updated {stat.updated}
                    {stat.failed ? ` · failed (${stat.error ?? "unknown"})` : ""}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Aucune métrique source disponible.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-10 border-t border-slate-200 pt-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Company Source Registry</h3>
            <p className="mt-1 text-sm text-slate-500">
              Détectez une source carrière, enregistrez-la, puis pilotez le sync Greenhouse, Lever ou custom.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSources}
            disabled={loadingSources || running || syncingSources || savingSource}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingSources ? "Chargement sources..." : "Charger sources"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <input
            type="text"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Company name"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
          />
          <input
            type="url"
            value={careersUrl}
            onChange={(event) => setCareersUrl(event.target.value)}
            placeholder="https://boards.greenhouse.io/..."
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-900 focus:ring-2"
          />
          <button
            type="button"
            onClick={detectSource}
            disabled={detecting || savingSource || loadingSources}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {detecting ? "Détection..." : "Détecter"}
          </button>
          <button
            type="button"
            onClick={registerSource}
            disabled={savingSource || detecting || loadingSources}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingSource ? "Ajout..." : "Ajouter"}
          </button>
        </div>

        {detectedSource ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            Détection: <span className="font-semibold">{detectedSource.sourceType}</span>
            {" · "}
            identifier: <span className="font-mono text-xs">{detectedSource.sourceIdentifier}</span>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          {sources.length > 0 ? (
            sources.map((source) => (
              <article
                key={source.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900">{source.companyName}</h4>
                      <span className="rounded bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                        {source.sourceType}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                          source.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {source.isActive ? "active" : "inactive"}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-500">{source.careersUrl}</p>
                    <p className="mt-2 text-xs text-slate-600">
                      identifier: <span className="font-mono">{source.sourceIdentifier}</span>
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      last synced: {formatIso(source.lastSyncedAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSource(source)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-white"
                  >
                    {source.isActive ? "Désactiver" : "Activer"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Aucune source enregistrée pour l’instant. Ajoute une URL carrière pour voir apparaître la registry ici.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}