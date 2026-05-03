import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { POI, MapBounds, FilterOptions, MapState } from '@/types/map';

// Mock API function - replace with real Supabase call
const fetchPOIs = async (bounds?: MapBounds, filters?: FilterOptions): Promise<POI[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockPOIs: POI[] = [
    {
      id: '1',
      name: 'San Vicente Long Beach',
      category: 'beach',
      latitude: 10.527,
      longitude: 119.247,
      description: 'Pristine white sand beach perfect for swimming and sunset views.',
      image: '/images/beach1.jpg',
      address: 'San Vicente, Palawan',
      phone: '+63 917 123 4567',
      rating: 4.8,
      priceRange: '$',
      tags: ['swimming', 'sunset', 'family-friendly'],
      isOpen: true,
    },
    {
      id: '2',
      name: 'El Nido Beach Resort',
      category: 'resort',
      latitude: 11.201,
      longitude: 119.416,
      description: 'Luxury resort with ocean views and spa services.',
      image: '/images/resort1.jpg',
      address: 'Las Cabanas Beach, El Nido',
      website: 'https://elnidoresort.com',
      rating: 4.9,
      priceRange: '$$$',
      tags: ['luxury', 'spa', 'ocean-view'],
      isOpen: true,
    },
    // Add more mock POIs...
  ];

  let filtered = mockPOIs;

  if (filters?.category?.length) {
    filtered = filtered.filter(poi => filters.category!.includes(poi.category));
  }

  if (filters?.priceRange?.length) {
    filtered = filtered.filter(poi => filters.priceRange!.includes(poi.priceRange!));
  }

  if (filters?.openNow) {
    filtered = filtered.filter(poi => poi.isOpen);
  }

  if (filters?.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(poi =>
      poi.name.toLowerCase().includes(query) ||
      poi.description.toLowerCase().includes(query) ||
      poi.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  return filtered;
};

interface UseMapTouristLogicProps {
  initialBounds?: MapBounds;
}

export const useMapTouristLogic = ({ initialBounds }: UseMapTouristLogicProps = {}) => {
  const [mapState, setMapState] = useState<MapState>({
    pois: [],
    selectedPoi: null,
    userLocation: null,
    bounds: initialBounds || null,
    filters: {},
    isLoading: false,
    error: null,
  });

  // Fetch POIs with React Query
  const { data: pois, isLoading, error } = useQuery({
    queryKey: ['pois', mapState.bounds, mapState.filters],
    queryFn: () => fetchPOIs(mapState.bounds, mapState.filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    setMapState(prev => ({
      ...prev,
      pois: pois || [],
      isLoading,
      error: error?.message || null,
    }));
  }, [pois, isLoading, error]);

  // Get user geolocation
  const requestGeolocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setMapState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setMapState(prev => ({ ...prev, isLoading: true }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setMapState(prev => ({
        ...prev,
        userLocation,
        isLoading: false,
      }));

      return userLocation;
    } catch (err) {
      setMapState(prev => ({
        ...prev,
        error: 'Unable to get your location',
        isLoading: false,
      }));
    }
  }, []);

  // Update bounds (called on map move/zoom)
  const updateBounds = useCallback((bounds: MapBounds) => {
    setMapState(prev => ({ ...prev, bounds }));
  }, []);

  // Select POI
  const selectPoi = useCallback((poi: POI | null) => {
    setMapState(prev => ({ ...prev, selectedPoi: poi }));
  }, []);

  // Update filters
  const updateFilters = useCallback((filters: Partial<FilterOptions>) => {
    setMapState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  // Get directions (opens in external app)
  const getDirections = useCallback((destination: POI) => {
    if (!mapState.userLocation) return;

    const origin = `${mapState.userLocation.lat},${mapState.userLocation.lng}`;
    const dest = `${destination.latitude},${destination.longitude}`;
    const url = `https://www.google.com/maps/dir/${origin}/${dest}`;

    window.open(url, '_blank');
  }, [mapState.userLocation]);

  // Calculate distances from user location
  useEffect(() => {
    if (!mapState.userLocation || !pois) return;

    const poisWithDistance = pois.map(poi => ({
      ...poi,
      distance: calculateDistance(
        mapState.userLocation!.lat,
        mapState.userLocation!.lng,
        poi.latitude,
        poi.longitude
      ),
    }));

    setMapState(prev => ({ ...prev, pois: poisWithDistance }));
  }, [mapState.userLocation, pois]);

  return {
    ...mapState,
    requestGeolocation,
    updateBounds,
    selectPoi,
    updateFilters,
    getDirections,
  };
};

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}