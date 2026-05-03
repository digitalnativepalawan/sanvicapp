'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { POI } from '@/types/map';
import { useMapTouristLogic } from '@/lib/hooks/useMapTouristLogic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Globe, Navigation, Filter } from 'lucide-react';

// Set Mapbox access token (replace with your token)
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

interface MapViewProps {
  className?: string;
}

export const MapView = ({ className }: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const {
    pois,
    selectedPoi,
    userLocation,
    bounds,
    filters,
    isLoading,
    error,
    requestGeolocation,
    updateBounds,
    selectPoi,
    updateFilters,
    getDirections,
  } = useMapTouristLogic();

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v11', // Custom style for tropical theme
      center: [119.247, 10.527], // San Vicente center
      zoom: 12,
      pitch: 45,
      bearing: 0,
    });

    map.current.on('load', () => {
      // Add custom layers for tropical theme
      map.current!.addLayer({
        id: 'water-custom',
        type: 'fill',
        source: 'composite',
        'source-layer': 'water',
        paint: {
          'fill-color': '#4FC3F7', // Light blue for water
          'fill-opacity': 0.8,
        },
      });

      map.current!.addLayer({
        id: 'land-custom',
        type: 'fill',
        source: 'composite',
        'source-layer': 'land',
        paint: {
          'fill-color': '#FFF3E0', // Sandy beige for land
        },
      });
    });

    map.current.on('moveend', () => {
      if (map.current) {
        const newBounds = map.current.getBounds();
        updateBounds({
          northeast: { lat: newBounds.getNorthEast().lat, lng: newBounds.getNorthEast().lng },
          southwest: { lat: newBounds.getSouthWest().lat, lng: newBounds.getSouthWest().lng },
        });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [updateBounds]);

  // Add/update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    pois.forEach((poi) => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundImage = `url(/icons/${poi.category}.png)`; // Custom icons
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.backgroundSize = '100%';
      el.style.cursor = 'pointer';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([poi.longitude, poi.latitude])
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => {
        selectPoi(poi);
        setBottomSheetOpen(true);
      });

      markersRef.current.push(marker);
    });
  }, [pois, selectPoi]);

  // Update map when selected POI changes
  useEffect(() => {
    if (!map.current || !selectedPoi) return;

    map.current.flyTo({
      center: [selectedPoi.longitude, selectedPoi.latitude],
      zoom: 16,
    });
  }, [selectedPoi]);

  const handleNearMe = async () => {
    const location = await requestGeolocation();
    if (location && map.current) {
      map.current.flyTo({
        center: [location.lng, location.lat],
        zoom: 14,
      });
      updateFilters({ nearMe: true });
    }
  };

  return (
    <div className={`relative h-screen w-full ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <Button onClick={handleNearMe} size="sm" className="bg-white shadow-lg">
          <Navigation className="h-4 w-4 mr-2" />
          Near Me
        </Button>
        <Button onClick={() => {}} size="sm" className="bg-white shadow-lg">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Bottom Sheet for POI Details */}
      {bottomSheetOpen && selectedPoi && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPoi.name}</h2>
                <div className="flex items-center mt-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">{selectedPoi.rating}</span>
                  <span className="ml-2 text-sm text-gray-500">{selectedPoi.category}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBottomSheetOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </Button>
            </div>

            {selectedPoi.image && (
              <img
                src={selectedPoi.image}
                alt={selectedPoi.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
            )}

            <p className="text-gray-700 mb-4">{selectedPoi.description}</p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-3" />
                <span>{selectedPoi.address}</span>
              </div>
              {selectedPoi.phone && (
                <div className="flex items-center text-gray-600">
                  <Phone className="h-5 w-5 mr-3" />
                  <a href={`tel:${selectedPoi.phone}`} className="hover:text-blue-600">
                    {selectedPoi.phone}
                  </a>
                </div>
              )}
              {selectedPoi.website && (
                <div className="flex items-center text-gray-600">
                  <Globe className="h-5 w-5 mr-3" />
                  <a
                    href={selectedPoi.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button onClick={() => getDirections(selectedPoi)} className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button variant="outline" className="flex-1">
                Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};