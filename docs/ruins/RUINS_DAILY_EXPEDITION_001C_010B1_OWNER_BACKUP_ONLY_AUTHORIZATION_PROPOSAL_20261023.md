# RUINS 001C / 010B-1 — Owner authorization proposal: backup and disposable local restore ONLY

**Status: NOT AUTHORIZED.** 2026-10-23 SGT. This proposal does not grant permission to read/export live data or execute staging DDL.

**Project:** Supabase **Dungeon Runner S8B Staging** `qpgwqmduqtqidmhbuclw` only. Shared with Friend, Daily Trial and SL-SIM. Organisation is on Free; no managed backup or provider restore checkpoint exists.

## Bounded proposed operation

The Owner explicitly designates a trusted **human** operator, with a second reviewer, to use a protected terminal with functioning Docker/Linux and **verified** Supabase CLI 2.121.0 (or freshly reviewed successor). The human privately enters a credential and performs **one read-only pre-r2 logical export**, **one separate migration-history capture**, and **one disposable local PG 17.6 restore rehearsal**. No model, chat, logs, screenshots or shared vault receives the credential, user records or exported content.

Scope of export: custom role definitions, user schema definitions and data, plus platform-managed Auth and Storage **data rows** as allowed by documented CLI; migration-history separately. Include all actual staging user schemas; do not silently omit SL-SIM variants. Preserve RLS, ACLs, unique keys and Friend/Wallet/Trial invariants. Check each dump's nonzero return code, expected size, SHA-256 and error stream. A restore of an empty file can exit zero; **reject this**.

Store all backups **only in an encrypted non-synced Owner-controlled volume**, no G:/GitHub/chat. Treat Auth password hashes, player/user records and eventual RUINS HMAC keys as confidential. Proposed retention: until 14 days after a separately authorized 011A succeeds, otherwise a fixed Owner-approved deletion date; record disposal metadata. No indefinite retention.

Rehearse restoration to a fresh disposable **local** target only. Compare in-scope object counts, privileges/RLS, per-table row counts and privately computed content hashes; return only booleans/counts/metadata to G:. Do not copy actual row contents or secrets to G:. Declare exclusions: Storage file contents, Vault/root key, managed schema definitions, role passwords, Realtime, Edge deployments/secrets, Auth login/session behaviour and project configuration. If any exclusion materially prevents recovery, return HOLD, not PASS.

## Explicit non-authorizations

**NO** remote write SQL, role creation, migrations/011A, restore into shared staging, billing/Pro upgrade, cloud project creation, Auth settings, Edge deployment, production access, real HMAC key provisioning, or weakening `ruins_private`. Stop on any permission or credential issue; never escalate to `service_role` as a workaround.

This pre-r2 backup will **not** solve the later failure of standard CLI backups after r2. Dev4 must separately approve the owner-scoped S2FIX post-r2 split runbook, with real schema coverage and the omitted grants restored, before 011A is reconsidered.

## Suggested Owner decision (not yet granted)

> I authorize 010B-1 **backup and disposable local restore only** for Supabase staging project `qpgwqmduqtqidmhbuclw`, under a named trusted human operator, encrypted non-synced storage, privately entered credentials, and metadata-only receipts. I understand this may export sensitive Auth hashes and user records and cannot recover every Supabase project component. I **do not authorize 011A**, any staging write/restore, billing change, deployment or production access.

Next: Dev4 adjudicates any real backup/restore receipts and excluded-component risks. Only then present an independently bounded 011A DB-only request.
