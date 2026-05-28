import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import type { PhotographerProfile, Service } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';

export default function BookingScreen() {
  const { photographerId } = useLocalSearchParams<{ photographerId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [meetLocation, setMeetLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [meetAddress, setMeetAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (photographerId) loadProfile(photographerId);
  }, [photographerId]);

  async function loadProfile(id: string) {
    const [{ data: p }, location] = await Promise.all([
      supabase.from('photographer_profiles').select('*, user:users(*), services(*)').eq('id', id).single(),
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }).catch(() => null),
    ]);
    setProfile(p as any);
    const activeServices = ((p as any)?.services ?? []).filter((s: Service) => s.is_active);
    setServices(activeServices);
    if (activeServices.length) setSelectedService(activeServices[0]);
    if (location) {
      setMeetLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      reverseGeocode(location.coords.latitude, location.coords.longitude);
    }
    setLoading(false);
  }

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result) {
        setMeetAddress([result.name, result.city].filter(Boolean).join(', '));
      }
    } catch {}
  }

  async function handleRequest() {
    if (!selectedService) { Alert.alert('Select a package first'); return; }
    if (!meetLocation) { Alert.alert('Could not get your location'); return; }
    if (!user) return;

    setSubmitting(true);
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          photographer_id: profile!.id,
          service_id: selectedService.id,
          meet_latitude: meetLocation.latitude,
          meet_longitude: meetLocation.longitude,
          meet_address: meetAddress || `${meetLocation.latitude.toFixed(4)}, ${meetLocation.longitude.toFixed(4)}`,
          notes: notes || null,
          total_price: selectedService.price,
          scheduled_at: null, // instant / on-demand
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('conversations').insert({
        order_id: order.id,
        client_id: user.id,
        photographer_id: profile!.user_id,
      });

      router.replace(`/order/${order.id}`);
    } catch (err: any) {
      Alert.alert('Request failed', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Close */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Photographer hero */}
        <View style={styles.hero}>
          <Avatar uri={profile.user?.avatar_url} name={profile.user?.full_name} size={64} />
          <View style={styles.heroText}>
            <Text style={styles.heroName}>{profile.user?.full_name}</Text>
            <Text style={styles.heroLocation}>📍 {profile.location_name}</Text>
            <View style={styles.heroMeta}>
              <Text style={styles.metaItem}>⭐ {profile.rating}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaItem}>⚡ ~{profile.response_time_min} min response</Text>
            </View>
          </View>
        </View>

        {/* Live availability banner */}
        <View style={styles.availBanner}>
          <View style={styles.availDot} />
          <Text style={styles.availText}>
            Available right now · usually responds in {profile.response_time_min} min
          </Text>
        </View>

        {/* Your current location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📍 Your location</Text>
          {meetLocation ? (
            <>
              <MapView
                style={styles.miniMap}
                provider={PROVIDER_DEFAULT}
                initialRegion={{ ...meetLocation, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
                onPress={(e) => {
                  const coord = e.nativeEvent.coordinate;
                  setMeetLocation(coord);
                  reverseGeocode(coord.latitude, coord.longitude);
                }}
              >
                <Marker coordinate={meetLocation} />
              </MapView>
              {meetAddress ? (
                <Text style={styles.addressText}>{meetAddress} · <Text style={styles.addressHint}>tap map to adjust</Text></Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.noLocationText}>Getting your location…</Text>
          )}
        </View>

        {/* Package selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>📦 Choose a package</Text>
          {services.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[styles.serviceOption, selectedService?.id === s.id && styles.serviceSelected]}
              onPress={() => setSelectedService(s)}
              activeOpacity={0.8}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.serviceOptName, selectedService?.id === s.id && { color: COLORS.primary }]}>
                  {s.name}
                </Text>
                <Text style={styles.serviceOptMeta}>⏱ {s.duration_min} min · {s.deliverables}</Text>
              </View>
              <Text style={[styles.serviceOptPrice, selectedService?.id === s.id && { color: COLORS.primary }]}>
                ${s.price}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Optional note */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>💬 Message (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="E.g. Meet me at the main entrance. Looking for candid, fun shots!"
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Request footer */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerPrice}>${selectedService?.price ?? 0}</Text>
        </View>
        <Button
          label={submitting ? 'Sending request…' : '📸  Request Now'}
          variant="primary"
          size="lg"
          onPress={handleRequest}
          loading={submitting}
          disabled={!selectedService || !meetLocation}
          style={styles.requestBtn}
        />
        <Text style={styles.footerDisclaimer}>
          The photographer will confirm within {profile.response_time_min} min. No charge until they accept.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtn: {
    position: 'absolute', top: 52, right: SPACING.base,
    zIndex: 10, width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: COLORS.muted },
  container: { padding: SPACING.base, gap: SPACING.xl, paddingTop: SPACING['2xl'] },
  // Hero
  hero: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  heroText: { flex: 1 },
  heroName: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  heroLocation: { fontSize: FONTS.sizes.sm, color: COLORS.muted, marginTop: 2 },
  heroMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  metaItem: { fontSize: FONTS.sizes.sm, color: COLORS.dark, fontWeight: '500' },
  metaDot: { color: COLORS.muted },
  // Availability
  availBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
  },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  availText: { fontSize: FONTS.sizes.sm, color: COLORS.success, fontWeight: '600', flex: 1 },
  // Section
  section: { gap: SPACING.sm },
  sectionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.dark },
  miniMap: { height: 160, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  addressText: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  addressHint: { color: COLORS.primary },
  noLocationText: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  // Services
  serviceOption: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.light,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
  },
  serviceSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}06` },
  serviceOptName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  serviceOptMeta: { fontSize: FONTS.sizes.xs, color: COLORS.muted, marginTop: 2 },
  serviceOptPrice: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.muted, marginLeft: SPACING.sm },
  // Notes
  notesInput: {
    borderWidth: 1.5, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.dark,
    textAlignVertical: 'top', minHeight: 72,
  },
  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.base, paddingBottom: SPACING['2xl'],
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: COLORS.light,
    gap: SPACING.sm,
  },
  footerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: FONTS.sizes.sm, color: COLORS.muted, fontWeight: '600' },
  footerPrice: { fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.dark },
  requestBtn: { borderRadius: BORDER_RADIUS.full },
  footerDisclaimer: { fontSize: FONTS.sizes.xs, color: COLORS.muted, textAlign: 'center' },
});
