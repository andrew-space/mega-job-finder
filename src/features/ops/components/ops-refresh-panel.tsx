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
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

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
          disabled={running || loading}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? "Refresh en cours..." : "Refresh now"}
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
        </div>
      ) : null}
    </section>
  );
}