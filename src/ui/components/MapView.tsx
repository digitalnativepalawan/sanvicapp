import { useEffect } from "react";
import L from "leaflet";
import type { Business } from "./FeedItem";
import { useMapLogic } from "@/logic/hooks/useMapLogic";

interface MapViewProps {
  businesses: Business[];
  selectedId: string | null;
  onSelect: (business: Business) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
}

const TILE_URLS = {
  standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
};

export const MapView = ({
  businesses,
  selectedId,
  onSelect,
  initialCenter,
  initialZoom,
  className = "",
}: MapViewProps) => {
  const {
    map,
    bounds,
    selectedBusiness,
    isLoading,
    error,
    containerRef,
    setSelectedBusiness,
    fitBounds,
  } = useMapLogic({
    businesses,
    selectedId,
    onSelect,
    initialCenter,
    initialZoom,
  });

  // Handle tile layer switching (could be moved to hook if needed)
  useEffect(() => {
    if (!map) return;

    const tileLayer = L.tileLayer(TILE_URLS.satellite, { maxZoom: 19 });
    tileLayer.addTo(map);

    return () => {
      map.removeLayer(tileLayer);
    };
  }, [map]);

  // Fit bounds when businesses change
  useEffect(() => {
    if (!map || businesses.length === 0) return;

    const validBusinesses = businesses.filter(b => b.latitude && b.longitude);
    if (validBusinesses.length === 0) return;

    const group = L.featureGroup(validBusinesses.map(b => L.marker([b.latitude!, b.longitude!])));
    fitBounds(group.getBounds().pad(0.25));
  }, [businesses, map, fitBounds]);

  return (
    <div className={`relative flex-1 w-full bg-secondary z-0 min-h-0 ${className}`}>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            <span>Loading map...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-destructive text-sm px-6 text-center bg-background/95 z-10">
          <div>
            <p className="font-semibold mb-1">Map Error</p>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-medium"
            >
              Reload page
            </button>
          </div>
        </div>
      )}

      {/* No businesses message */}
      {!isLoading && !error && businesses.filter(b => b.latitude && b.longitude).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm px-6 text-center">
          No businesses with location data yet.
        </div>
      )}

      {/* Map controls overlay */}
      {map && (
        <div className="absolute top-4 right-16 z-[1000] flex gap-2">
          <button
            onClick={() => {
              // Toggle tile layer (basic implementation)
              // In a full implementation, this would be in the hook
              const currentLayer = map.getContainer().querySelector('.leaflet-tile-pane img')?.src.includes('satellite');
              const newUrl = currentLayer ? TILE_URLS.standard : TILE_URLS.satellite;
              const tileLayer = L.tileLayer(newUrl, { maxZoom: 19 });
              map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                  map.removeLayer(layer);
                }
              });
              tileLayer.addTo(map);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md border border-border/40 text-xs font-medium shadow-lg active:scale-95 transition"
          >
            🌐 Toggle View
          </button>
        </div>
      )}

      {/* Selected business info card (optional overlay) */}
      {selectedBusiness && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-background/95 backdrop-blur-md rounded-lg border border-border/40 p-4 shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{selectedBusiness.name}</h3>
              <p className="text-sm text-muted-foreground">
                {selectedBusiness.zone || "San Vicente"} · {selectedBusiness.category}
              </p>
              <div className="flex gap-2 mt-2">
                {selectedBusiness.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedBusiness.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${selectedBusiness.name}! I found you on San Vicente Live.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition"
                  >
                    WhatsApp
                  </a>
                )}
                {selectedBusiness.phone && (
                  <a
                    href={`tel:${selectedBusiness.phone}`}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition"
                  >
                    Call
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedBusiness(null)}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};