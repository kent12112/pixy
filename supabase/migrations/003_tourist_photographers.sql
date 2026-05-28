-- ============================================================
-- Pixy — Update existing + add tourist-focused photographers
-- Run in Supabase SQL Editor
-- ============================================================

-- Update existing 4 photographers to tourist focus
UPDATE public.photographer_profiles SET
  bio = 'I help tourists and travelers capture NYC like locals never see it. From hidden gems to iconic spots — your vacation memories, perfected.',
  specialties = ARRAY['landmarks','tourist','street','travel'],
  location_name = 'Times Square / Midtown'
WHERE user_id = 'a1000000-0000-0000-0000-000000000001';

UPDATE public.photographer_profiles SET
  bio = 'Warm, cinematic travel photos for tourists who want more than selfies. I know every golden-hour spot in Manhattan.',
  specialties = ARRAY['tourist','portrait','travel','instagram'],
  location_name = 'SoHo / Lower Manhattan'
WHERE user_id = 'a1000000-0000-0000-0000-000000000002';

UPDATE public.photographer_profiles SET
  bio = 'Brooklyn Bridge sunrise shoots are my specialty. Also great for DUMBO, Williamsburg, and waterfront views.',
  specialties = ARRAY['landmarks','brooklyn','tourist','architecture'],
  location_name = 'Brooklyn Bridge / DUMBO'
WHERE user_id = 'a1000000-0000-0000-0000-000000000003';

UPDATE public.photographer_profiles SET
  bio = 'Central Park expert. I know every iconic corner for stunning tourist and couples shots, any season.',
  specialties = ARRAY['tourist','central park','couples','portrait'],
  location_name = 'Central Park'
WHERE user_id = 'a1000000-0000-0000-0000-000000000004';

-- Update services to tourist focus
DELETE FROM public.services WHERE photographer_id IN (
  SELECT id FROM public.photographer_profiles
  WHERE user_id IN (
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004'
  )
);

INSERT INTO public.services (photographer_id, name, description, price, duration_min, deliverables, is_active)
-- Alex Rivera — Times Square
SELECT pp.id, 'NYC Tourist Photo Session', 'Times Square, Empire State area, and iconic Midtown spots. Perfect vacation photos in 1 hour.', 90.00, 60, '25 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000001'
UNION ALL
SELECT pp.id, 'Instagram Tour – Midtown', 'Hit 5+ Instagrammable spots around Midtown in a guided photo walk.', 130.00, 90, '40 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000001'

-- Maya Chen — SoHo
UNION ALL
SELECT pp.id, 'SoHo & Little Italy Walk', 'Cobblestone streets, cast-iron buildings, and hidden alleys — NYC at its most photogenic.', 110.00, 60, '30 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000002'
UNION ALL
SELECT pp.id, 'Golden Hour NYC Portraits', 'Sunset shoot at the most beautiful spots in lower Manhattan. Magical light guaranteed.', 160.00, 75, '35 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000002'

-- James Park — Brooklyn Bridge
UNION ALL
SELECT pp.id, 'Brooklyn Bridge Sunrise Shoot', 'Beat the crowds at dawn for the most iconic NYC photo you''ll ever take.', 95.00, 60, '25 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000003'
UNION ALL
SELECT pp.id, 'DUMBO & Waterfront Tour', 'Manhattan Bridge framing, waterfront views, and the best of Brooklyn in one shoot.', 120.00, 90, '35 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000003'

-- Sofia Martinez — Central Park
UNION ALL
SELECT pp.id, 'Central Park Photo Walk', 'Bethesda Fountain, Bow Bridge, the Ramble — all the iconic spots in one session.', 100.00, 60, '30 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000004'
UNION ALL
SELECT pp.id, 'Couples & Proposal Shoot', 'Romantic Central Park session. Perfect for proposals, anniversaries, or just because.', 180.00, 90, '45 edited photos', true
FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000004';

-- ── Add 6 more tourist-focused photographers ──────────────────

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) VALUES
('a1000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lena@pixy.demo',crypt('DemoPass123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Lena Kim","role":"photographer"}',now(),now()),
('a1000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','marco@pixy.demo',crypt('DemoPass123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Marco Rossi","role":"photographer"}',now(),now()),
('a1000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','priya@pixy.demo',crypt('DemoPass123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Priya Nair","role":"photographer"}',now(),now()),
('a1000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','tom@pixy.demo',crypt('DemoPass123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Tom Walsh","role":"photographer"}',now(),now()),
('a1000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','yuki@pixy.demo',crypt('DemoPass123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Yuki Tanaka","role":"photographer"}',now(),now()),
('a1000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','david@pixy.demo',crypt('DemoPass123!',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"David Osei","role":"photographer"}',now(),now());

INSERT INTO public.photographer_profiles (user_id, bio, location_name, latitude, longitude, base_price, is_available, portfolio_urls, specialties, rating, total_reviews, total_orders, response_time_min)
VALUES
('a1000000-0000-0000-0000-000000000005','Statue of Liberty & Battery Park specialist. I make sure every tourist leaves NYC with a jaw-dropping skyline shot.','Battery Park / Financial District',40.7033,-74.0170,85.00,true,'{}',ARRAY['statue of liberty','skyline','tourist','landmarks'],4.7,29,35,5),
('a1000000-0000-0000-0000-000000000006','The High Line is my home turf. Elevated park, Chelsea galleries, Hudson Yards — modern NYC at its best.','The High Line / Chelsea',40.7480,-74.0048,95.00,true,'{}',ARRAY['high line','tourist','modern','architecture'],4.8,37,44,4),
('a1000000-0000-0000-0000-000000000007','Rockefeller Center, 5th Avenue, St. Patrick''s Cathedral — I cover the heart of Midtown for tourists who want it all.','Rockefeller Center / 5th Ave',40.7587,-73.9787,80.00,true,'{}',ARRAY['rockefeller','tourist','5th avenue','landmarks'],4.6,21,26,6),
('a1000000-0000-0000-0000-000000000008','Williamsburg murals, rooftop views, and Brooklyn vibes. I show tourists the NYC that doesn''t make the guidebooks.','Williamsburg, Brooklyn',40.7081,-73.9571,75.00,true,'{}',ARRAY['brooklyn','murals','tourist','street art'],4.5,18,22,7),
('a1000000-0000-0000-0000-000000000009','One World Trade, 9/11 Memorial, and the Financial District — I capture the emotional heart of lower Manhattan.','World Trade / Financial District',40.7115,-74.0130,90.00,true,'{}',ARRAY['world trade','memorial','tourist','downtown'],4.9,52,60,3),
('a1000000-0000-0000-0000-000000000010','Harlem cultural tours and Upper West Side shoots. Authentic NYC beyond the tourist trail — for curious travelers.','Harlem / Upper West Side',40.8116,-73.9465,70.00,true,'{}',ARRAY['harlem','cultural','tourist','authentic'],4.7,33,39,5);

INSERT INTO public.services (photographer_id, name, description, price, duration_min, deliverables, is_active)
SELECT pp.id, 'Statue of Liberty Skyline Shoot', 'Battery Park waterfront with Lady Liberty and the Manhattan skyline as your backdrop.', 85.00, 45, '20 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000005'
UNION ALL SELECT pp.id, 'Financial District Walking Tour', 'Wall Street bull, Charging Bull, Fearless Girl, and the iconic canyons of lower Manhattan.', 110.00, 75, '30 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000005'

UNION ALL SELECT pp.id, 'High Line Sunset Walk', 'The most photogenic park in NYC — elevated gardens, city views, and incredible light at golden hour.', 95.00, 60, '25 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000006'
UNION ALL SELECT pp.id, 'Hudson Yards & Vessel', 'The futuristic side of NYC — Vessel, the Edge, and Hudson Yards architecture.', 120.00, 60, '28 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000006'

UNION ALL SELECT pp.id, 'Rockefeller & 5th Ave Tour', 'Top of the Rock views, St. Patrick''s Cathedral, and the grandeur of Midtown.', 80.00, 60, '25 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000007'
UNION ALL SELECT pp.id, 'Holiday NYC Package', 'Rockefeller Christmas tree, FAO Schwarz, and festive Midtown — magical at any time of year.', 100.00, 60, '28 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000007'

UNION ALL SELECT pp.id, 'Williamsburg Street Art Tour', 'Brooklyn''s most vibrant murals and street art as your backdrop. Unique and colorful.', 75.00, 60, '25 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000008'
UNION ALL SELECT pp.id, 'Brooklyn Rooftop & Skyline', 'Stunning rooftop views of the Manhattan skyline from Brooklyn. Sunrise or sunset.', 110.00, 60, '25 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000008'

UNION ALL SELECT pp.id, 'World Trade Memorial Session', 'Respectful and beautiful photos at the 9/11 Memorial pools and One World Trade.', 90.00, 45, '20 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000009'
UNION ALL SELECT pp.id, 'Downtown NYC Full Tour', 'WTC, Oculus, Fulton Center, and the Financial District in one comprehensive shoot.', 150.00, 105, '45 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000009'

UNION ALL SELECT pp.id, 'Harlem Culture Walk', 'Apollo Theater, brownstones, and the vibrant street life of Harlem. Authentic NYC.', 70.00, 60, '25 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000010'
UNION ALL SELECT pp.id, 'Upper West Side & Riverside', 'Quiet, tree-lined streets and Riverside Park — the residential beauty tourists rarely see.', 90.00, 60, '28 edited photos', true FROM public.photographer_profiles pp WHERE pp.user_id = 'a1000000-0000-0000-0000-000000000010';
