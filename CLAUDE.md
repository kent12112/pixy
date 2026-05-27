@AGENTS.md

# Pixy — On-Demand Photography Platform

An Uber-style marketplace for professional photographers. Tourists and travelers can open a map, see nearby photographers, book them instantly, and receive their photos within minutes.

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo SDK 56 + Expo Router v4 |
| Styling | NativeWind (Tailwind for RN) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| State | Zustand |
| Data fetching | TanStack React Query |
| Maps | react-native-maps |
| Payments | Stripe (Phase 2) |

## Project Structure

```
pixy/
├── app/
│   ├── _layout.tsx             # Root layout, AuthGate, QueryClient
│   ├── (auth)/                 # welcome, login, signup
│   ├── (client)/               # map (explore tab), orders, profile
│   ├── (photographer)/         # dashboard, requests, portfolio, earnings
│   ├── photographer/[id].tsx   # Public photographer profile
│   ├── booking/[photographerId].tsx  # Booking flow modal
│   └── order/[id].tsx          # Order tracking + photo delivery
├── components/
│   ├── ui/                     # Button, Input, Avatar, Badge, StarRating
│   ├── map/                    # PhotographerPin (map marker)
│   └── photographer/           # PhotographerCard (card + bottom sheet)
├── hooks/
│   ├── useAuth.ts              # Session bootstrapping + login/register/logout
│   ├── useNearbyPhotographers.ts  # Location + Supabase RPC nearby_photographers()
│   └── useRealtimeOrder.ts     # Supabase realtime subscription for an order
├── store/
│   ├── authStore.ts            # User + session
│   ├── mapStore.ts             # Region, photographers list, selected pin
│   └── orderStore.ts           # Active orders, current order
├── lib/
│   └── supabase.ts             # Supabase client with SecureStore adapter
├── types/
│   ├── index.ts                # Domain types (User, PhotographerProfile, Order…)
│   └── database.ts             # Generated Supabase table types
├── constants/
│   └── index.ts                # COLORS, FONTS, SPACING, etc.
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # Full Postgres schema + RLS + triggers
```

## Getting Started

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL Editor
3. Create storage buckets: `avatars`, `portfolio`, `order-photos` (set `portfolio` and `avatars` to public)

### 2. Configure environment

```bash
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Install & run

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i`/`a` for simulator.

## Key User Flows

### Client flow
1. Open app → Welcome screen → Sign up as client
2. Map shows nearby available photographers with price pins
3. Tap a pin → bottom sheet preview → "View Profile" or "Book Now"
4. Booking modal: select service, set meeting point on map, add notes
5. Order tracking screen: real-time status updates via Supabase realtime
6. Delivered photos appear in the order screen → save to camera roll
7. Leave a star review

### Photographer flow
1. Sign up as photographer
2. Dashboard → toggle availability on/off (appears/disappears on client map)
3. Requests tab: Accept or decline incoming bookings
4. Accept → "Start Shoot" → "Deliver Photos" (upload from camera/gallery)
5. Earnings tab: running total, per-session breakdown

## Database

Key tables: `users`, `photographer_profiles`, `services`, `orders`, `order_photos`, `reviews`, `conversations`, `messages`

Key function: `nearby_photographers(lat, lng, radius_km)` — PostGIS spatial query returning photographers sorted by distance.

All tables have Row Level Security (RLS) enabled.

## Realtime

Order status changes and photo deliveries use Supabase Realtime (`postgres_changes`). The `useRealtimeOrder` hook subscribes to a single order and updates the Zustand store.

## Next Steps / Phase 2

- [ ] Stripe payment integration (hold funds on booking, release on completion)
- [ ] In-app messaging (conversations/messages tables are ready)
- [ ] Push notifications (Expo Push + Supabase Edge Function webhook)
- [ ] Photographer onboarding wizard (set location, add first services)
- [ ] Admin dashboard for disputes/refunds
- [ ] Scheduled bookings (not just instant)
- [ ] Photo editing tools before delivery
