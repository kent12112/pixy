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
        setMeetAddress([result.name, result.city, result.region].filter(Boolean).join(', '));
      }
    } catch {}
  }

  async function handleBook() {
    if (!selectedService) { Alert.alert('Select a service first'); return; }
    if (!meetLocation) { Alert.alert('Set a meeting location'); return; }
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
        })
        .select()
        .single();

      if (error) throw error;

      // Create conversation thread
      await supabase.from('conversations').insert({
        order_id: order.id,
        client_id: user.id,
        photographer_id: profile!.user_id,
      });

      router.replace(`/order/${order.id}`);
    } catch (err: any) {
      Alert.alert('Booking failed', err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Book Session</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Photographer summary */}
        <View style={styles.photographerRow}>
          <Avatar uri={profile?.user?.avatar_url} name={profile?.user?.full_name} size={48} />
          <View>
            <Text style={styles.photographerName}>{profile?.user?.full_name}</Text>
            <Text style={styles.photographerLocation}>📍 {profile?.location_name}</Text>
          </View>
        </View>

        {/* Service selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Service</Text>
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
                <Text style={styles.serviceOptMeta}>⏱ {s.duration_min} min · 📦 {s.deliverables}</Text>
              </View>
              <Text style={styles.serviceOptPrice}>${s.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meeting point map */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Meeting Point</Text>
          <Text style={styles.sectionHint}>Tap the map to set your exact location</Text>
          {meetLocation && (
            <MapView
              style={styles.miniMap}
              provider={PROVIDER_DEFAULT}
              initialRegion={{ ...meetLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
              onPress={(e) => {
                const coord = e.nativeEvent.coordinate;
                setMeetLocation(coord);
                reverseGeocode(coord.latitude, coord.longitude);
              }}
            >
              <Marker coordinate={meetLocation} />
            </MapView>
          )}
          {meetAddress ? (
            <Text style={styles.addressText}>📍 {meetAddress}</Text>
          ) : null}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="E.g. Meet me at the fountain entrance. Looking for fun, candid shots."
            placeholderTextColor={COLORS.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Price summary */}
        {selectedService && (
          <View style={styles.priceSummary}>
            <Text style={styles.priceSummaryLabel}>Total</Text>
            <Text style={styles.priceSummaryValue}>${selectedService.price}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={submitting ? 'Booking...' : `Book Now — $${selectedService?.price ?? 0}`}
          variant="primary"
          size="lg"
          onPress={handleBook}
          loading={submitting}
          disabled={!selectedService || !meetLocation}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: SPACING.base, gap: SPACING.lg, paddingBottom: 120 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { fontSize: 18, color: COLORS.muted, padding: SPACING.sm },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  photographerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: `${COLORS.primary}08`, borderRadius: BORDER_RADIUS.lg },
  photographerName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  photographerLocation: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  section: { gap: SPACING.sm },
  sectionLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHint: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  serviceOption: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  serviceSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}06` },
  serviceOptName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  serviceOptMeta: { fontSize: FONTS.sizes.xs, color: COLORS.muted, marginTop: 2 },
  serviceOptPrice: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary, marginLeft: SPACING.sm },
  miniMap: { height: 180, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  addressText: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  notesInput: { borderWidth: 1.5, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.dark, textAlignVertical: 'top', minHeight: 80 },
  priceSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, backgroundColor: `${COLORS.primary}08`, borderRadius: BORDER_RADIUS.lg },
  priceSummaryLabel: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.dark },
  priceSummaryValue: { fontSize: FONTS.sizes.xl, fontWeight: '900', color: COLORS.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.base, paddingBottom: SPACING['2xl'], backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.light },
});
