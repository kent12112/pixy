import React, { useRef, useState, useEffect } from 'react';
import {
  View, StyleSheet, Text, SafeAreaView, TouchableOpacity,
  ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { PhotographerPin } from '@/components/map/PhotographerPin';
import { PhotographerCard } from '@/components/photographer/PhotographerCard';
import { useMapStore } from '@/store/mapStore';
import { useNearbyPhotographers } from '@/hooks/useNearbyPhotographers';
import type { PhotographerProfile } from '@/types';
import { COLORS, SPACING, BORDER_RADIUS, FONTS } from '@/constants';

const { height } = Dimensions.get('window');

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { region, photographers, isLoading } = useMapStore();
  const { refetch } = useNearbyPhotographers();
  const [showList, setShowList] = useState(false);

  // Animate map to user's location once it's resolved
  useEffect(() => {
    mapRef.current?.animateToRegion(region, 800);
  }, [region.latitude, region.longitude]);

  function handlePinPress(p: PhotographerProfile) {
    router.push(`/photographer/${p.id}`);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {photographers.map((p) => (
          <PhotographerPin
            key={p.id}
            photographer={p}
            selected={false}
            onPress={() => handlePinPress(p)}
          />
        ))}
      </MapView>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} pointerEvents="box-none">
        <View style={styles.header}>
          <Text style={styles.logo}>pixy</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{photographers.length} near you</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Loading */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      )}


      {/* List toggle + refresh */}
      <View style={styles.bottomFab}>
          <TouchableOpacity style={styles.fab} onPress={refetch}>
            <Text style={styles.fabIcon}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fab, styles.fabList]} onPress={() => setShowList((v) => !v)}>
            <Text style={styles.fabIcon}>{showList ? '🗺️' : '☰'}</Text>
          </TouchableOpacity>
        </View>

      {/* List view overlay */}
      {showList && (
        <View style={styles.listPanel}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Nearby Photographers</Text>
            <TouchableOpacity onPress={() => setShowList(false)}>
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Map</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={photographers}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: SPACING.base, gap: SPACING.md }}
            renderItem={({ item }) => (
              <PhotographerCard photographer={item} variant="card" />
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  map: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logo: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.primary, letterSpacing: -1 },
  countBadge: {
    backgroundColor: `${COLORS.primary}15`,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  countText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.primary },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
    paddingBottom: SPACING['3xl'],
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.light,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sheetTapHint: {
    textAlign: 'center',
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary,
    fontWeight: '600',
    paddingBottom: SPACING.sm,
  },
  bottomFab: {
    position: 'absolute',
    bottom: SPACING['2xl'],
    right: SPACING.base,
    gap: SPACING.sm,
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  fabList: { backgroundColor: COLORS.primary },
  fabIcon: { fontSize: 20 },
  listPanel: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    paddingTop: SPACING['3xl'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.light,
  },
  listTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
});
