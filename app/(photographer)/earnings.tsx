import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, FlatList,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { Order } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS } from '@/constants';

interface EarningSummary {
  total: number;
  thisMonth: number;
  thisWeek: number;
  completedSessions: number;
  avgOrderValue: number;
}

export default function EarningsScreen() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<EarningSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    const { data: profile } = await supabase
      .from('photographer_profiles')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    if (!profile) { setLoading(false); return; }

    const { data } = await supabase
      .from('orders')
      .select('*, service:services(*), client:users!orders_client_id_fkey(*)')
      .eq('photographer_id', profile.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    const completed = (data as any) ?? [] as Order[];
    setOrders(completed);

    const now = new Date();
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = completed.reduce((s: number, o: any) => s + Number(o.total_price), 0);
    const thisMonth = completed
      .filter((o: any) => new Date(o.created_at) >= startOfMonth)
      .reduce((s: number, o: any) => s + Number(o.total_price), 0);
    const thisWeek = completed
      .filter((o: any) => new Date(o.created_at) >= startOfWeek)
      .reduce((s: number, o: any) => s + Number(o.total_price), 0);

    setSummary({
      total,
      thisMonth,
      thisWeek,
      completedSessions: completed.length,
      avgOrderValue: completed.length ? total / completed.length : 0,
    });
    setLoading(false);
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Earnings</Text>

        {/* Summary cards */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total Earned</Text>
          <Text style={styles.heroValue}>${summary?.total.toFixed(2) ?? '0.00'}</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="This week" value={`$${summary?.thisWeek.toFixed(0) ?? 0}`} emoji="📅" />
          <StatCard label="This month" value={`$${summary?.thisMonth.toFixed(0) ?? 0}`} emoji="🗓️" />
          <StatCard label="Avg. order" value={`$${summary?.avgOrderValue.toFixed(0) ?? 0}`} emoji="📊" />
          <StatCard label="Sessions" value={String(summary?.completedSessions ?? 0)} emoji="📷" />
        </View>

        {/* Transaction list */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {orders.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptyDesc}>Complete your first session to see your earnings here.</Text>
          </View>
        ) : (
          orders.map((o) => (
            <View key={o.id} style={styles.txRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.txClient}>{(o as any).client?.full_name ?? 'Client'}</Text>
                <Text style={styles.txService}>{(o as any).service?.name ?? 'Session'}</Text>
                <Text style={styles.txDate}>
                  {new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.txAmount}>+${Number(o.total_price).toFixed(2)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: string; emoji: string }) {
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
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.dark },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  heroLabel: { fontSize: FONTS.sizes.base, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  heroValue: { fontSize: FONTS.sizes['3xl'], fontWeight: '900', color: COLORS.white },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: `${COLORS.primary}08`, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center', gap: 2 },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: FONTS.sizes.xl, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.light },
  txClient: { fontSize: FONTS.sizes.base, fontWeight: '600', color: COLORS.dark },
  txService: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  txDate: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  txAmount: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.success },
  empty: { alignItems: 'center', padding: SPACING['2xl'], gap: SPACING.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  emptyDesc: { fontSize: FONTS.sizes.base, color: COLORS.muted, textAlign: 'center' },
});
