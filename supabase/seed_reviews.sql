-- ============================================================
-- Pixy — Fake Review Seed
-- Run in Supabase SQL Editor (runs as postgres; bypasses RLS).
-- Inserts 5 reviews for EVERY photographer that has a service.
-- Safe to re-run (idempotent via ON CONFLICT DO NOTHING).
-- ============================================================

DO $$
DECLARE
  rec             record;
  v_service_id    uuid;

  -- 5 shared fake clients (fixed UUIDs — created once, reused across photographers)
  v_c1  uuid := 'a0000001-feed-0000-0000-000000000001';
  v_c2  uuid := 'a0000001-feed-0000-0000-000000000002';
  v_c3  uuid := 'a0000001-feed-0000-0000-000000000003';
  v_c4  uuid := 'a0000001-feed-0000-0000-000000000004';
  v_c5  uuid := 'a0000001-feed-0000-0000-000000000005';

  -- Helper to derive a deterministic UUID from two values
  -- so order/review IDs are stable across re-runs
  v_o1  uuid;
  v_o2  uuid;
  v_o3  uuid;
  v_o4  uuid;
  v_o5  uuid;
BEGIN
  -- ── 1. Fake auth users (shared across all photographers) ──────────────────
  INSERT INTO auth.users (id, email, aud, role, created_at, updated_at, email_confirmed_at, raw_user_meta_data)
  VALUES
    (v_c1, 'alice.chen@pixy-seed.test',   'authenticated', 'authenticated', now()-'30d'::interval, now(), now(), '{"full_name":"Alice Chen","role":"client"}'::jsonb),
    (v_c2, 'bob.martinez@pixy-seed.test', 'authenticated', 'authenticated', now()-'25d'::interval, now(), now(), '{"full_name":"Bob Martinez","role":"client"}'::jsonb),
    (v_c3, 'carol.kim@pixy-seed.test',    'authenticated', 'authenticated', now()-'20d'::interval, now(), now(), '{"full_name":"Carol Kim","role":"client"}'::jsonb),
    (v_c4, 'david.liu@pixy-seed.test',    'authenticated', 'authenticated', now()-'15d'::interval, now(), now(), '{"full_name":"David Liu","role":"client"}'::jsonb),
    (v_c5, 'emma.jones@pixy-seed.test',   'authenticated', 'authenticated', now()-'10d'::interval, now(), now(), '{"full_name":"Emma Jones","role":"client"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.users (id, email, full_name, role)
  VALUES
    (v_c1, 'alice.chen@pixy-seed.test',   'Alice Chen',   'client'),
    (v_c2, 'bob.martinez@pixy-seed.test', 'Bob Martinez', 'client'),
    (v_c3, 'carol.kim@pixy-seed.test',    'Carol Kim',    'client'),
    (v_c4, 'david.liu@pixy-seed.test',    'David Liu',    'client'),
    (v_c5, 'emma.jones@pixy-seed.test',   'Emma Jones',   'client')
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Loop over every photographer that has at least one service ──────────
  FOR rec IN
    SELECT DISTINCT ON (pp.id) pp.id AS photographer_id, s.id AS service_id
      FROM public.photographer_profiles pp
      JOIN public.services s ON s.photographer_id = pp.id
     ORDER BY pp.id
  LOOP
    v_service_id := rec.service_id;

    -- Derive deterministic order UUIDs from photographer_id + client slot
    v_o1 := regexp_replace(md5(rec.photographer_id::text || v_c1::text), '(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})', '\1-\2-\3-\4-\5')::uuid;
    v_o2 := regexp_replace(md5(rec.photographer_id::text || v_c2::text), '(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})', '\1-\2-\3-\4-\5')::uuid;
    v_o3 := regexp_replace(md5(rec.photographer_id::text || v_c3::text), '(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})', '\1-\2-\3-\4-\5')::uuid;
    v_o4 := regexp_replace(md5(rec.photographer_id::text || v_c4::text), '(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})', '\1-\2-\3-\4-\5')::uuid;
    v_o5 := regexp_replace(md5(rec.photographer_id::text || v_c5::text), '(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})', '\1-\2-\3-\4-\5')::uuid;

    -- Completed orders
    INSERT INTO public.orders (id, client_id, photographer_id, service_id, status, meet_latitude, meet_longitude, meet_address, total_price, created_at, updated_at)
    VALUES
      (v_o1, v_c1, rec.photographer_id, v_service_id, 'completed', 35.6595, 139.7004, 'Shibuya Crossing, Tokyo',   120, now()-'28d'::interval, now()-'28d'::interval),
      (v_o2, v_c2, rec.photographer_id, v_service_id, 'completed', 35.7148, 139.7967, 'Sensoji Temple, Asakusa',   120, now()-'22d'::interval, now()-'22d'::interval),
      (v_o3, v_c3, rec.photographer_id, v_service_id, 'completed', 35.7122, 139.7741, 'Ueno Park, Tokyo',          120, now()-'16d'::interval, now()-'16d'::interval),
      (v_o4, v_c4, rec.photographer_id, v_service_id, 'completed', 35.6878, 139.6904, 'Shinjuku Gyoen Garden',     120, now()-'11d'::interval, now()-'11d'::interval),
      (v_o5, v_c5, rec.photographer_id, v_service_id, 'completed', 35.6684, 139.6814, 'Yoyogi Park, Harajuku',     120, now()- '5d'::interval, now()- '5d'::interval)
    ON CONFLICT (id) DO NOTHING;

    -- Reviews
    INSERT INTO public.reviews (order_id, client_id, photographer_id, rating, comment, created_at)
    VALUES
      (v_o1, v_c1, rec.photographer_id, 5,
       'Absolutely incredible! Knew exactly the right moment at Shibuya. Photos came back in minutes and already look professional — I booked again the next day.',
       now()-'27d'::interval),
      (v_o2, v_c2, rec.photographer_id, 5,
       'Best decision of my whole trip. Super professional and great with the temple lighting. My friends keep asking who the photographer was.',
       now()-'21d'::interval),
      (v_o3, v_c3, rec.photographer_id, 4,
       'Really solid photos and very punctual. Small mix-up finding each other in Ueno but sorted quickly. Would book again.',
       now()-'15d'::interval),
      (v_o4, v_c4, rec.photographer_id, 5,
       'Worth every yen. The golden-hour shots in Shinjuku Gyoen are now my desktop wallpaper. Photos delivered while I was still walking home.',
       now()-'10d'::interval),
      (v_o5, v_c5, rec.photographer_id, 4,
       'Fun session, great energy. Yoyogi Park gave us so many beautiful backgrounds. Fast delivery and quality was exactly what I needed.',
       now()- '4d'::interval)
    ON CONFLICT (order_id) DO NOTHING;

    RAISE NOTICE 'Seeded reviews for photographer %', rec.photographer_id;
  END LOOP;
END $$;
