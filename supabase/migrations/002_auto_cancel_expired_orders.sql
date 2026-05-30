-- ============================================================
-- Auto-cancel pending orders that haven't been accepted within
-- 10 minutes. Two parts:
--   1. A reusable SQL function (callable any time).
--   2. A pg_cron schedule to run it every minute.
--
-- pg_cron requires the Supabase Pro plan or self-hosted Postgres
-- with pg_cron installed. If you're on the free tier, skip the
-- cron section — client-side auto-cancel still handles expiry.
-- ============================================================

-- ── Function ──────────────────────────────────────────────────────────────────

create or replace function public.cancel_expired_orders()
returns void
language sql
security definer
set search_path = public
as $$
  update public.orders
  set    status = 'cancelled'
  where  status = 'pending'
  and    created_at < now() - interval '10 minutes';
$$;

-- ── pg_cron schedule (requires pg_cron extension) ────────────────────────────
-- Enable the extension in the Supabase dashboard:
--   Database → Extensions → search "pg_cron" → enable
--
-- Then uncomment and run the lines below:

-- select cron.schedule(
--   'cancel-expired-orders',   -- job name
--   '* * * * *',               -- every minute
--   $$ select public.cancel_expired_orders(); $$
-- );
