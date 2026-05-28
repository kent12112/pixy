// ─── User & Roles ────────────────────────────────────────────────────────────

export type UserRole = 'client' | 'photographer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
}

// ─── Photographer ─────────────────────────────────────────────────────────────

export interface PhotographerProfile {
  id: string;
  user_id: string;
  bio: string;
  location_name: string;
  latitude: number;
  longitude: number;
  base_price: number;           // USD per hour
  is_available: boolean;
  portfolio_urls: string[];
  specialties: string[];        // e.g. ['portrait', 'street', 'travel']
  rating: number;               // 0–5, computed
  total_reviews: number;
  total_orders: number;
  response_time_min: number;    // avg minutes to accept a booking
  distance_km?: number;         // populated by nearby_photographers RPC
  user?: User;
  services?: Service[];
}

export interface Service {
  id: string;
  photographer_id: string;
  name: string;
  description: string;
  price: number;               // USD
  duration_min: number;        // session length in minutes
  deliverables: string;        // e.g. "10 edited photos"
  is_active: boolean;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'       // client submitted, waiting for photographer
  | 'accepted'      // photographer accepted
  | 'in_progress'   // shoot started
  | 'delivering'    // photographer uploading photos
  | 'completed'     // client received photos
  | 'cancelled';

export interface Order {
  id: string;
  client_id: string;
  photographer_id: string;
  service_id: string;
  status: OrderStatus;
  meet_latitude: number;
  meet_longitude: number;
  meet_address: string;
  notes: string | null;
  scheduled_at: string | null;  // null = instant / on-demand
  total_price: number;
  created_at: string;
  updated_at: string;
  client?: User;
  photographer?: PhotographerProfile;
  service?: Service;
  photos?: OrderPhoto[];
}

export interface OrderPhoto {
  id: string;
  order_id: string;
  url: string;
  thumbnail_url: string;
  delivered_at: string;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  order_id: string;
  client_id: string;
  photographer_id: string;
  rating: number;   // 1–5
  comment: string;
  created_at: string;
  client?: User;
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  order_id: string;
  client_id: string;
  photographer_id: string;
  created_at: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export interface LatLng {
  latitude: number;
  longitude: number;
}
