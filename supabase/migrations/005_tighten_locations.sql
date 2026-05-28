-- ============================================================
-- Pixy — Move all photographers within 1.5km of Times Square
-- so they appear within the 10-minute arrival radius
-- ============================================================

UPDATE public.photographer_profiles SET latitude = 40.7580, longitude = -73.9855 WHERE user_id = 'a1000000-0000-0000-0000-000000000001'; -- Alex  ~0 km (Times Square)
UPDATE public.photographer_profiles SET latitude = 40.7528, longitude = -73.9772 WHERE user_id = 'a1000000-0000-0000-0000-000000000002'; -- Maya  ~0.8 km
UPDATE public.photographer_profiles SET latitude = 40.7614, longitude = -73.9776 WHERE user_id = 'a1000000-0000-0000-0000-000000000003'; -- James ~0.9 km
UPDATE public.photographer_profiles SET latitude = 40.7648, longitude = -73.9808 WHERE user_id = 'a1000000-0000-0000-0000-000000000004'; -- Sofia ~1.0 km
UPDATE public.photographer_profiles SET latitude = 40.7505, longitude = -73.9934 WHERE user_id = 'a1000000-0000-0000-0000-000000000005'; -- Lena  ~1.2 km
UPDATE public.photographer_profiles SET latitude = 40.7558, longitude = -73.9990 WHERE user_id = 'a1000000-0000-0000-0000-000000000006'; -- Marco ~1.3 km
UPDATE public.photographer_profiles SET latitude = 40.7587, longitude = -73.9787 WHERE user_id = 'a1000000-0000-0000-0000-000000000007'; -- Priya ~0.6 km
UPDATE public.photographer_profiles SET latitude = 40.7620, longitude = -73.9850 WHERE user_id = 'a1000000-0000-0000-0000-000000000008'; -- Tom   ~0.4 km
UPDATE public.photographer_profiles SET latitude = 40.7495, longitude = -73.9862 WHERE user_id = 'a1000000-0000-0000-0000-000000000009'; -- Yuki  ~0.9 km
UPDATE public.photographer_profiles SET latitude = 40.7545, longitude = -73.9910 WHERE user_id = 'a1000000-0000-0000-0000-000000000010'; -- David ~0.9 km
