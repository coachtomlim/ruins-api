# WEB-FLARE S8B Persistent Cloud State Assessment

## Decision

- HOTEL onboarding and the current S8B staging registration: **cloud
  application state is not required**.
- Activating the complete S8B account and progression contracts: **persistent
  cloud application state is required**.

## Basis

Static gameplay, deterministic runs and the current memory-only registration
handoff can continue without a backend. They create no durable cross-device or
multi-user authority.

The planned S8B capabilities cannot safely use browser state as authority:

- managed player identity and sessions;
- persistent challenges and immutable Runner snapshots;
- guest-run claim conversion;
- saved goals and dungeons across devices;
- idempotent Hero and Builder reward settlement;
- append-only Gold ledger and derived balance;
- owned equipment, loadout and permanent progression;
- concurrent purchase/upgrade validation.

Those capabilities require an authoritative transactional service reachable by
the deployed application. The provider remains undecided. Supabase Auth plus
PostgreSQL is one candidate, but no application environment should be
provisioned until the backend decision gate authorizes the proof.

## Boundary

The future application backend must remain outside Gamma Mission Control.
Gamma may retain opaque resource references and operational status, but it must
not store or transact Dungeon Runner player or gameplay records.
