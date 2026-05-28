/**
 * Mock Supabase client — used when EXPO_PUBLIC_SUPABASE_URL is not configured.
 * Lets you run and navigate the app without a real Supabase project.
 */

import type { PhotographerProfile } from '@/types';

// ─── Mock seed data ───────────────────────────────────────────────────────────

const MOCK_PHOTOGRAPHERS: PhotographerProfile[] = [
  {
    id: 'p1',
    user_id: 'u1',
    bio: 'Street and travel photographer based in NYC. 5 years capturing candid moments.',
    location_name: 'Midtown, New York',
    latitude: 40.758,
    longitude: -73.9855,
    base_price: 80,
    is_available: true,
    portfolio_urls: [],
    specialties: ['street', 'travel', 'portrait'],
    rating: 4.8,
    total_reviews: 34,
    total_orders: 41,
    response_time_min: 3,
    user: {
      id: 'u1',
      email: 'alex@example.com',
      full_name: 'Alex Rivera',
      avatar_url: null,
      role: 'photographer',
      created_at: '2024-01-10T00:00:00Z',
    },
    services: [
      {
        id: 's1',
        photographer_id: 'p1',
        name: '30-min Portrait Session',
        description: 'Quick but memorable — great for solo shots or couples.',
        price: 60,
        duration_min: 30,
        deliverables: '15 edited photos',
        is_active: true,
      },
      {
        id: 's2',
        photographer_id: 'p1',
        name: '1-hour City Walk',
        description: 'We explore the city together and I capture the best moments.',
        price: 110,
        duration_min: 60,
        deliverables: '30 edited photos',
        is_active: true,
      },
    ],
  },
  {
    id: 'p2',
    user_id: 'u2',
    bio: 'Wedding & lifestyle photographer. I make every shoot feel natural and fun.',
    location_name: 'SoHo, New York',
    latitude: 40.7233,
    longitude: -74.0027,
    base_price: 120,
    is_available: true,
    portfolio_urls: [],
    specialties: ['lifestyle', 'portrait', 'wedding'],
    rating: 4.9,
    total_reviews: 58,
    total_orders: 62,
    response_time_min: 5,
    user: {
      id: 'u2',
      email: 'maya@example.com',
      full_name: 'Maya Chen',
      avatar_url: null,
      role: 'photographer',
      created_at: '2024-02-15T00:00:00Z',
    },
    services: [
      {
        id: 's3',
        photographer_id: 'p2',
        name: '1-hour Lifestyle Session',
        description: 'Relaxed, authentic photos in any city setting.',
        price: 130,
        duration_min: 60,
        deliverables: '25 edited photos',
        is_active: true,
      },
    ],
  },
  {
    id: 'p3',
    user_id: 'u3',
    bio: 'Architecture and urban landscape specialist. Also love candid street shots.',
    location_name: 'Brooklyn, New York',
    latitude: 40.6892,
    longitude: -73.9442,
    base_price: 70,
    is_available: false,
    portfolio_urls: [],
    specialties: ['architecture', 'street', 'landscape'],
    rating: 4.6,
    total_reviews: 22,
    total_orders: 28,
    response_time_min: 8,
    user: {
      id: 'u3',
      email: 'james@example.com',
      full_name: 'James Park',
      avatar_url: null,
      role: 'photographer',
      created_at: '2024-03-01T00:00:00Z',
    },
    services: [
      {
        id: 's4',
        photographer_id: 'p3',
        name: 'Golden Hour Walk',
        description: 'Best light of the day. Stunning results guaranteed.',
        price: 90,
        duration_min: 45,
        deliverables: '20 edited photos',
        is_active: true,
      },
    ],
  },
];

// ─── Chainable query builder ──────────────────────────────────────────────────

function makeBuilder(resolvedData: any): any {
  const promise = Promise.resolve({ data: resolvedData, error: null });
  const builder: any = {
    select: (_cols?: string) => makeBuilder(resolvedData),
    eq:     (_col: string, _val: any) => makeBuilder(
      Array.isArray(resolvedData)
        ? resolvedData.filter((r: any) => r[_col] === _val)
        : resolvedData
    ),
    in:     (_col: string, _vals: any[]) => makeBuilder(
      Array.isArray(resolvedData)
        ? resolvedData.filter((r: any) => _vals.includes(r[_col]))
        : resolvedData
    ),
    single: () => Promise.resolve({
      data: Array.isArray(resolvedData) ? (resolvedData[0] ?? null) : resolvedData,
      error: null,
    }),
    // Make the builder itself thenable so `await supabase.from(...)...` works
    then:  (resolve: any, reject: any) => promise.then(resolve, reject),
    catch: (reject: any) => promise.catch(reject),
  };
  return builder;
}

// ─── Mock client ─────────────────────────────────────────────────────────────

const MOCK_TABLES: Record<string, any[]> = {
  users: [
    ...MOCK_PHOTOGRAPHERS.map((p) => p.user!),
  ],
  photographer_profiles: MOCK_PHOTOGRAPHERS,
  services: MOCK_PHOTOGRAPHERS.flatMap((p) => p.services ?? []),
  orders: [],
  order_photos: [],
  reviews: [],
};

export const mockSupabase = {
  auth: {
    getSession: () =>
      Promise.resolve({ data: { session: null }, error: null }),

    onAuthStateChange: (_event: any, _session: any) => ({
      data: {
        subscription: { unsubscribe: () => {} },
      },
    }),

    signInWithPassword: (_creds: any) =>
      Promise.resolve({ data: {}, error: { message: 'Mock mode: auth disabled.' } }),

    signUp: (_creds: any) =>
      Promise.resolve({ data: {}, error: { message: 'Mock mode: auth disabled.' } }),

    signOut: () => Promise.resolve({ error: null }),
  },

  from: (table: string) => makeBuilder(MOCK_TABLES[table] ?? []),

  rpc: (fn: string, _params?: any) => {
    if (fn === 'nearby_photographers') {
      const available = MOCK_PHOTOGRAPHERS.filter((p) => p.is_available);
      return Promise.resolve({ data: available, error: null });
    }
    return Promise.resolve({ data: [], error: null });
  },

  channel: (_name: string) => ({
    on: () => ({ subscribe: () => {} }),
  }),

  removeChannel: (_channel: any) => Promise.resolve(),
} as any;
