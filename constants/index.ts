export const COLORS = {
  // Brand
  primary: '#6C63FF',       // violet
  primaryLight: '#A89BFF',
  primaryDark: '#4B44CC',

  // Accent (photography gold)
  accent: '#F5B942',
  accentLight: '#FCD980',
  accentDark: '#C9941A',

  // Neutrals
  black: '#0F0F0F',
  dark: '#1A1A2E',
  mid: '#2D2D44',
  muted: '#6B7280',
  light: '#E5E7EB',
  white: '#FFFFFF',

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Status
  online: '#10B981',
  offline: '#6B7280',
} as const;

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Waiting for photographer',
  accepted: 'Photographer on the way',
  in_progress: 'Shoot in progress',
  delivering: 'Delivering photos',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const SPECIALTIES = [
  'Portrait',
  'Street',
  'Travel',
  'Architecture',
  'Couple',
  'Family',
  'Food',
  'Fashion',
  'Event',
  'Landscape',
] as const;

export const DEFAULT_REGION = {
  latitude: 40.758,
  longitude: -73.9855,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};
