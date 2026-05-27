import { create } from 'zustand';
import type { Order } from '@/types';

interface OrderState {
  activeOrders: Order[];
  currentOrder: Order | null;
  setActiveOrders: (orders: Order[]) => void;
  upsertOrder: (order: Order) => void;
  setCurrentOrder: (order: Order | null) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  activeOrders: [],
  currentOrder: null,
  setActiveOrders: (activeOrders) => set({ activeOrders }),
  upsertOrder: (order) => {
    const existing = get().activeOrders;
    const idx = existing.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      const updated = [...existing];
      updated[idx] = order;
      set({ activeOrders: updated });
    } else {
      set({ activeOrders: [order, ...existing] });
    }
  },
  setCurrentOrder: (currentOrder) => set({ currentOrder }),
}));
