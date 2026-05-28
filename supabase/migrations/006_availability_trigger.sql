-- ============================================================
-- Pixy — Auto-manage photographer availability
--
-- On accepted: immediately set unavailable (they're booked)
-- On completed/cancelled: do NOT auto-restore — app prompts
--   the photographer to choose whether to go back online.
-- ============================================================

create or replace function public.sync_photographer_availability()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if NEW.status = 'accepted' and (OLD.status is null or OLD.status = 'pending') then
    update public.photographer_profiles
    set is_available = false
    where id = NEW.photographer_id;
  end if;

  return NEW;
end;
$$;

drop trigger if exists order_availability_sync on public.orders;

create trigger order_availability_sync
  after insert or update of status on public.orders
  for each row execute function public.sync_photographer_availability();
