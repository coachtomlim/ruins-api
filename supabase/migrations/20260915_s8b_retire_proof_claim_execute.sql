-- Retire browser access to the proof-only reward-claim RPC now that the
-- account foundation proof is accepted. Preserve the function as historical
-- staging evidence, but remove it from the authenticated product surface.

revoke execute on function public.claim_proof_builder_reward(uuid, text) from authenticated;
revoke execute on function public.claim_proof_builder_reward(uuid, text) from anon;
revoke execute on function public.claim_proof_builder_reward(uuid, text) from public;
