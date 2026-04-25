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
      const description = b.category === "Stay" 
        ? `Comfortable ${b.zone || "San Vicente"} stay, ideal for slow island days.`
        : b.category === "Eat"
        ? `Local favorite serving fresh ${b.zone?.toLowerCase().includes("beach") ? "seafood" : "Filipino dishes"}.`
        : b.category === "Experience"
        ? `Curated ${b.tag || "island"} experience with trusted local guides.`
        : `Reliable transport service across ${b.zone || "San Vicente"}.`;

      const popupContent = `
        <div class="map-popup-content" data-business-id="${b.id}" style="font-family: Inter, system-ui, sans-serif; min-width: 200px; text-align: left; background: #0a0d14; color: #f0f4f8; padding: 12px; border-radius: 8px;">
          <h3 style="font-weight: 700; margin: 0 0 4px; font-size: 15px; color: #f0f4f8;">${b.name}</h3>
          <p style="margin: 0 0 8px; font-size: 11px; color: #8899a6; text-transform: uppercase; letter-spacing: 0.05em;">
            ${b.zone || "San Vicente"} · ${b.category}
          </p>
          <p style="margin: 0 0 12px; font-size: 13px; color: #b8c5d0; line-height: 1.4;">
            ${description}
          </p>
          <button class="map-view-details-btn" data-business-id="${b.id}" style="width: 100%; padding: 10px; border-radius: 9999px; background: #10B981; color: #fff; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: transform 0.1s;">
            View details
          </button>
        </div>
      `;
      marker.bindPopup(popupContent, { closeButton: false, maxWidth: 240 });
      marker.addTo(group);
      markersRef.current.push(marker);
    });

    group.addTo(mapRef.current);
    mapRef.current.fitBounds(group.getBounds().pad(0.25), { animate: true });

    // Global click handler for map popup buttons
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("map-view-details-btn")) {
        const businessId = target.getAttribute("data-business-id");
        const business = valid.find((b) => b.id === businessId);
        if (business) {
          onSelect(business);
          mapRef.current?.closePopup();
        }
      }
    };

    mapRef.current.on("click", handleClick);

    return () => {
      mapRef.current?.off("click", handleClick);
    };
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
