import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Dimensions, Alert, Animated, TextInput,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Upload } from 'tus-js-client';

// Convert a Supabase Storage public URL to an image render URL with resize params.
// Original URL is preserved in the DB — transforms are derived on-the-fly.
function renderUrl(publicUrl: string, width: number, quality = 80): string {
  return publicUrl
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    + `?width=${width}&quality=${quality}`;
}
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  useRealtimeOrder(id ?? null);

  const order = currentOrder?.id === id ? currentOrder : null;
  const photographer = (order as any)?.photographer;
  const photos = (order as any)?.photos ?? [];

  // Determine if the current user is the photographer for this order
  const isPhotographer = !!user && !!photographer && photographer.user_id === user.id;
  const isClient = !!user && order?.client_id === user.id;

  const isPending = order?.status === 'pending';
  const isAccepted = order?.status === 'accepted';
  const isInProgress = order?.status === 'in_progress';
  const isDelivering = order?.status === 'delivering';
  const isCompleted = order?.status === 'completed';

  // Pulse animation for pending state
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isPending) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isPending]);

  async function updateStatus(status: OrderStatus) {
    await supabase.from('orders').update({ status }).eq('id', id);
  }

  // ── Photographer: upload photos from camera roll ──────────────────────────
  async function uploadPhotos() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Allow access to your photo library.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,        // no client-side compression — preserve original
      selectionLimit: 40,
    });
    if (result.canceled || result.assets.length === 0) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) { Alert.alert('Not signed in'); return; }

    setUploading(true);
    setUploadProgress({ current: 0, total: result.assets.length });
    let uploaded = 0;

    try {
      // Upload one at a time — parallel uploads saturate mobile bandwidth
      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        setUploadProgress({ current: i + 1, total: result.assets.length });

        const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
        const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
        const path = `${id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

        const response = await fetch(asset.uri);
        const blob = await response.blob();

        try {
          await new Promise<void>((resolve, reject) => {
            const upload = new Upload(blob, {
              endpoint: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
              retryDelays: [0, 1000, 3000, 5000, 10000],
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'x-upsert': 'false',
              },
              uploadDataDuringCreation: true,
              removeFingerprintOnSuccess: true,
              metadata: {
                bucketName: 'order-photos',
                objectName: path,
                contentType: mime,
                cacheControl: '3600',
              },
              chunkSize: 6 * 1024 * 1024,  // 6MB chunks — retries cost < 1s on LTE
              onError: reject,
              onSuccess: resolve,
            });
            upload.start();
          });
        } catch (err) {
          console.error('upload error', err);
          continue;
        }

        const { data: urlData } = supabase.storage.from('order-photos').getPublicUrl(path);
        const original = urlData.publicUrl;

        await supabase.from('order_photos').insert({
          order_id: id,
          url: original,                           // full-res, used for download
          thumbnail_url: renderUrl(original, 400), // 400px preview stored in DB
        });
        uploaded++;
      }

      if (uploaded > 0 && (isInProgress || isAccepted)) {
        await updateStatus('delivering');
      }
      Alert.alert('✅ Uploaded!', `${uploaded} photo${uploaded === 1 ? '' : 's'} delivered to the client.`);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function completeSession() {
    Alert.alert('Complete session?', "The client will receive their photos and the order will close.", [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'Complete', onPress: async () => {
          await updateStatus('completed');
          // Ask the photographer if they want to go back online
          Alert.alert(
            'Great work! 🎉',
            'Do you want to go back online and accept new bookings?',
            [
              {
                text: 'Stay offline',
                style: 'cancel',
                onPress: () => router.back(),
              },
              {
                text: 'Go online',
                onPress: async () => {
                  await supabase
                    .from('photographer_profiles')
                    .update({ is_available: true })
                    .eq('user_id', user!.id);
                  router.back();
                },
              },
            ]
          );
        },
      },
    ]);
  }

  // ── Client: save photos to camera roll ────────────────────────────────────
  async function savePhotos() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required'); return; }
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
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel', style: 'destructive', onPress: async () => {
        await updateStatus('cancelled');
        router.back();
      }},
    ]);
  }

  if (!order) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>{isPhotographer ? 'Active Shoot' : 'Your Order'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Status banner */}
        <View style={styles.statusBanner}>
          {isPending && !isPhotographer ? (
            <View style={styles.pendingState}>
              <Animated.View style={[styles.pendingPulse, { transform: [{ scale: pulse }] }]}>
                <Text style={{ fontSize: 22 }}>📸</Text>
              </Animated.View>
              <Text style={styles.pendingTitle}>Finding your photographer…</Text>
              <Text style={styles.pendingSubtitle}>Your request has been sent. Usually confirmed in minutes.</Text>
            </View>
          ) : (
            <View style={styles.activeState}>
              <Badge label={ORDER_STATUS_LABEL[order.status] ?? order.status} color={STATUS_COLOR[order.status]} />
              <Text style={styles.activeStatusText}>{ORDER_STATUS_LABEL[order.status]}</Text>
            </View>
          )}
        </View>

        {/* Photographer info (client view) */}
        {photographer && isClient && (
          <View style={styles.section}>
            <View style={styles.personRow}>
              <Avatar uri={photographer.user?.avatar_url} name={photographer.user?.full_name} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{photographer.user?.full_name}</Text>
                <StarRating value={photographer.rating} showCount={photographer.total_reviews} size={12} />
              </View>
            </View>
          </View>
        )}

        {/* Client info (photographer view) */}
        {isPhotographer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client</Text>
            <View style={styles.personRow}>
              <Avatar uri={(order as any).client?.avatar_url} name={(order as any).client?.full_name} size={52} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>{(order as any).client?.full_name ?? 'Client'}</Text>
                {order.notes && <Text style={styles.noteText}>💬 "{order.notes}"</Text>}
              </View>
            </View>
          </View>
        )}

        {/* Meeting point */}
        <View style={styles.mapSection}>
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={{ latitude: order.meet_latitude, longitude: order.meet_longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={{ latitude: order.meet_latitude, longitude: order.meet_longitude }} />
          </MapView>
          <Text style={styles.addressLabel}>📍 {order.meet_address}</Text>
        </View>

        {/* Session details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Details</Text>
          <InfoRow label="Package" value={(order as any).service?.name ?? 'Session'} />
          <InfoRow label="Duration" value={`${(order as any).service?.duration_min ?? 60} min`} />
          <InfoRow label="Deliverables" value={(order as any).service?.deliverables ?? '—'} />
          <InfoRow label="Total" value={`$${order.total_price}`} />
        </View>

        {/* ── PHOTOGRAPHER ACTIONS ─────────────────────────────── */}
        {isPhotographer && (isInProgress || isDelivering) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📤 Deliver Photos</Text>
            <Text style={styles.deliverHint}>
              {photos.length === 0
                ? 'Select the best shots from your camera roll to deliver to the client.'
                : `${photos.length} photo${photos.length === 1 ? '' : 's'} delivered so far. Upload more or complete the session.`}
            </Text>
            <Button
              label={
                uploadProgress
                  ? `Uploading ${uploadProgress.current} / ${uploadProgress.total}…`
                  : '📷  Select & Upload Photos'
              }
              variant="primary"
              size="lg"
              onPress={uploadPhotos}
              loading={uploading}
              disabled={uploading}
            />
            {photos.length > 0 && (
              <Button
                label="✅  Complete Session"
                variant="secondary"
                size="md"
                onPress={completeSession}
              />
            )}
          </View>
        )}

        {isPhotographer && isAccepted && (
          <View style={styles.section}>
            <View style={styles.onMyWayBanner}>
              <Text style={styles.onMyWayIcon}>🚶</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.onMyWayTitle}>Head to the meeting point</Text>
                <Text style={styles.onMyWaySubtitle}>When you arrive and start shooting, tap below.</Text>
              </View>
            </View>
            <Button
              label="📷  Start Shoot"
              variant="primary"
              size="lg"
              onPress={() => updateStatus('in_progress')}
            />
          </View>
        )}

        {/* Uploaded photos preview (both views) */}
        {photos.length > 0 && (
          <View style={styles.section}>
            <View style={styles.photoHeader}>
              <Text style={styles.sectionTitle}>📸 {photos.length} Photos</Text>
              {isClient && (
                <TouchableOpacity onPress={savePhotos}>
                  <Text style={styles.saveAll}>Save all ↓</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((p: any) => (
                <Image
                  key={p.id}
                  source={{ uri: renderUrl(p.url, 800, 85) }}
                  style={styles.photo}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Client: review */}
        {isClient && isCompleted && !reviewSubmitted && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leave a Review</Text>
            <StarRating value={reviewRating} interactive onChange={setReviewRating} size={32} />
            <TextInput
              style={styles.reviewInput}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Share your experience…"
              placeholderTextColor={COLORS.muted}
              multiline
              numberOfLines={3}
            />
            <Button label="Submit Review" onPress={submitReview} size="md" />
          </View>
        )}

        {reviewSubmitted && (
          <View style={styles.section}>
            <Text style={styles.reviewThanks}>✅ Thanks for your review!</Text>
          </View>
        )}

        {isClient && isPending && (
          <View style={styles.section}>
            <Button label="Cancel Request" variant="danger" onPress={cancelOrder} size="md" />
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
  statusBanner: { margin: SPACING.base, borderRadius: BORDER_RADIUS.xl, overflow: 'hidden' },
  pendingState: { alignItems: 'center', padding: SPACING.xl, backgroundColor: `${COLORS.primary}08`, gap: SPACING.sm },
  pendingPulse: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${COLORS.primary}20`, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.dark, textAlign: 'center' },
  pendingSubtitle: { fontSize: FONTS.sizes.sm, color: COLORS.muted, textAlign: 'center' },
  activeState: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.base, backgroundColor: `${COLORS.primary}08` },
  activeStatusText: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.dark },
  section: { padding: SPACING.base, borderBottomWidth: 1, borderBottomColor: COLORS.light, gap: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  personName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  noteText: { fontSize: FONTS.sizes.sm, color: COLORS.muted, fontStyle: 'italic', marginTop: 2 },
  mapSection: { margin: SPACING.base, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  map: { height: 150, borderRadius: BORDER_RADIUS.lg },
  addressLabel: { fontSize: FONTS.sizes.sm, color: COLORS.muted, paddingTop: SPACING.xs },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: `${COLORS.light}80` },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.dark, flex: 1, textAlign: 'right' },
  onMyWayBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, padding: SPACING.md, backgroundColor: `${COLORS.primary}08`, borderRadius: BORDER_RADIUS.lg },
  onMyWayIcon: { fontSize: 28 },
  onMyWayTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  onMyWaySubtitle: { fontSize: FONTS.sizes.xs, color: COLORS.muted, marginTop: 2 },
  deliverHint: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  photoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveAll: { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600' },
  photo: { width: width * 0.55, height: width * 0.55, borderRadius: BORDER_RADIUS.lg, marginRight: SPACING.sm, backgroundColor: COLORS.light },
  reviewInput: { borderWidth: 1.5, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.base, color: COLORS.dark, textAlignVertical: 'top', minHeight: 80 },
  reviewThanks: { fontSize: FONTS.sizes.base, color: COLORS.success, fontWeight: '600', textAlign: 'center', padding: SPACING.md },
});
