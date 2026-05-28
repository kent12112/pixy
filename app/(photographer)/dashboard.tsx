import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Switch, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import type { PhotographerProfile, Order } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, ORDER_STATUS_LABEL } from '@/constants';

export default function PhotographerDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingAvailability, setTogglingAvailability] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    const [{ data: p }, { data: orders }] = await Promise.all([
      supabase.from('photographer_profiles').select('*').eq('user_id', user!.id).single(),
      supabase
        .from('orders')
        .select('*, service:services(*), client:users!orders_client_id_fkey(*)')
        .eq('photographer_id', (await supabase.from('photographer_profiles').select('id').eq('user_id', user!.id).single()).data?.id ?? '')
        .in('status', ['pending', 'accepted', 'in_progress', 'delivering'])
        .order('created_at', { ascending: false }),
    ]);
    setProfile(p as any);
    setActiveOrders((orders as any) ?? []);
    setLoading(false);
  }

  async function toggleAvailability() {
    if (!profile) return;
    setTogglingAvailability(true);
    const { error } = await supabase
      .from('photographer_profiles')
      .update({ is_available: !profile.is_available })
      .eq('id', profile.id);
    if (!error) setProfile({ ...profile, is_available: !profile.is_available });
    setTogglingAvailability(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  const isOnboarded = !!profile;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Greeting */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.greeting}>Hey, {user?.full_name?.split(' ')[0]} 👋</Text>
            <Text style={styles.subGreeting}>
              {isOnboarded ? 'Your photographer dashboard' : 'Set up your profile to start earning'}
            </Text>
          </View>
          <Avatar uri={user?.avatar_url} name={user?.full_name} size={44} />
        </View>

        {/* Onboarding prompt */}
        {!isOnboarded && (
          <View style={styles.onboardCard}>
            <Text style={styles.onboardTitle}>Complete your profile</Text>
            <Text style={styles.onboardDesc}>
              Add your bio, portfolio, and set your prices to appear on the map and start receiving bookings.
            </Text>
            <TouchableOpacity style={styles.onboardBtn}>
              <Text style={styles.onboardBtnLabel}>Set Up Profile →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Availability toggle */}
        {isOnboarded && (
          <View style={styles.availCard}>
            <View>
              <Text style={styles.availTitle}>
                {profile?.is_available ? "🟢 You're available" : "🔴 You're offline"}
              </Text>
              <Text style={styles.availDesc}>
                {profile?.is_available
                  ? 'Clients can see you on the map and book you'
                  : 'Toggle on to start receiving booking requests'}
              </Text>
            </View>
            <Switch
              value={profile?.is_available ?? false}
              onValueChange={toggleAvailability}
              disabled={togglingAvailability}
              trackColor={{ false: COLORS.light, true: `${COLORS.success}60` }}
              thumbColor={profile?.is_available ? COLORS.success : COLORS.muted}
            />
          </View>
        )}

        {/* Stats */}
        {isOnboarded && profile && (
          <View style={styles.statsGrid}>
            <StatCard emoji="⭐" label="Rating" value={profile.rating.toFixed(1)} />
            <StatCard emoji="📋" label="Sessions" value={String(profile.total_orders)} />
            <StatCard emoji="💬" label="Reviews" value={String(profile.total_reviews)} />
            <StatCard emoji="⚡" label="Avg Response" value={`${profile.response_time_min}m`} />
          </View>
        )}

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Orders ({activeOrders.length})</Text>
            {activeOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/order/${order.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderService}>{(order as any).service?.name ?? 'Session'}</Text>
                  <Badge
                    label={ORDER_STATUS_LABEL[order.status] ?? order.status}
                    color={order.status === 'pending' ? 'warning' : 'primary'}
                  />
                </View>
                <Text style={styles.orderClient}>👤 {(order as any).client?.full_name}</Text>
                <Text style={styles.orderAddress}>📍 {order.meet_address}</Text>
                <Text style={styles.orderPrice}>${order.total_price}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeOrders.length === 0 && isOnboarded && (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptyDesc}>
              {profile?.is_available
                ? "You're visible to clients. Bookings will appear here."
                : 'Toggle availability to start getting bookings.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: SPACING.base, gap: SPACING.lg },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.dark },
  subGreeting: { fontSize: FONTS.sizes.sm, color: COLORS.muted, marginTop: 2 },
  onboardCard: { backgroundColor: `${COLORS.accent}20`, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, gap: SPACING.sm },
  onboardTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  onboardDesc: { fontSize: FONTS.sizes.base, color: COLORS.muted },
  onboardBtn: { backgroundColor: COLORS.accent, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm, alignSelf: 'flex-start' },
  onboardBtnLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.black },
  availCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.light, borderRadius: BORDER_RADIUS.xl, padding: SPACING.base },
  availTitle: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  availDesc: { fontSize: FONTS.sizes.xs, color: COLORS.muted, marginTop: 2, maxWidth: '80%' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: `${COLORS.primary}08`, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: 2 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  section: { gap: SPACING.sm },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderCard: { borderWidth: 1, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, gap: SPACING.xs },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderService: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  orderClient: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  orderAddress: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  orderPrice: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  emptyOrders: { alignItems: 'center', padding: SPACING['2xl'], gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  emptyDesc: { fontSize: FONTS.sizes.base, color: COLORS.muted, textAlign: 'center' },
});
