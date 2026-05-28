import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { etaMinutes } from '@/hooks/useNearbyPhotographers';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { PhotographerProfile } from '@/types';
import { COLORS, BORDER_RADIUS, SPACING, FONTS } from '@/constants';

interface Props {
  photographer: PhotographerProfile;
  variant?: 'card' | 'sheet'; // card = compact, sheet = bottom sheet detail
}

export function PhotographerCard({ photographer, variant = 'card' }: Props) {
  const router = useRouter();
  const { user } = photographer;

  function goToProfile() {
    router.push(`/photographer/${photographer.id}`);
  }

  const eta = photographer.distance_km != null ? etaMinutes(photographer.distance_km) : null;

  if (variant === 'card') {
    return (
      <TouchableOpacity style={styles.card} onPress={goToProfile} activeOpacity={0.9}>
        {photographer.portfolio_urls.length > 0 && (
          <Image source={{ uri: photographer.portfolio_urls[0] }} style={styles.cardImage} resizeMode="cover" />
        )}
        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Avatar uri={user?.avatar_url} name={user?.full_name} size={36} />
            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
              <Text style={styles.name} numberOfLines={1}>{user?.full_name ?? 'Photographer'}</Text>
              <Text style={styles.location} numberOfLines={1}>{photographer.location_name}</Text>
            </View>
            {eta != null && (
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>~{eta} min</Text>
              </View>
            )}
          </View>
          <View style={styles.row}>
            <StarRating value={photographer.rating} showCount={photographer.total_reviews} />
            <Text style={styles.price}>${photographer.base_price}/hr</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Sheet variant — shown in bottom sheet when pin is tapped
  return (
    <View style={styles.sheet}>
      {/* Tapping the card body navigates to full profile */}
      <TouchableOpacity onPress={goToProfile} activeOpacity={0.85}>
        <View style={styles.row}>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size={56} />
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.sheetName}>{user?.full_name ?? 'Photographer'}</Text>
            <Text style={styles.location}>{photographer.location_name}</Text>
            <StarRating value={photographer.rating} showCount={photographer.total_reviews} size={13} />
            {eta != null && (
              <View style={styles.sheetEtaRow}>
                <View style={styles.sheetEtaDot} />
                <Text style={styles.sheetEtaText}>arrives in ~{eta} min</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.sheetPrice}>${photographer.base_price}</Text>
            <Text style={styles.perHr}>/hr</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.portfolioRow}>
          {photographer.portfolio_urls.map((url, i) => (
            <Image key={i} source={{ uri: url }} style={styles.portfolioThumb} />
          ))}
        </ScrollView>

        <View style={styles.tagRow}>
          {photographer.specialties.slice(0, 4).map((s) => (
            <Badge key={s} label={s} color="primary" />
          ))}
          {photographer.is_available && <Badge label="Available now" color="success" />}
        </View>
      </TouchableOpacity>

      <View style={styles.sheetActions}>
        <Button label="View Profile →" variant="outline" size="md" onPress={goToProfile} style={{ flex: 1 }} />
        <Button
          label="Book Now"
          variant="primary"
          size="md"
          onPress={() => router.push(`/booking/${photographer.id}`)}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: SPACING.md, gap: SPACING.sm },
  // Sheet
  sheet: { padding: SPACING.base, gap: SPACING.md },
  etaBadge: { backgroundColor: `${COLORS.success}18`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
  etaText: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.success },
  sheetEtaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sheetEtaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success },
  sheetEtaText: { fontSize: FONTS.sizes.xs, fontWeight: '600', color: COLORS.success },
  sheetName: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  sheetPrice: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary, textAlign: 'right' },
  perHr: { fontSize: FONTS.sizes.xs, color: COLORS.muted, textAlign: 'right' },
  portfolioRow: { marginHorizontal: -SPACING.base },
  portfolioThumb: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    marginLeft: SPACING.base,
    backgroundColor: COLORS.light,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  sheetActions: { flexDirection: 'row', gap: SPACING.sm },
  // Shared
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.dark },
  location: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  price: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.primary },
  onlineDot: (available: boolean) => ({
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: available ? COLORS.success : COLORS.light,
    borderWidth: 1.5,
    borderColor: COLORS.white,
  }),
} as any);
