# WEB-FLARE S8B Supabase Proof Checkpoint 001

Status: backend staging proof established. Browser/Auth-session proof remains pending.

## Staging authority

Supabase project: `Dungeon Runner S8B Staging`

Project ref: `qpgwqmduqtqidmhbuclw`

Region: `ap-southeast-1`

Project URL: `https://qpgwqmduqtqidmhbuclw.supabase.co`

This project is staging-only and must not be treated as production authority.

## Applied schema

Applied migrations:

1. `s8b_account_proof`
2. `s8b_account_proof_security_hardening`
3. `s8b_account_proof_rls_performance`

Created proof tables:

- `player_profile`
- `saved_goal`
- `proof_run_award`
- `wallet_ledger`
- `reward_claim`

All public proof tables have RLS enabled.

## Verified behavior

Synthetic staging identities were created directly in the staging database only for backend verification, then fully removed.

Verified:

- auth-user trigger created matching `player_profile` rows;
- authenticated player 1 could see only its own profile and run-award row;
- authenticated player 1 could insert and read its own saved goal;
- cross-player saved-goal insertion was rejected by RLS;
- first builder-reward claim posted one 20-Gold ledger entry;
- retrying the same run award returned the same claim and ledger entry and balance stayed 20;
- player 2 attempting to claim player 1's award failed with `AWARD_NOT_OWNED`;
- all synthetic proof rows were removed after verification; all five proof tables returned to zero rows.

## Advisor status

Security adviser after hardening:

- mutable search-path warning removed;
- anonymous access to SECURITY DEFINER functions removed;
- `handle_new_auth_user` is not executable by browser roles;
- one remaining warning is intentional: authenticated users can execute `claim_proof_builder_reward`, which is the intended RPC boundary. The function validates `auth.uid()`, award ownership and idempotency before ledger mutation.

Performance adviser after hardening:

- missing foreign-key index resolved;
- per-row `auth.uid()` policy warnings resolved using `(select auth.uid())`;
- remaining notices are only unused-index INFO findings expected on a new zero/near-zero-row staging database.

## Boundary still unproven

This checkpoint does **not** yet prove the external managed-Auth browser journey:

`sign up -> session -> authenticated REST/RPC -> sign out`

The current PM environment cannot issue the required external Auth HTTP calls to the new Supabase endpoint. That final provider proof must therefore be run from the local Codex/browser environment using only the project's publishable client key. No service-role key is required or permitted.

## Safety

- No live S8A files changed.
- No HostGator deployment performed.
- Vercel remains untouched.
- StoryForge Studio remains paused only to free the Supabase Free-project slot.
