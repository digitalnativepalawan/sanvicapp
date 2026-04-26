-- Atomically increment a user's pebbles balance to avoid read-modify-write races.
create or replace function increment_pebbles(uid uuid, delta integer)
returns void
language sql
security definer
as $$
  update profiles
  set pebbles_balance = pebbles_balance + delta,
      updated_at = now()
  where user_id = uid;
$$;
