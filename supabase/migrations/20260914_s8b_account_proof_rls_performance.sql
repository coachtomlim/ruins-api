-- S8B staging proof RLS/performance hardening.
create index if not exists wallet_ledger_source_award_idx on public.wallet_ledger(source_award_id);

drop policy if exists player_profile_select_own on public.player_profile;
create policy player_profile_select_own
on public.player_profile for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists player_profile_update_own on public.player_profile;
create policy player_profile_update_own
on public.player_profile for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists saved_goal_select_own on public.saved_goal;
create policy saved_goal_select_own
on public.saved_goal for select
to authenticated
using (owner_player_id = (select auth.uid()));

drop policy if exists saved_goal_insert_own on public.saved_goal;
create policy saved_goal_insert_own
on public.saved_goal for insert
to authenticated
with check (owner_player_id = (select auth.uid()));

drop policy if exists saved_goal_update_own on public.saved_goal;
create policy saved_goal_update_own
on public.saved_goal for update
to authenticated
using (owner_player_id = (select auth.uid()))
with check (owner_player_id = (select auth.uid()));

drop policy if exists saved_goal_delete_own on public.saved_goal;
create policy saved_goal_delete_own
on public.saved_goal for delete
to authenticated
using (owner_player_id = (select auth.uid()));

drop policy if exists wallet_ledger_select_own on public.wallet_ledger;
create policy wallet_ledger_select_own
on public.wallet_ledger for select
to authenticated
using (player_id = (select auth.uid()));

drop policy if exists proof_run_award_select_own on public.proof_run_award;
create policy proof_run_award_select_own
on public.proof_run_award for select
to authenticated
using (builder_player_id = (select auth.uid()));

drop policy if exists reward_claim_select_own on public.reward_claim;
create policy reward_claim_select_own
on public.reward_claim for select
to authenticated
using (player_id = (select auth.uid()));
