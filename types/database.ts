// Auto-generated types for Supabase schema.
// Regenerate with: npx supabase gen types typescript --project-id YOUR_ID > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'client' | 'photographer';
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role: 'client' | 'photographer';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      photographer_profiles: {
        Row: {
          id: string;
          user_id: string;
          bio: string;
          location_name: string;
          latitude: number;
          longitude: number;
          base_price: number;
          is_available: boolean;
          portfolio_urls: string[];
          specialties: string[];
          rating: number;
          total_reviews: number;
          total_orders: number;
          response_time_min: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['photographer_profiles']['Row'], 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews' | 'total_orders'> & {
          id?: string;
        };
        Update: Partial<Database['public']['Tables']['photographer_profiles']['Insert']>;
      };
      services: {
        Row: {
          id: string;
          photographer_id: string;
          name: string;
          description: string;
          price: number;
          duration_min: number;
          deliverables: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          client_id: string;
          photographer_id: string;
          service_id: string;
          status: 'pending' | 'accepted' | 'in_progress' | 'delivering' | 'completed' | 'cancelled';
          meet_latitude: number;
          meet_longitude: number;
          meet_address: string;
          notes: string | null;
          scheduled_at: string | null;
          total_price: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_photos: {
        Row: {
          id: string;
          order_id: string;
          url: string;
          thumbnail_url: string;
          delivered_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_photos']['Row'], 'id' | 'delivered_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['order_photos']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          order_id: string;
          client_id: string;
          photographer_id: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['reviews']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      conversations: {
        Row: {
          id: string;
          order_id: string;
          client_id: string;
          photographer_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'> & { id?: string };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };
    };
  };
}
