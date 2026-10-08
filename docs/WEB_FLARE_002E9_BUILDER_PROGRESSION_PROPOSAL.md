# 002E9 — Builder progression: current behaviour and a bounded durable-persistence proposal

Status: PROPOSAL ONLY. Nothing here is implemented. 002E9 touched no Supabase object, created no migration, and
shipped no durable Builder Level.

## 1. What 002E9 actually does today

| Concern | Behaviour |
| --- | --- |
| Level authority | The first completed Friend run grants **Builder Level 2 for the current browser session only**. |
| Storage | `sessionStorage` key `s8aBuilderLevel` (`'2'`), read/written only by `public/flare-s8a/builder-level.mjs`. The 002E7/002E8 boolean `s8aCustomizationUnlocked` is still *read* (an in-flight session stays honest after upgrade) and never written again. |
| Same-tab reload | Level 2 survives (verified in the browser: reload → `builderLevel === 2`, editor unlocked, four dungeons, Level 2 monsters listed). |
| New tab / device / session | Starts at Level 1 again. The first completed run there levels up again. No code path claims a *saved* Level 2. |
| Accounts | Creating an account does not carry the level anywhere. The reward journey and its final scene say so: "Builder Level 2 is active for this session only. Create an account to keep progressing." |
| Gold | Builder Gold and Friend/Hero Gold are shown as separate result variables; neither is persisted by this client. The registration screen already states "not saved to an account yet". |

## 2. Proposed durable model (smallest safe slice)

**One row per player, written only by a server function.**

```
builder_progression(
  player_id          uuid primary key references auth.users,
  builder_level      smallint not null default 1 check (builder_level between 1 and 2),
  level2_source_result_id uuid null references builder_challenge_results(result_id),
  level2_granted_at  timestamptz null,
  updated_at         timestamptz not null default now()
)
```

* RLS: a player may `select` only their own row. No browser role may `insert`/`update`/`delete` (same posture as the
  existing progression-authority tables: "browser roles cannot directly mutate progression authority").
* `claim_builder_level_2(p_result_id uuid)` — `security definer`, idempotent:
  1. caller must be authenticated;
  2. the result must exist, have a terminal status, and be a result the caller produced as a Builder (the guest's
     `attempt_token`-correlated receipt, linked to the new account through the existing public-safe
     `s8aFriendGoalClaim` handoff — the same bounded handoff the registration flow already uses);
  3. upsert `builder_level = greatest(builder_level, 2)`; a second call returns the existing row (idempotent).
* Client read: after sign-in, `readBuilderLevel` becomes `max(sessionLevel, accountLevel)`. The reward journey's
  "keep progressing" copy can then switch from "this session only" to a saved confirmation **only after** the server
  acknowledges the claim.

Why this slice: it persists exactly the one fact 002E9 grants (Level 2), reuses the receipt/attempt-token provenance
that already proves a run happened, does not trust a client-asserted level, and leaves Level 3+ and Gold persistence to
later work.

## 3. Related server gap found while building 002E9 (must land before Level 2 runs can reach the Friend)

`submit_builder_challenge_result_v2` validates enemy slots against a fixed list (`goblin`, `skeleton`, `goblin-elite`,
`antlion`) and derives a Hero Gold ceiling and budget from fixed per-monster tables. A run that contains **Zombie** or
**Skeleton Archer** would be rejected (`RESULT_ENCOUNTER_INVALID`). Until the function is extended, the client reports
"Result kept on this device · <name> can't receive Level 2 monster runs yet." instead of attempting a submission it knows
will fail (`public/flare-s8a/receipt-plan.mjs`, `RECEIPT_SERVER_ENEMY_IDS`).

Bounded server change, separate migration, **not** part of 002E9:

* accept `zombie` (cost 35, Hero Gold 11) and `skeleton-archer` (cost 35, Hero Gold 11) in the slot allow-list, cost map
  and Hero Gold map;
* revisit the hard `p_hero_gold > 30` ceiling: Zombie + Zombie + Skeleton is a legal 100-budget encounter worth 31 Gold,
  so either cap the Gold per result at 30 on both sides or raise the ceiling together with the client's
  `boundedInt(heroGold,0,30)` in `result-receipt.mjs`.

The client list `RECEIPT_SERVER_ENEMY_IDS` is the single switch to widen once the migration is live.

## 4. Open decisions for the Owner

1. Is the first-run Level 2 grant claimed by the *account that is created from the Friend result* (recommended), or
   by whoever signs in first on that device?
2. Should Level 2 also be granted retroactively to existing accounts that already built a challenge?
3. Do the receipt-service changes in section 3 ship before or together with the progression table?
