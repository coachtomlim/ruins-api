# WEB-FLARE S8B Account Proof Reconciliation 001

## Decision

The earlier `work/web-flare-s8b-account-proof-001` Supabase proof work is preserved, but it is no longer an active S8B/HOTEL prerequisite.

## Superseding boundary

Accepted architecture authority:

- repository: `coachtomlim/ruins-api`
- branch: `work/web-flare-s8b-gamma-binding-001`
- head: `2e92639ac77b7ad2be331e456dfe67657e913197`
- Gamma logical project: `DUNGEON-RUNNER-S8B`
- Gamma adapter: `DUNGEON-RUNNER-HOTEL-CONTROL-PLANE-v1`
- Gamma boundary: `CONTROL_PLANE_ONLY`
- application persistence: `UNDECIDED_EXTERNAL_TO_GAMMA`

HOTEL onboarding does not require Dungeon Runner application persistence.

Gamma may coordinate opaque operational/control-plane state only. It must not store or transact Dungeon Runner player identities, gameplay records, challenges, runs, reward settlements, Gold ledger, inventory, equipment, ownership or progression.

## Reconciled artifact status

The following artifacts remain valid as **conditional Supabase-provider proof material**:

- `docs/WEB_FLARE_S8B_SUPABASE_PROOF_PLAN_001.md`
- `supabase/migrations/20260914_s8b_account_proof.sql`

They are not deleted because the underlying security/idempotency design remains potentially useful if Supabase is later selected as the Dungeon Runner application backend.

They are not active because provider selection is currently undecided.

## Explicit prohibitions

Until the Owner intentionally reopens the persistence/backend gate:

- do not create a Dungeon Runner Supabase application project;
- do not create a paid Supabase branch for Dungeon Runner application state;
- do not pause or repurpose Gamma Mission Control, StoryForge Studio or Dreamscape OS for Dungeon Runner application persistence;
- do not apply the preserved migration to Gamma or any other existing Supabase project;
- do not wire S8A live registration to any provider;
- do not treat HOTEL project registration as account/backend activation.

## Future trigger

Persistent cloud state becomes necessary only when S8B intentionally activates capabilities such as:

- managed accounts and cross-device sessions;
- saved goals/dungeons across devices;
- persistent challenges and guest claims;
- Hero/Builder reward settlement;
- append-only Gold ledger;
- equipment ownership/loadouts;
- permanent Runner progression;
- concurrent purchase/upgrade validation.

At that time the Owner selects the application backend. Supabase remains one candidate alongside other transactional managed-auth approaches.

## Reconciliation result

`S8B ACCOUNT PROOF RECONCILIATION: PASS`

The earlier proof artifacts are preserved without provisioning or modifying Supabase infrastructure, and they no longer block HOTEL/S8B planning.
