-- ============================================================
-- Pixy — Demo Photographer Seed Data (NYC)
-- Run in Supabase SQL Editor
-- ============================================================

-- Create auth users (the handle_new_user trigger auto-creates public.users rows)
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'alex@pixy.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Alex Rivera","role":"photographer"}',
  now(), now()
),
(
  'a1000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'maya@pixy.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Maya Chen","role":"photographer"}',
  now(), now()
),
(
  'a1000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'james@pixy.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"James Park","role":"photographer"}',
  now(), now()
),
(
  'a1000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'sofia@pixy.demo',
  crypt('DemoPass123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sofia Martinez","role":"photographer"}',
  now(), now()
);

-- Create photographer profiles (trigger already created public.users rows above)
INSERT INTO public.photographer_profiles (
  user_id, bio, location_name,
  latitude, longitude,
  base_price, is_available,
  portfolio_urls, specialties,
  rating, total_reviews, total_orders, response_time_min
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'Street and travel photographer with 5 years capturing candid NYC moments. I make every shoot feel natural and spontaneous.',
  'Midtown Manhattan',
  40.7580, -73.9855,
  80.00, true, '{}',
  ARRAY['street','travel','portrait'],
  4.8, 34, 41, 3
),
(
  'a1000000-0000-0000-0000-000000000002',
  'Lifestyle & portrait specialist. Known for warm tones and authentic expressions. Let''s create something beautiful together.',
  'SoHo',
  40.7230, -74.0030,
  120.00, true, '{}',
  ARRAY['lifestyle','portrait','fashion'],
  4.9, 58, 62, 5
),
(
  'a1000000-0000-0000-0000-000000000003',
  'Architecture and urban landscape photographer. I find beauty in the city''s geometry — and great candid shots too.',
  'Brooklyn Heights',
  40.6960, -73.9930,
  70.00, true, '{}',
  ARRAY['architecture','street','landscape'],
  4.6, 22, 28, 8
),
(
  'a1000000-0000-0000-0000-000000000004',
  'Golden hour specialist. Couples, solo, and family shoots. My photos tell your story in the best light — literally.',
  'Central Park',
  40.7850, -73.9680,
  95.00, true, '{}',
  ARRAY['portrait','couples','golden hour'],
  4.7, 41, 47, 4
);

-- Create services for each photographer
INSERT INTO public.services (photographer_id, name, description, price, duration_min, deliverables, is_active)
SELECT pp.id, '30-min Portrait Session', 'Quick but memorable — perfect for solo shots or couples.', 60.00, 30, '15 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000001'
UNION ALL
SELECT pp.id, '1-hour City Walk', 'We explore NYC together and I capture the best moments.', 110.00, 60, '30 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000001'

UNION ALL
SELECT pp.id, '1-hour Lifestyle Session', 'Relaxed, authentic photos in any city setting.', 130.00, 60, '25 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000002'
UNION ALL
SELECT pp.id, 'Fashion & Portfolio Shoot', 'Striking editorial-style shots for your portfolio.', 200.00, 90, '40 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000002'

UNION ALL
SELECT pp.id, 'Architecture Walk', 'NYC through a geometric lens — stunning for Instagram.', 90.00, 60, '20 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000003'
UNION ALL
SELECT pp.id, 'Golden Hour Street Session', 'Best light of the day. Results guaranteed to impress.', 85.00, 45, '20 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000003'

UNION ALL
SELECT pp.id, 'Golden Hour Portrait', 'Iconic Central Park shoot at the magic hour.', 100.00, 45, '20 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000004'
UNION ALL
SELECT pp.id, 'Couples Session', 'Romantic and natural shots for couples in the park.', 140.00, 60, '30 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000004';
