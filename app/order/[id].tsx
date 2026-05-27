import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeOrder } from '@/hooks/useRealtimeOrder';
import { useOrderStore } from '@/store/orderStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { ORDER_STATUS_LABEL, COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';
import type { OrderStatus } from '@/types';

const { width } = Dimensions.get('window');

const STATUS_COLOR: Record<OrderStatus, 'success' | 'warning' | 'error' | 'primary' | 'muted'> = {
  pending: 'warning', accepted: 'primary', in_progress: 'primary',
  delivering: 'success', completed: 'success', cancelled: 'error',
};

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentOrder } = useOrderStore();
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useRealtimeOrder(id ?? null);

  const order = currentOrder?.id === id ? currentOrder : null;

  async function savePhotos() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
    const photos = (order as any)?.photos ?? [];
    for (const p of photos) {
      const localUri = `${FileSystem.cacheDirectory}pixy_${p.id}.jpg`;
      await FileSystem.downloadAsync(p.url, localUri);
      await MediaLibrary.saveToLibraryAsync(localUri);
    }
    Alert.alert('✅ Photos saved to your library!');
  }

  async function submitReview() {
    if (!order || !user) return;
    const { error } = await supabase.from('reviews').insert({
      order_id: order.id,
      client_id: user.id,
      photographer_id: order.photographer_id,
      rating: reviewRating,
      comment: reviewComment,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    setReviewSubmitted(true);
  }

  async function cancelOrder() {
    Alert.alert('Cancel order?', 'This cannot be undone.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel', style: 'destructive',
        onPress: async () => {
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', id);
          router.back();
        },
      },
    ]);
  }

  if (!order) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  const photographer = (order as any).photographer;
  const photos = (order as any).photos ?? [];
  const isCompleted = order.status === 'completed';
  const isPending = order.status === 'pending';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${COLORS.primary}10` }]}>
          <Badge
            label={ORDER_STATUS_LABEL[order.status] ?? order.status}
            color={STATUS_COLOR[order.status]}
          />
          <Text style={styles.statusText}>{ORDER_STATUS_LABEL[order.status]}</Text>
        </View>

        {/* Photographer */}
        {photographer && (
          <View style={styles.section}>
            <View style={styles.photographerRow}>
              <Avatar uri={photographer.user?.avatar_url} name={photographer.user?.full_name} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.photographerName}>{photographer.user?.full_name}</Text>
                <StarRating value={photographer.rating} showCount={photographer.total_reviews} size={12} />
              </View>
              {isPending && (
                <Badge label="Finding photographer…" color="warning" />
              )}
            </View>
          </View>
        )}

        {/* Map */}
        <View style={styles.mapSection}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{
              latitude: order.meet_latitude,
              longitude: order.meet_longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: order.meet_latitude, longitude: order.meet_longitude }} />
          </MapView>
          <Text style={styles.addressLabel}>📍 {order.meet_address}</Text>
        </View>

        {/* Order info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <InfoRow label="Service" value={(order as any).service?.name ?? 'Session'} />
          <InfoRow label="Duration" value={`${(order as any).service?.duration_min ?? 60} min`} />
          <InfoRow label="Total" value={`$${order.total_price}`} />
          {order.notes && <InfoRow label="Notes" value={order.notes} />}
        </View>

        {/* Delivered photos */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={styles.sectionTitle}>📸 {photos.length} Photos Delivered</Text>
              <TouchableOpacity onPress={savePhotos}>
                <Text style={styles.saveAll}>Save all ↓</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((p: any) => (
                <Image key={p.id} source={{ uri: p.url }} style={styles.photo} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Review (completed only) */}
        {isCompleted && !reviewSubmitted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leave a Review</Text>
            <StarRating value={reviewRating} interactive onChange={setReviewRating} size={32} />
            <View style={styles.reviewInput}>
              <Text
                style={styles.reviewPlaceholder}
                onPress={() => {}}
              >
                {reviewComment || 'Share your experience…'}
              </Text>
            </View>
            <Button label="Submit Review" onPress={submitReview} size="md" />
          </View>
        )}

        {reviewSubmitted && (
          <View style={styles.section}>
            <Text style={styles.reviewThanks}>✅ Thanks for your review!</Text>
          </View>
        )}

        {/* Cancel */}
        {isPending && (
          <View style={styles.section}>
            <Button label="Cancel Order" variant="danger" onPress={cancelOrder} size="md" />
          </View>
        )}

        <View style={{ height: SPACING['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.base },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: COLORS.dark },
  navTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.base, marginHorizontal: SPACING.base, borderRadius: BORDER_RADIUS.lg },
  statusText: { fontSize: FONTS.sizes.sm, color: COLORS.dark },
  section: { padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.light },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  photographerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  photographerName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  mapSection: { margin: SPACING.base, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  map: { height: 160, borderRadius: BORDER_RADIUS.lg },
  addressLabel: { fontSize: FONTS.sizes.sm, color: COLORS.muted, padding: SPACING.sm },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: `${COLORS.light}80` },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.dark, flex: 1, textAlign: 'right' },
  photoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  saveAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  photo: { width: width * 0.6, height: width * 0.6, borderRadius: BORDER_RADIUS.lg, marginRight: SPACING.sm, backgroundColor: COLORS.light },
  reviewInput: { borderWidth: 1.5, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, minHeight: 80 },
  reviewPlaceholder: { color: COLORS.muted, fontSize: FONTS.sizes.base },
  reviewThanks: { fontSize: FONTS.sizes.base, color: COLORS.success, fontWeight: '600', textAlign: 'center', padding: SPACING.md },
});
