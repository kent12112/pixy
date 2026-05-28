-- ============================================================
-- Pixy — Reset (run before 001_initial_schema.sql if you need
-- a clean slate; drops everything created by that migration)
-- ============================================================

-- Triggers
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists photographer_location_sync on public.photographer_profiles;
drop trigger if exists orders_updated_at on public.orders;
drop trigger if exists review_rating_update on public.reviews;

-- Functions
drop function if exists public.handle_new_user();
drop function if exists public.sync_photographer_location();
drop function if exists public.update_updated_at();
drop function if exists public.update_photographer_rating();
drop function if exists public.nearby_photographers(float8, float8, float8);

-- Tables (order matters — dependents first)
drop table if exists public.messages cascade;
drop table if exists public.conversations cascade;
drop table if exists public.reviews cascade;
drop table if exists public.order_photos cascade;
drop table if exists public.orders cascade;
drop table if exists public.services cascade;
drop table if exists public.photographer_profiles cascade;
drop table if exists public.users cascade;

-- Types
drop type if exists public.order_status;
drop type if exists public.user_role;
