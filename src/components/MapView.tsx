import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Business } from "./FeedItem";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_URLS = {
  standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

interface MapViewProps {
  businesses: Business[];
  onSelect: (b: Business) => void;
}

export const MapView = ({ businesses, onSelect }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const viewRef = useRef<"standard" | "satellite">("satellite");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: false,
    }).setView([10.55, 118.95], 12);
    L.control.zoom({ position: "topright" }).addTo(mapRef.current);
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (tileRef.current) mapRef.current.removeLayer(tileRef.current);
    tileRef.current = L.tileLayer(TILE_URLS[viewRef.current], { maxZoom: 19 }).addTo(mapRef.current);
  }, [viewRef.current]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => mapRef.current!.removeLayer(m));
    markersRef.current = [];

    const valid = businesses.filter((b) => b.latitude && b.longitude);
    if (valid.length === 0) return;

    const group = L.featureGroup();

    valid.forEach((b) => {
      const marker = L.marker([b.latitude!, b.longitude!]);
      const popupContent = `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 160px; text-align: left;">
          <h3 style="font-weight: 700; margin: 0 0 4px; font-size: 14px; color: #0f172a;">${b.name}</h3>
          <p style="margin: 0 0 8px; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">
            ${b.zone || "San Vicente"} · ${b.category}
          </p>
          <button id="map-btn-${b.id}" style="width: 100%; padding: 8px; border-radius: 9999px; background: #10B981; color: #fff; font-weight: 600; font-size: 13px; border: none; cursor: pointer;">
            View details
          </button>
        </div>
      `;
      marker.bindPopup(popupContent, { closeButton: false, maxWidth: 220 });
      marker.addTo(group);
      markersRef.current.push(marker);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`map-btn-${b.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelect(b);
            mapRef.current?.closePopup();
          };
        }
      });
    });

    group.addTo(mapRef.current);
    mapRef.current.fitBounds(group.getBounds().pad(0.25), { animate: true });
  }, [businesses, onSelect]);

  return (
    <div className="relative h-[calc(100vh-110px)] w-full bg-secondary">
      <div ref={containerRef} className="absolute inset-0" />
      <button
        onClick={() => {
          viewRef.current = viewRef.current === "satellite" ? "standard" : "satellite";
          if (mapRef.current && tileRef.current) {
            mapRef.current.removeLayer(tileRef.current);
            tileRef.current = L.tileLayer(TILE_URLS[viewRef.current], { maxZoom: 19 }).addTo(mapRef.current);
          }
        }}
        className="absolute top-4 right-14 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/40 text-xs font-medium shadow-sm active:scale-95 transition"
      >
        {viewRef.current === "satellite" ? "🛰️ Satellite" : "🗺️ Standard"}
      </button>
    </div>
  );
};
