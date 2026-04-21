"use client";

import { useEffect, useRef } from "react";
import type { JobOffer } from "@/lib/job-types";

interface MapViewProps {
  jobs: JobOffer[];
  selectedJobId?: string | null;
  onJobSelect?: (jobId: string) => void;
}

export function MapView({ jobs, selectedJobId, onJobSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const onJobSelectRef = useRef(onJobSelect);

  useEffect(() => {
    onJobSelectRef.current = onJobSelect;
  });

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icons (bundler issue)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current) return;

      const map = L.map(containerRef.current).setView([46.6, 1.89], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      mapRef.current = map;
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []); // init once — map cleanup handles unmount

  useEffect(() => {
    if (!mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!map) return;

      // Remove old markers
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // Filter jobs with valid coordinates
      const withCoords = jobs.filter(
        (j) => j.location.coords.lat !== 0 || j.location.coords.lng !== 0
      );

      withCoords.forEach((job) => {
        const isSelected = job.id === selectedJobId;
        const marker = L.marker(
          [job.location.coords.lat, job.location.coords.lng],
          { opacity: isSelected ? 1 : 0.7, zIndexOffset: isSelected ? 1000 : 0 }
        )
          .addTo(map)
          .bindPopup(
            `<div style="font-family:system-ui;padding:2px 0;min-width:160px">
              <div style="font-weight:600;font-size:13px;margin-bottom:3px;color:#0f172a">${job.title}</div>
              <div style="font-size:12px;color:#475569">${job.company}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px">${job.location.city}</div>
            </div>`,
            { maxWidth: 220 }
          );

        marker.on("click", () => onJobSelectRef.current?.(job.id));
        if (isSelected) marker.openPopup();
        markersRef.current.push(marker);
      });

      // Fit bounds
      if (withCoords.length > 1) {
        const bounds = L.latLngBounds(
          withCoords.map((j) => [j.location.coords.lat, j.location.coords.lng])
        );
        map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
      } else if (withCoords.length === 1) {
        map.setView(
          [withCoords[0].location.coords.lat, withCoords[0].location.coords.lng],
          11
        );
      }
    })();
  }, [jobs, selectedJobId]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {jobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 text-sm text-slate-500">
          Aucune offre à afficher sur la carte
        </div>
      )}
    </div>
  );
}
