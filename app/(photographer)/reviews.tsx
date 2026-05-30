import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import type { Review } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';

export default function PhotographerReviewsScreen() {
  const { user } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: profile } = await supabase
      .from('photographer_profiles')
      .select('id, rating, total_reviews')
      .eq('user_id', user!.id)
      .single();

    if (!profile) { setLoading(false); setRefreshing(false); return; }

    setAverageRating(profile.rating);

    const { data } = await supabase
      .from('reviews')
      .select('*, client:users!reviews_client_id_fkey(*)')
      .eq('photographer_id', profile.id)
      .order('created_at', { ascending: false });

    setReviews((data as any) ?? []);
    setLoading(false);
    setRefreshing(false);
  }, [user]);

  useEffect(() => { if (user) load(); }, [user]);

  function renderHeader() {
    if (reviews.length === 0) return null;
    const dist = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => r.rating === star).length,
    }));
    const max = Math.max(...dist.map((d) => d.count), 1);

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.bigRating}>{averageRating.toFixed(1)}</Text>
          <StarRating value={averageRating} size={18} />
          <Text style={styles.totalCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.bars}>
          {dist.map(({ star, count }) => (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / max) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reviews</Text>
      </View>
      <FlatList
        data={reviews}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyDesc}>Reviews from clients will appear here after completed sessions.</Text>
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
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.base, paddingBottom: SPACING.sm },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.dark },
  list: { paddingHorizontal: SPACING.base, paddingBottom: 40 },

  summaryCard: {
    flexDirection: 'row',
    gap: SPACING.lg,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  bigRating: { fontSize: 42, fontWeight: '900', color: COLORS.primary, lineHeight: 48 },
  totalCount: { fontSize: FONTS.sizes.xs, color: COLORS.muted, marginTop: 2 },
  bars: { flex: 1, justifyContent: 'center', gap: 5 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  barLabel: { fontSize: FONTS.sizes.xs, color: COLORS.muted, width: 10, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, backgroundColor: COLORS.light, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  barCount: { fontSize: FONTS.sizes.xs, color: COLORS.muted, width: 18, textAlign: 'right' },

  card: {
    backgroundColor: COLORS.white,
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

  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: SPACING.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  emptyDesc: { fontSize: FONTS.sizes.sm, color: COLORS.muted, textAlign: 'center', maxWidth: 260 },
});
