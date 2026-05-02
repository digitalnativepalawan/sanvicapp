import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MiniMapProps {
  lat: number;
  lng: number;
  label?: string;
  onClick?: () => void;
}

export const MiniMap = ({ lat, lng, label, onClick }: MiniMapProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([lat, lng], 15);
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 19 },
    ).addTo(map);
    L.marker([lat, lng]).addTo(map);
    mapRef.current = map;
    const timers = [50, 200, 500, 900].map((t) =>
      setTimeout(() => map.invalidateSize(), t),
    );
    return () => {
      timers.forEach(clearTimeout);
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="relative block w-full h-44 rounded-2xl overflow-hidden bg-secondary active:scale-[0.99] transition text-left cursor-pointer"
    >
      <div ref={ref} className="absolute inset-0 z-0" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/70 to-transparent z-[1]" />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-[2]">
        {label && <span className="text-sm text-foreground truncate">{label}</span>}
        <span className="ml-auto text-[11px] px-2.5 py-1 rounded-full bg-foreground text-background font-semibold">
          Open map
        </span>
      </div>
    </div>
  );
};