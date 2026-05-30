import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';
import { COLORS, SPACING, FONTS, BORDER_RADIUS, ORDER_STATUS_LABEL } from '@/constants';

export default function RequestsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const [photographerId, setPhotographerId] = useState<string | null>(null);

  const activeStatuses = ['pending', 'accepted', 'in_progress', 'delivering'];
  const pastStatuses   = ['completed', 'cancelled'];

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: profile } = await supabase
      .from('photographer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) { setLoading(false); return; }
    setPhotographerId(profile.id);

    const { data } = await supabase
      .from('orders')
      .select('*, service:services(*), client:users!orders_client_id_fkey(*)')
      .eq('photographer_id', profile.id)
      .in('status', tab === 'active' ? activeStatuses : pastStatuses)
      .order('created_at', { ascending: false });

    setOrders((data as any) ?? []);
    setLoading(false);
  }, [user?.id, tab]);

  useFocusEffect(useCallback(() => { loadOrders(); }, [loadOrders]));

  // Realtime: move orders between tabs instantly when status changes
  useEffect(() => {
    if (!photographerId) return;
    const channel = supabase
      .channel('photographer-orders-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `photographer_id=eq.${photographerId}`,
      }, () => loadOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [photographerId, loadOrders]);

  async function updateStatus(orderId: string, status: Order['status']) {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
  }

  async function acceptOrder(order: Order) {
    await updateStatus(order.id, 'accepted');
  }

  async function declineOrder(order: Order) {
    Alert.alert(
      'Decline booking?',
      'The client will be notified and the order will be cancelled.',
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => updateStatus(order.id, 'cancelled') },
      ]
    );
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Booking Requests</Text>
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
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyWrap : styles.list}
        refreshing={loading}
        onRefresh={loadOrders}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{tab === 'active' ? '📬' : '🗂️'}</Text>
            <Text style={styles.emptyTitle}>{tab === 'active' ? 'No active requests' : 'No past orders'}</Text>
            <Text style={styles.emptyDesc}>
              {tab === 'active'
                ? 'New booking requests will appear here. Make sure you\'re available on the map!'
                : 'Completed and cancelled orders will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{(item as any).client?.full_name ?? 'Client'}</Text>
                <Text style={styles.serviceName}>{(item as any).service?.name ?? 'Session'}</Text>
              </View>
              <Badge
                label={ORDER_STATUS_LABEL[item.status]}
                color={item.status === 'pending' ? 'warning' : item.status === 'cancelled' ? 'error' : 'success'}
              />
            </View>

            <Text style={styles.address}>📍 {item.meet_address}</Text>
            {item.notes && <Text style={styles.notes}>💬 "{item.notes}"</Text>}

            <View style={styles.priceRow}>
              <Text style={styles.duration}>⏱ {(item as any).service?.duration_min} min</Text>
              <Text style={styles.price}>${item.total_price}</Text>
            </View>

            <Text style={styles.time}>
              {new Date(item.created_at).toLocaleString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </Text>

            {item.status === 'pending' && (
              <View style={styles.actions}>
                <Button label="Decline" variant="outline" size="sm" onPress={() => declineOrder(item)} style={{ flex: 1 }} />
                <Button label="Accept ✓" variant="primary" size="sm" onPress={() => acceptOrder(item)} style={{ flex: 1 }} />
              </View>
            )}

            {item.status === 'accepted' && (
              <View style={styles.actions}>
                <Button
                  label="Start Shoot 📷"
                  variant="secondary"
                  size="sm"
                  onPress={() => updateStatus(item.id, 'in_progress')}
                  style={{ flex: 1 }}
                />
              </View>
            )}

            {item.status === 'in_progress' && (
              <View style={styles.actions}>
                <Button
                  label="Deliver Photos 📤"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push(`/order/${item.id}`)}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: SPACING.base, paddingTop: SPACING.lg, paddingBottom: SPACING.md, gap: SPACING.md },
  title: { fontSize: FONTS.sizes['2xl'], fontWeight: '800', color: COLORS.dark },
  tabs: { flexDirection: 'row', gap: SPACING.sm },
  tab: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.base, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.light },
  tabActive: { backgroundColor: COLORS.primary },
  tabLabel: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.muted },
  tabLabelActive: { color: COLORS.white },
  list: { padding: SPACING.base, gap: SPACING.md },
  emptyWrap: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING['2xl'] },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.dark },
  emptyDesc: { fontSize: FONTS.sizes.base, color: COLORS.muted, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: COLORS.light, borderRadius: BORDER_RADIUS.xl, padding: SPACING.base, gap: SPACING.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  clientName: { fontSize: FONTS.sizes.base, fontWeight: '700', color: COLORS.dark },
  serviceName: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  address: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  notes: { fontSize: FONTS.sizes.sm, color: COLORS.dark, fontStyle: 'italic' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  duration: { fontSize: FONTS.sizes.sm, color: COLORS.muted },
  price: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.primary },
  time: { fontSize: FONTS.sizes.xs, color: COLORS.muted },
  actions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
});
