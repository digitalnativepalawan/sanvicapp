'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { POI } from '@/types/map';

interface AdminMapEditorProps {
  pois: POI[];
  onPoiUpdate: (poi: POI) => void;
  onPoiAdd: (poi: POI) => void;
  onPoiDelete: (id: string) => void;
}

export const AdminMapEditor = ({ pois, onPoiUpdate, onPoiAdd, onPoiDelete }: AdminMapEditorProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [id: string]: mapboxgl.Marker }>({});

  const [editingPoi, setEditingPoi] = useState<POI | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [119.247, 10.527],
      zoom: 12,
    });

    // Add click handler for adding new POIs
    map.current.on('click', (e) => {
      const newPoi: POI = {
        id: Date.now().toString(),
        name: 'New POI',
        category: 'beach',
        latitude: e.lngLat.lat,
        longitude: e.lngLat.lng,
        description: 'New point of interest',
        address: 'Address TBD',
        tags: [],
      };
      onPoiAdd(newPoi);
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [onPoiAdd]);

  // Add/update markers
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    pois.forEach((poi) => {
      const el = document.createElement('div');
      el.className = 'admin-marker';
      el.style.backgroundColor = '#ff6b6b';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: true,
      })
        .setLngLat([poi.longitude, poi.latitude])
        .addTo(map.current!);

      // Drag events
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        onPoiUpdate({
          ...poi,
          latitude: lngLat.lat,
          longitude: lngLat.lng,
        });
      });

      // Click to edit
      marker.getElement().addEventListener('click', (e) => {
        e.stopPropagation();
        setEditingPoi(poi);
      });

      markersRef.current[poi.id] = marker;
    });
  }, [pois, onPoiUpdate]);

  return (
    <div className="relative h-screen w-full">
      <div ref={mapContainer} className="h-full w-full" />

      {/* Edit Panel */}
      {editingPoi && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
          <h3 className="font-bold mb-3">Edit POI</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={editingPoi.name}
              onChange={(e) => setEditingPoi({ ...editingPoi, name: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Name"
            />
            <select
              value={editingPoi.category}
              onChange={(e) => setEditingPoi({ ...editingPoi, category: e.target.value as POI['category'] })}
              className="w-full p-2 border rounded"
            >
              <option value="beach">Beach</option>
              <option value="resort">Resort</option>
              <option value="restaurant">Restaurant</option>
              <option value="tour">Tour</option>
            </select>
            <textarea
              value={editingPoi.description}
              onChange={(e) => setEditingPoi({ ...editingPoi, description: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Description"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  onPoiUpdate(editingPoi);
                  setEditingPoi(null);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  onPoiDelete(editingPoi.id);
                  setEditingPoi(null);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setEditingPoi(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg max-w-xs">
        <p className="text-sm text-gray-600">
          Click on the map to add a new POI. Drag markers to reposition. Click markers to edit.
        </p>
      </div>
    </div>
  );
};