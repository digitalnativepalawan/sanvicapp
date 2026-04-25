import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Business } from "./FeedItem";
import { Layers } from "lucide-react";

interface Props {
  businesses: Business[];
  onSelect: (b: Business) => void;
}

const CAT_COLOR: Record<string, string> = {
  Eat: "#f59e0b",
  Stay: "#ec4899",
  Experience: "#10b981",
  Travel: "#3b82f6",
};

const makeIcon = (category: string, featured: boolean) => {
  const color = CAT_COLOR[category] ?? "#6b7280";
  const size = featured ? 34 : 26;
  const ring = featured
    ? `<circle cx="14" cy="14" r="13" fill="none" stroke="${color}" stroke-width="2" opacity="0.5"/>`
    : "";
  const html = `<div style="width:${size}px;height:${size}px;display:grid;place-items:center;">
    <svg viewBox="0 0 28 28" width="${size}" height="${size}">
      ${ring}
      <circle cx="14" cy="14" r="8" fill="${color}" stroke="white" stroke-width="2.5"/>
    </svg>
  </div>`;
  return L.divIcon({
    html,
    className: "sv-pin",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const FitBounds = ({ businesses }: { businesses: Business[] }) => {
  const map = useMap();
  useEffect(() => {
    const points = businesses
      .filter((b) => typeof b.latitude === "number" && typeof b.longitude === "number")
      .map((b) => [b.latitude!, b.longitude!] as [number, number]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points).pad(0.15));
    }
  }, [businesses, map]);
  return null;
};

export const MapView = ({ businesses, onSelect }: Props) => {
  const [satellite, setSatellite] = useState(true);
  const pinned = useMemo(
    () =>
      businesses.filter(
        (b) => typeof b.latitude === "number" && typeof b.longitude === "number",
      ),
    [businesses],
  );

  const center: [number, number] = pinned[0]
    ? [pinned[0].latitude!, pinned[0].longitude!]
    : [10.413, 119.179];

  return (
    <div className="relative h-[calc(100vh-128px)] w-full">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: "hsl(var(--background))" }}
      >
        {satellite ? (
          <TileLayer
            attribution='Tiles © Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='© OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}
        <FitBounds businesses={pinned} />
        {pinned.map((b) => (
          <Marker
            key={b.id}
            position={[b.latitude!, b.longitude!]}
            icon={makeIcon(b.category, !!b.featured)}
            eventHandlers={{ click: () => onSelect(b) }}
          />
        ))}
      </MapContainer>

      <button
        onClick={() => setSatellite((s) => !s)}
        className="absolute top-3 right-3 z-[1000] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur border border-border text-xs font-medium shadow"
      >
        <Layers className="h-3.5 w-3.5" />
        {satellite ? "Standard" : "Satellite"}
      </button>

      {pinned.length === 0 && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <p className="text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-full">
            No mapped listings yet
          </p>
        </div>
      )}
    </div>
  );
};