-- ============================================================
-- Pixy — Add avatar & portfolio photos to all photographers
-- Uses pravatar.cc for faces, picsum.photos for portfolios
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Avatars (faces) ──────────────────────────────────────────

UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=11' WHERE id = 'a1000000-0000-0000-0000-000000000001'; -- Alex Rivera
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=5'  WHERE id = 'a1000000-0000-0000-0000-000000000002'; -- Maya Chen
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=15' WHERE id = 'a1000000-0000-0000-0000-000000000003'; -- James Park
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=45' WHERE id = 'a1000000-0000-0000-0000-000000000004'; -- Sofia Martinez
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=20' WHERE id = 'a1000000-0000-0000-0000-000000000005'; -- Lena Kim
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=32' WHERE id = 'a1000000-0000-0000-0000-000000000006'; -- Marco Rossi
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=55' WHERE id = 'a1000000-0000-0000-0000-000000000007'; -- Priya Nair
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=8'  WHERE id = 'a1000000-0000-0000-0000-000000000008'; -- Tom Walsh
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=62' WHERE id = 'a1000000-0000-0000-0000-000000000009'; -- Yuki Tanaka
UPDATE public.users SET avatar_url = 'https://i.pravatar.cc/150?img=18' WHERE id = 'a1000000-0000-0000-0000-000000000010'; -- David Osei

-- ── Portfolio photos ─────────────────────────────────────────
-- Using picsum.photos with named seeds for deterministic images

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/alex-nyc1/600/400',
  'https://picsum.photos/seed/alex-nyc2/600/400',
  'https://picsum.photos/seed/alex-nyc3/600/400',
  'https://picsum.photos/seed/alex-nyc4/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000001';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/maya-portrait1/600/400',
  'https://picsum.photos/seed/maya-portrait2/600/400',
  'https://picsum.photos/seed/maya-soho1/600/400',
  'https://picsum.photos/seed/maya-soho2/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000002';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/james-bridge1/600/400',
  'https://picsum.photos/seed/james-bridge2/600/400',
  'https://picsum.photos/seed/james-dumbo1/600/400',
  'https://picsum.photos/seed/james-bklyn1/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000003';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/sofia-park1/600/400',
  'https://picsum.photos/seed/sofia-park2/600/400',
  'https://picsum.photos/seed/sofia-couple1/600/400',
  'https://picsum.photos/seed/sofia-sunset1/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000004';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/lena-liberty1/600/400',
  'https://picsum.photos/seed/lena-battery1/600/400',
  'https://picsum.photos/seed/lena-skyline1/600/400',
  'https://picsum.photos/seed/lena-water1/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000005';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/marco-highline1/600/400',
  'https://picsum.photos/seed/marco-highline2/600/400',
  'https://picsum.photos/seed/marco-vessel1/600/400',
  'https://picsum.photos/seed/marco-chelsea1/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000006';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/priya-rockefeller1/600/400',
  'https://picsum.photos/seed/priya-5thave1/600/400',
  'https://picsum.photos/seed/priya-midtown1/600/400',
  'https://picsum.photos/seed/priya-stpats1/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000007';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/tom-williamsburg1/600/400',
  'https://picsum.photos/seed/tom-mural1/600/400',
  'https://picsum.photos/seed/tom-rooftop1/600/400',
  'https://picsum.photos/seed/tom-bklyn2/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000008';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/yuki-wtc1/600/400',
  'https://picsum.photos/seed/yuki-oculus1/600/400',
  'https://picsum.photos/seed/yuki-memorial1/600/400',
  'https://picsum.photos/seed/yuki-downtown1/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000009';

UPDATE public.photographer_profiles SET portfolio_urls = ARRAY[
  'https://picsum.photos/seed/david-harlem1/600/400',
  'https://picsum.photos/seed/david-apollo1/600/400',
  'https://picsum.photos/seed/david-riverside1/600/400',
  'https://picsum.photos/seed/david-uws1/600/400'
] WHERE user_id = 'a1000000-0000-0000-0000-000000000010';
