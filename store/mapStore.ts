import { create } from 'zustand';
import type { LatLng, PhotographerProfile } from '@/types';
import { DEFAULT_REGION } from '@/constants';

interface MapState {
  region: typeof DEFAULT_REGION;
  userLocation: LatLng | null;
  photographers: PhotographerProfile[];
  selectedPhotographer: PhotographerProfile | null;
  isLoading: boolean;
  setRegion: (region: typeof DEFAULT_REGION) => void;
  setUserLocation: (loc: LatLng) => void;
  setPhotographers: (list: PhotographerProfile[]) => void;
  selectPhotographer: (p: PhotographerProfile | null) => void;
  setLoading: (v: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  region: DEFAULT_REGION,
  userLocation: null,
  photographers: [],
  selectedPhotographer: null,
  isLoading: false,
  setRegion: (region) => set({ region }),
  setUserLocation: (userLocation) => set({ userLocation }),
  setPhotographers: (photographers) => set({ photographers }),
  selectPhotographer: (selectedPhotographer) => set({ selectedPhotographer }),
  setLoading: (isLoading) => set({ isLoading }),
}));
