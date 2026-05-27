import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import type { Order, OrderStatus } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, ORDER_STATUS_LABEL } from '@/constants';

const STATUS_BADGE: Record<OrderStatus, 'success' | 'warning' | 'error' | 'primary' | 'muted'> = {
  pending: 'warning',
  accepted: 'primary',
  in_progress: 'primary',
  delivering: 'success',
  completed: 'success',
  cancelled: 'error',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');

  useEffect(() => {
    if (!user) return;
    fetchOrders();
  }, [user, tab]);

  async function fetchOrders() {
    setLoading(true);
    const activeStatuses = ['pending', 'accepted', 'in_progress', 'delivering'];
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        photographer:photographer_profiles!orders_photographer_id_fkey(
          *, user:users(*)
        ),
        service:services(*)
      `)
      .eq('client_id', user!.id)
      .in('status', tab === 'active' ? activeStatuses : ['completed', 'cancelled'])
      .order('created_at', { ascending: false });

    setOrders((data as any) ?? []);
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <View style={styles.tabs}>
          {(['active', 'past'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t === 'active' ? 'Active' : 'Past'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: SPACING['2xl'] }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={orders.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No {tab} orders</Text>
              <Text style={styles.emptyDesc}>
                {tab === 'active' ? 'Book a photographer to get started!' : 'Completed orders will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/order/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{(item as any).service?.name ?? 'Photography Session'}</Text>
                <Badge
                  label={ORDER_STATUS_LABEL[item.status] ?? item.status}
                  color={STATUS_BADGE[item.status]}
                />
              </View>
              <Text style={styles.photographerName}>
                📷 {(item as any).photographer?.user?.full_name ?? 'Photographer'}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.address} numberOfLines={1}>📍 {item.meet_address}</Text>
                <Text style={styles.price}>${item.total_price}</Text>
              </View>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.dark, marginBottom: SPACING.md },
  tabs: { flexDirection: 'row', gap: SPACING.sm },
  tab: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.base,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.light,
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.muted },
  tabLabelActive: { color: COLORS.white },
  list: { padding: SPACING.base, gap: SPACING.md },
  empty: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING['2xl'] },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  emptyDesc: { fontSize: FONTS.sizes.base, color: COLORS.muted, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.base,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.light,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark, flex: 1, marginRight: SPACING.sm },
  photographerName: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  address: { fontSize: FONTS.sizes.sm, color: COLORS.muted, flex: 1 },
  price: { fontSize: FONTS.sizes.md, fontWeight: '800', color: COLORS.primary },
  date: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
});
