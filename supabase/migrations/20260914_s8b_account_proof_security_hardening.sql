-- S8B staging proof security hardening.
alter function public.touch_player_profile_updated_at() set search_path = public;

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.handle_new_auth_user() from anon;
revoke all on function public.handle_new_auth_user() from authenticated;

revoke all on function public.claim_proof_builder_reward(uuid, text) from public;
revoke all on function public.claim_proof_builder_reward(uuid, text) from anon;
grant execute on function public.claim_proof_builder_reward(uuid, text) to authenticated;
