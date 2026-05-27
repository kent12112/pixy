import { useEffect } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useMapStore } from '@/store/mapStore';
import type { PhotographerProfile } from '@/types';

export function useNearbyPhotographers(radiusKm = 10) {
  const { userLocation, setUserLocation, setPhotographers, setRegion, setLoading } = useMapStore();

  useEffect(() => {
    requestLocationAndFetch();
  }, []);

  async function requestLocationAndFetch() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fall back to default region (New York)
        await fetchNearby(40.758, -73.9855);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setUserLocation({ latitude, longitude });
      setRegion({ latitude, longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 });
      await fetchNearby(latitude, longitude);
    } finally {
      setLoading(false);
    }
  }

  async function fetchNearby(lat: number, lng: number) {
    const { data, error } = await supabase.rpc('nearby_photographers', {
      lat,
      lng,
      radius_km: radiusKm,
    });
    if (error) {
      console.error('[useNearbyPhotographers]', error);
      return;
    }
    // Fetch user details for each photographer
    const ids = (data as any[]).map((p: any) => p.user_id);
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .in('id', ids);

    const userMap = Object.fromEntries((users ?? []).map((u: any) => [u.id, u]));
    const photographers: PhotographerProfile[] = (data as any[]).map((p: any) => ({
      ...p,
      user: userMap[p.user_id],
    }));
    setPhotographers(photographers);
  }

  return { refetch: requestLocationAndFetch };
}
