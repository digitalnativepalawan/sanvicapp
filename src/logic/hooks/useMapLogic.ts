import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Business } from "@/ui/components/FeedItem";
import { supabase } from "@/logic/integrations/supabase/client";

// Define types for the hook
interface MapBounds {
  northEast: { lat: number; lng: number };
  southWest: { lat: number; lng: number };
}

interface MapState {
  map: L.Map | null;
  bounds: MapBounds | null;
  selectedBusiness: Business | null;
  isLoading: boolean;
  error: string | null;
}

interface MapActions {
  setSelectedBusiness: (business: Business | null) => void;
  fitBounds: (bounds: L.LatLngBoundsExpression) => void;
  panToBusiness: (business: Business) => void;
}

interface UseMapLogicProps {
  businesses: Business[];
  selectedId: string | null;
  onSelect: (business: Business) => void;
  initialCenter?: [number, number];
  initialZoom?: number;
}

export const useMapLogic = ({
  businesses,
  selectedId,
  onSelect,
  initialCenter = [10.55, 118.95], // Default to San Vicente
  initialZoom = 12,
}: UseMapLogicProps): MapState & MapActions => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);

  const [mapState, setMapState] = useState<MapState>({
    map: null,
    bounds: null,
    selectedBusiness: null,
    isLoading: true,
    error: null,
  });

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
        doubleClickZoom: false,
        preferCanvas: true,
      }).setView(initialCenter, initialZoom);

      // Add zoom control
      L.control.zoom({ position: "topright" }).addTo(map);

      // Initialize marker cluster group
      const markerClusterGroup = L.markerClusterGroup({
        chunkedLoading: true,
        chunkInterval: 200,
        chunkDelay: 50,
      });

      map.addLayer(markerClusterGroup);
      markersRef.current = markerClusterGroup;

      // Handle map events
      map.on("moveend", () => {
        const bounds = map.getBounds();
        setMapState(prev => ({
          ...prev,
          bounds: {
            northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
            southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
          },
        }));
      });

      map.on("zoomend", () => {
        // Update bounds on zoom
        const bounds = map.getBounds();
        setMapState(prev => ({
          ...prev,
          bounds: {
            northEast: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
            southWest: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
          },
        }));
      });

      mapRef.current = map;

      setMapState(prev => ({
        ...prev,
        map,
        isLoading: false,
      }));

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      setMapState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to initialize map",
        isLoading: false,
      }));
    }
  }, [initialCenter, initialZoom]);

  // Update selected business
  useEffect(() => {
    if (!selectedId) {
      setMapState(prev => ({ ...prev, selectedBusiness: null }));
      return;
    }
    const business = businesses.find(b => b.id === selectedId);
    setMapState(prev => ({ ...prev, selectedBusiness: business || null }));
  }, [selectedId, businesses]);

  // Update markers when businesses change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    const validBusinesses = businesses.filter(b => b.latitude && b.longitude);

    validBusinesses.forEach((business) => {
      const isSelected = business.id === selectedId;

      // Custom icon
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
        : `<div style="
            width: 25px;
            height: 40px;
            background: hsl(220, 70%, 50%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          "></div>`;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-marker',
        iconSize: isSelected ? [32, 40] : [25, 40],
        iconAnchor: isSelected ? [16, 40] : [12, 40],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([business.latitude!, business.longitude!], { icon });

      // Enhanced popup with better styling
      const popupHtml = `
        <div style="font-family: Inter, system-ui, sans-serif; min-width: 220px; max-width: 300px; background: #ffffff; color: #1a202c; padding: 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          <h3 style="font-weight: 700; margin: 0 0 8px; font-size: 16px; color: #2d3748;">${business.name}</h3>
          <p style="margin: 0 0 8px; font-size: 12px; color: #718096; text-transform: uppercase; letter-spacing: 0.05em;">
            ${business.zone || "San Vicente"} · ${business.category}
          </p>
          <p style="margin: 0 0 16px; font-size: 14px; color: #4a5568; line-height: 1.4;">
            ${business.category === "Stay"
              ? `Comfortable ${business.zone || "San Vicente"} stay, ideal for slow island days.`
              : business.category === "Eat"
              ? `Local favorite serving fresh ${business.zone?.toLowerCase().includes("beach") ? "seafood" : "Filipino dishes"}.`
              : business.category === "Experience"
              ? `Curated ${business.tag || "island"} experience with trusted local guides.`
              : `Reliable transport service across ${business.zone || "San Vicente"}.`
            }
          </p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${business.whatsapp ? `
              <a
                href="https://wa.me/${business.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${business.name}! I found you on San Vicente Live.`)}"
                target="_blank"
                rel="noopener noreferrer"
                style="width: 100%; padding: 12px; border-radius: 8px; background: #25D366; color: #fff; font-weight: 600; font-size: 14px; border: none; cursor: pointer; text-align: center; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);"
              >
                💬 WhatsApp Now
              </a>
            ` : ''}
            ${business.phone ? `
              <a
                href="tel:${business.phone}"
                style="width: 100%; padding: 12px; border-radius: 8px; background: #2563eb; color: #fff; font-weight: 600; font-size: 14px; border: none; cursor: pointer; text-align: center; text-decoration: none; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);"
              >
                📞 Call Now
              </a>
            ` : ''}
            <button
              data-business-id="${business.id}"
              style="width: 100%; padding: 10px; border-radius: 8px; background: #0ea5e9; color: #fff; font-weight: 600; font-size: 13px; border: none; cursor: pointer;"
            >
              View full details
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { closeButton: false, maxWidth: 320 });

      // Handle popup open to attach click handler
      marker.on("popupopen", () => {
        const btn = document.querySelector(`[data-business-id="${business.id}"]`) as HTMLButtonElement;
        if (btn) {
          btn.onclick = () => {
            onSelect(business);
            mapRef.current?.closePopup();
          };
        }
      });

      markersRef.current.addLayer(marker);
    });
  }, [businesses, selectedId, onSelect]);

  // Actions
  const setSelectedBusiness = useCallback((business: Business | null) => {
    setMapState(prev => ({ ...prev, selectedBusiness: business }));
    if (business && mapRef.current) {
      mapRef.current.setView([business.latitude!, business.longitude!], 16);
    }
  }, []);

  const fitBounds = useCallback((bounds: L.LatLngBoundsExpression) => {
    if (mapRef.current) {
      mapRef.current.fitBounds(bounds, { animate: true });
    }
  }, []);

  const panToBusiness = useCallback((business: Business) => {
    if (mapRef.current && business.latitude && business.longitude) {
      mapRef.current.panTo([business.latitude, business.longitude]);
    }
  }, []);

  return {
    ...mapState,
    setSelectedBusiness,
    fitBounds,
    panToBusiness,
    // Expose refs for the component to use
    containerRef,
  };
};