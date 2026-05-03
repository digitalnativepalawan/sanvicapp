export interface POI {
  id: string;
  name: string;
  category: 'beach' | 'resort' | 'restaurant' | 'tour' | 'activity' | 'accommodation';
  latitude: number;
  longitude: number;
  description: string;
  image?: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  priceRange?: '$' | '$$' | '$$$';
  tags: string[];
  isOpen?: boolean;
  distance?: number; // in km from user location
}

export interface MapBounds {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}

export interface FilterOptions {
  category?: POI['category'][];
  priceRange?: POI['priceRange'][];
  openNow?: boolean;
  nearMe?: boolean;
  searchQuery?: string;
}

export interface MapState {
  pois: POI[];
  selectedPoi: POI | null;
  userLocation: { lat: number; lng: number } | null;
  bounds: MapBounds | null;
  filters: FilterOptions;
  isLoading: boolean;
  error: string | null;
}