import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, TouchableOpacity, ActivityIndicator, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PhotographerProfile, Service } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';

const { width } = Dimensions.get('window');
const IMG_SIZE = (width - SPACING.base * 2 - SPACING.sm * 2) / 3;

export default function PhotographerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function load(photographerId: string) {
    const { data: p } = await supabase
      .from('photographer_profiles')
      .select('*, user:users(*), services(*)')
      .eq('id', photographerId)
      .single();
    setProfile(p as any);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!profile) return null;
  const { user } = profile;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.heroRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Identity */}
        <View style={styles.identity}>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size={80} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user?.full_name}</Text>
              {profile.is_available && <Badge label="Available" color="success" />}
            </View>
            <Text style={styles.location}>📍 {profile.location_name}</Text>
            <TouchableOpacity onPress={() => router.push(`/photographer/reviews/${profile.id}` as any)}>
              <StarRating value={profile.rating} showCount={profile.total_reviews} />
            </TouchableOpacity>
          </View>
          <View>
            <Text style={styles.bigPrice}>${profile.base_price}</Text>
            <Text style={styles.perHr}>/hr</Text>
          </View>
        </View>

        {/* Bio */}
        {profile.bio ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Sessions', value: profile.total_orders },
            { label: 'Reviews', value: profile.total_reviews },
            { label: 'Avg. response', value: `${profile.response_time_min}m` },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.tagRow}>
            {profile.specialties.map((s) => <Badge key={s} label={s} color="primary" />)}
          </View>
        </View>

        {/* Portfolio */}
        {profile.portfolio_urls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <View style={styles.grid}>
              {profile.portfolio_urls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={[styles.gridImg, { width: IMG_SIZE, height: IMG_SIZE }]} />
              ))}
            </View>
          </View>
        )}

        {/* Services */}
        {(profile.services ?? []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <View style={styles.servicesList}>
              {(profile.services ?? []).filter((s: Service) => s.is_active).map((s: Service) => (
                <View key={s.id} style={styles.serviceCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceName}>{s.name}</Text>
                    <Text style={styles.serviceDesc}>{s.description}</Text>
                    <Text style={styles.serviceDeliverables}>📦 {s.deliverables}</Text>
                    <Text style={styles.serviceDuration}>⏱ {s.duration_min} min</Text>
                  </View>
                  <View style={styles.servicePriceCol}>
                    <Text style={styles.servicePrice}>${s.price}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews — tap rating to open full reviews page */}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA */}
      <View style={styles.bookBar}>
        <Button
          label={profile.is_available ? 'Book Now →' : 'Schedule a Shoot'}
          variant="primary"
          size="lg"
          onPress={() => router.push(`/booking/${profile.id}`)}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroRow: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: COLORS.dark },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, padding: SPACING.base },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' },
  name: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  location: { fontSize: FONTS.sizes.sm, color: COLORS.muted, marginVertical: 2 },
  bigPrice: { fontSize: FONTS.sizes['2xl'], fontWeight: '900', color: COLORS.primary, textAlign: 'right' },
  perHr: { fontSize: FONTS.sizes.xs, color: COLORS.muted, textAlign: 'right' },
  section: { paddingHorizontal: SPACING.base, marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  bio: { fontSize: FONTS.sizes.base, color: COLORS.dark, lineHeight: 22 },
  statsRow: { flexDirection: 'row', marginHorizontal: SPACING.base, marginBottom: SPACING.lg, backgroundColor: `${COLORS.primary}08`, borderRadius: BORDER_RADIUS.lg, padding: SPACING.base },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  gridImg: { borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.light },
  servicesList: { gap: SPACING.sm },
  serviceCard: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  serviceName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  serviceDesc: { fontSize: FONTS.sizes.sm, color: COLORS.muted, marginTop: 2 },
  serviceDeliverables: { fontSize: FONTS.sizes.xs, color: COLORS.muted, marginTop: SPACING.xs },
  serviceDuration: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  servicePriceCol: { justifyContent: 'center', marginLeft: SPACING.md },
  servicePrice: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary },
  bookBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    padding: SPACING.base,
    paddingBottom: SPACING['2xl'],
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
});
