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
  selectedId: string | null;
  onSelect: (b: Business) => void;
}

export const MapView = ({ businesses, selectedId, onSelect }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const viewRef = useRef<"standard" | "satellite">("satellite");
  const businessesRef = useRef<Business[]>(businesses);
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    businessesRef.current = businesses;
    onSelectRef.current = onSelect;
    selectedIdRef.current = selectedId;
  }, [businesses, onSelect, selectedId]);

  // Initialize map on mount and when container becomes visible
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: false,
      // Ensure map fills container
      preferCanvas: true,
    }).setView([10.55, 118.95], 12);

    L.control.zoom({ position: "topright" }).addTo(map);
    mapRef.current = map;

    // Invalidate size after mount to ensure proper rendering
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timeout);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
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
      const isSelected = b.id === selectedIdRef.current;

      // Custom icon for selected business (green checkmark pin)
      const iconHtml = isSelected
        ? `<div style="
            width: 32px;
            height: 40px;
            background: linear-gradient(135deg, hsl(142, 70%, 49%) 0%, hsl(142, 70%, 35%) 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 16px;">✓</div>
          </div>`
        : undefined;

      const icon = iconHtml
        ? L.divIcon({
            html: iconHtml,
            className: 'custom-marker',
            iconSize: isSelected ? [32, 40] : [25, 40],
            iconAnchor: isSelected ? [16, 40] : [12, 40],
            popupAnchor: [0, -40],
          })
        : undefined;

      const marker = L.marker([b.latitude!, b.longitude!], icon ? { icon } : undefined);

      const description = b.category === "Stay"
        ? `Comfortable ${b.zone || "San Vicente"} stay, ideal for slow island days.`
        : b.category === "Eat"
        ? `Local favorite serving fresh ${b.zone?.toLowerCase().includes("beach") ? "seafood" : "Filipino dishes"}.`
        : b.category === "Experience"
        ? `Curated ${b.tag || "island"} experience with trusted local guides.`
        : `Reliable transport service across ${b.zone || "San Vicente"}.`;

      const popupId = `popup-${b.id}`;

      const popupHtml = `
        <div id="${popupId}" style="font-family: Inter, system-ui, sans-serif; min-width: 200px; text-align: left; background: #0a0d14; color: #f0f4f8; padding: 12px; border-radius: 8px; ${isSelected ? 'border: 2px solid hsl(142, 70%, 49%);' : ''}">
          <h3 style="font-weight: 700; margin: 0 0 4px; font-size: 15px; color: #f0f4f8;">${b.name}</h3>
          <p style="margin: 0 0 8px; font-size: 11px; color: #8899a6; text-transform: uppercase; letter-spacing: 0.05em;">
            ${b.zone || "San Vicente"} · ${b.category}
          </p>
          <p style="margin: 0 0 12px; font-size: 13px; color: #b8c5d0; line-height: 1.4;">
            ${description}
          </p>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${b.whatsapp ? `
              <a
                href="https://wa.me/${b.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${b.name}! I found you on San Vicente Live.`)}"
                target="_blank"
                rel="noopener noreferrer"
                class="map-popup-whatsapp-btn"
                data-business-id="${b.id}"
                style="width: 100%; padding: 14px; border-radius: 9999px; background: #25D366; color: #fff; font-weight: 600; font-size: 15px; border: none; cursor: pointer; text-align: center; text-decoration: none; display: block; box-shadow: 0 6px 16px rgba(37, 211, 102, 0.35);"
              >
                💬 WhatsApp Now
              </a>
            ` : ''}
            ${b.phone ? `
              <a
                href="tel:${b.phone}"
                class="map-popup-call-btn"
                data-business-id="${b.id}"
                style="width: 100%; padding: 14px; border-radius: 9999px; background: #2563eb; color: #fff; font-weight: 600; font-size: 15px; border: none; cursor: pointer; text-align: center; text-decoration: none; display: block; box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);"
              >
                📞 Call Now
              </a>
            ` : ''}
            <button
              class="map-view-details-btn"
              data-business-id="${b.id}"
              style="width: 100%; padding: 12px; border-radius: 9999px; background: #0ea5e9; color: #fff; font-weight: 600; font-size: 14px; border: none; cursor: pointer;"
            >
              View full details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 240 });
      marker.on("popupopen", (e) => {
        const node = (e.popup.getElement() as HTMLElement | null);
        const btn = node?.querySelector(".map-view-details-btn") as HTMLButtonElement | null;
        if (!btn) return;
        const handler = (ev: Event) => {
          ev.preventDefault();
          ev.stopPropagation();
          const id = btn.getAttribute("data-business-id");
          const biz = businessesRef.current.find((x) => x.id === id);
          if (biz) {
            mapRef.current?.closePopup();
            onSelectRef.current(biz);
          }
        };
        btn.addEventListener("click", handler);
        btn.addEventListener("touchend", handler);
      });
      marker.addTo(group);
      markersRef.current.push(marker);
    });

    group.addTo(mapRef.current);

    // If a business is selected, zoom to it and open its popup
    if (selectedIdRef.current) {
      const selectedBiz = valid.find(b => b.id === selectedIdRef.current);
      if (selectedBiz) {
        mapRef.current.setView([selectedBiz.latitude!, selectedBiz.longitude!], 16);
        setTimeout(() => {
          const selectedMarker = markersRef.current.find(m => {
            const latlng = m.getLatLng();
            return latlng.lat === selectedBiz.latitude && latlng.lng === selectedBiz.longitude;
          });
          selectedMarker?.openPopup();
        }, 300);
      }
    } else {
      mapRef.current.fitBounds(group.getBounds().pad(0.25), { animate: true });
    }
  }, [businesses, selectedId]);

  return (
    <div className="relative h-[calc(100vh-110px)] w-full bg-secondary z-0">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      <button
        onClick={() => {
          viewRef.current = viewRef.current === "satellite" ? "standard" : "satellite";
          if (mapRef.current && tileRef.current) {
            mapRef.current.removeLayer(tileRef.current);
            tileRef.current = L.tileLayer(TILE_URLS[viewRef.current], { maxZoom: 19 }).addTo(mapRef.current);
          }
        }}
        className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/40 text-xs font-medium shadow-lg active:scale-95 transition"
      >
        {viewRef.current === "satellite" ? "🛰️ Satellite" : "🗺️ Standard"}
      </button>
    </div>
  );
};
