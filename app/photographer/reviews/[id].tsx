import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import type { Review } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';

export default function PhotographerReviewsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [photographerName, setPhotographerName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  async function load(photographerId: string) {
    const [{ data: profile }, { data: r }] = await Promise.all([
      supabase
        .from('photographer_profiles')
        .select('rating, total_reviews, user:users(full_name)')
        .eq('id', photographerId)
        .single(),
      supabase
        .from('reviews')
        .select('*, client:users!reviews_client_id_fkey(*)')
        .eq('photographer_id', photographerId)
        .order('created_at', { ascending: false }),
    ]);
    if (profile) {
      setAverageRating(profile.rating);
      setPhotographerName((profile as any).user?.full_name ?? '');
    }
    setReviews((r as any) ?? []);
    setLoading(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  const maxCount = Math.max(...dist.map((d) => d.count), 1);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Nav */}
            <View style={styles.nav}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.navTitle} numberOfLines={1}>
                {photographerName ? `${photographerName}'s Reviews` : 'Reviews'}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryLeft}>
                <Text style={styles.bigRating}>{averageRating.toFixed(1)}</Text>
                <StarRating value={averageRating} size={20} />
                <Text style={styles.totalCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={styles.bars}>
                {dist.map(({ star, count }) => (
                  <View key={star} style={styles.barRow}>
                    <Text style={styles.barLabel}>{star}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${(count / maxCount) * 100}%` }]} />
                    </View>
                    <Text style={styles.barCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>

            {reviews.length === 0 && (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={styles.emptyTitle}>No reviews yet</Text>
                <Text style={styles.emptyDesc}>Be the first to review this photographer.</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item: r }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar uri={(r as any).client?.avatar_url} name={(r as any).client?.full_name} size={36} />
              <View style={styles.cardMeta}>
                <Text style={styles.clientName}>{(r as any).client?.full_name ?? 'Client'}</Text>
                <StarRating value={r.rating} size={13} />
              </View>
              <Text style={styles.date}>
                {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            {!!r.comment && <Text style={styles.comment}>{r.comment}</Text>}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 40 },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.light, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: COLORS.dark },
  navTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark, flex: 1, textAlign: 'center' },

  summaryCard: {
    flexDirection: 'row',
    gap: SPACING.lg,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.lg,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 72 },
  bigRating: { fontSize: 44, fontWeight: '900', color: COLORS.primary, lineHeight: 50 },
  totalCount: { fontSize: FONTS.sizes.xs, color: COLORS.muted, marginTop: 2 },
  bars: { flex: 1, justifyContent: 'center', gap: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  barLabel: { fontSize: FONTS.sizes.xs, color: COLORS.muted, width: 10, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, backgroundColor: COLORS.light, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  barCount: { fontSize: FONTS.sizes.xs, color: COLORS.muted, width: 18, textAlign: 'right' },

  card: {
    marginHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.light,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  cardMeta: { flex: 1 },
  clientName: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.dark },
  date: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  comment: { fontSize: FONTS.sizes.sm, color: COLORS.dark, lineHeight: 20 },

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm, paddingHorizontal: SPACING.base },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  emptyDesc: { fontSize: FONTS.sizes.sm, color: COLORS.muted, textAlign: 'center' },
});
