import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrderStore } from '@/store/orderStore';
import type { Order } from '@/types';

/**
 * Subscribe to realtime updates for a single order.
 * Used on the order tracking screen for both client and photographer.
 */
export function useRealtimeOrder(orderId: string | null) {
  const { upsertOrder, setCurrentOrder } = useOrderStore();

  useEffect(() => {
    if (!orderId) return;

    // Initial fetch
    fetchOrder(orderId);

    // Realtime subscription
    const channel = supabase
      .channel(`order:${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload: any) => {
          if (payload.new) {
            upsertOrder(payload.new as Order);
            setCurrentOrder(payload.new as Order);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_photos',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          // Re-fetch full order when photos are delivered
          fetchOrder(orderId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  async function fetchOrder(id: string) {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        client:users!orders_client_id_fkey(*),
        photographer:photographer_profiles!orders_photographer_id_fkey(
          *, user:users(*)
        ),
        service:services(*),
        photos:order_photos(*)
      `)
      .eq('id', id)
      .single();

    if (data) {
      upsertOrder(data as any);
      setCurrentOrder(data as any);
    }
  }
}
