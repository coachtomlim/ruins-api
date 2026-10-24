# 010B2 live backup Owner authorization proposal
Date: 2026-10-24 SGT. Status: DRAFT FOR REVIEW, NOT READY FOR EXECUTION OR OWNER APPROVAL.
Prerequisite synthetic result: CLOUD_SHELL_SYNTHETIC_PASS; receipt docs/ruins/RUINS_010B2_WORK5_SYNTHETIC_PASS_20261024.md.
No live authorization is requested or inferred by this draft. 011A remains HOLD.

## Proposed bounded scope
One confidential pre-r2 logical export of Supabase staging qpgwqmduqtqidmhbuclw (Dungeon Runner S8B Staging, shared with Friend/Daily Trial/SL-SIM), one encrypted archive upload, retrieval and one isolated disposable restore. Google Cloud Shell ephemeral runner only. Supabase Free unchanged. No staging writes, schema/role/grant creation, migration, Edge deployment, wallet/XP writes, production access, paid services, persistence or scheduler.
Source code authority GitHub coachtomlim/ruins-api; documentation and ciphertext destination canonical CLOUD_FIRST_010B2 folder, with a distinct private LIVE_PRE_R2 subfolder created only under later approved scope.

## Connection and read-only rules
Exact later source: session pooler aws-0-ap-southeast-1.pooler.supabase.com port 5432; database postgres; project-scoped postgres.qpgwqmduqtqidmhbuclw identity, subject to read-only capability audit.
TLS sslmode=verify-full, exact hostname and CA verification. Expected PEM CA SHA-256 700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7; independently reverify against current provider before use.
Owner privately enters existing credential only after authorization; model never receives it. No credential in command arguments, history, Drive, GitHub, browser capture or logs. Minimize and isolate child-process secret lifetime.
First catalog-only transaction must prove project, expected schemas, r2 absence, role, TLS and read-only settings. Abort on mismatch. Apply default_transaction_read_only=on to every source connection; verify server enforcement in the later synthetic contract. Source concurrency must be frozen or a reviewed consistent snapshot must span all capture families; matching row counts alone is insufficient.

## Encryption and key custody
Live capture must use a new Owner-held age recipient public key. Private key remains in an Owner-controlled password manager or hardware/offline secure custody outside Drive/GitHub/chat and outside capture VM. Do not use the synthetic throwaway-key model.
Before requesting approval, demonstrate restoration using an independently recovered key copy in a disposable, private recovery process. Owner privately confirms two independently recoverable custody copies; do not request the private key in chat. Loss of the key means loss of recoverability.
Stream/compress/authenticated-encrypt before durable upload; decrypted restore content confined to disposable isolated target. The synthetic in-memory aggregation is not yet approved for live data size, paging or subprocess handling.
Publish exact version/hash-pinned live command pack and allowlisted uploads before approval. Only ciphertext plus nonsecret manifest/receipt may enter Drive. Record independent out-of-band artifact pin; verify retrieved ciphertext before decrypting.

## Proposed retention, restore target and exclusions
Proposed first-capture retention: retain one accepted encrypted baseline until a newer baseline has passed independent restore and the Owner approves disposal. No automatic deletion. Do not yet authorize a second provider or additional replicas.
Restore target: fresh network-isolated PG17 disposable environment in the approved ephemeral runner for logical validation, not a new paid Supabase project. No exposure of restore port.
A real Supabase project restore remains separately unproven. Explicitly resolve managed Auth/Storage definitions and migration versions, Vault/keys, Storage file bytes, Auth/JWT/provider/session continuity, role passwords, Edge code/secrets, Realtime and provider configuration. Database metadata is not Storage binary backup.

## Mandatory outstanding gates before requesting Owner approval
1. Pin a reviewed live capture/restore command manifest. The synthetic bootstrap-superuser full dump is NOT the live recipe.
2. Validate current pre-r2 stock CLI family exclusions, separately preserve in-scope project migration history, and establish real provider-managed restore dependencies.
3. Prove fail-closed source read-only behavior, complete artifacts, safe error output, memory/storage boundaries and cross-family snapshot consistency using synthetic tests.
4. Complete Owner-independent private-key recovery and custody design; no secrets requested now.
5. Confirm exact private live folder, retention, exclusion disposition and no-new-cost boundaries.
6. Obtain a new explicit Owner authorization naming the project, external cloud processor, ciphertext destination, capture command manifest and restore scope.
If r2 is present or appears during work: STOP. Do not grant postgres access to ruins_private. The historical S2 stock failure and offline S2FIX split capture need a separately audited owner-scoped package. This draft does not authorize post-r2 capture.

## Stop and recovery conditions
Abort on TLS/project/role/schema mismatch, r2 presence, read-only failure, unverified key recovery, missing or zero-size export, command failure, incomplete manifest, unexpected upload file, hash/authentication error, restore/integrity/ACL mismatch, cost prompt, plaintext leakage or unavailable runner. Preserve only sanitized failure evidence and already encrypted artifacts. Remove disposable plaintext/keys/targets. Do not weaken grants or TLS or silently use local-PC/shared-hosting fallback.

## What's next
DB Dev Work5: complete gates 1-5 using fake-only data, then replace this draft with an executable review packet and request the exact new authorization.
Codex: none unless a genuinely inaccessible task emerges; Claude paused.
Owner: no action now. Do not supply credentials or approve live execution on this draft.
010B2 live export HOLD. 011A HOLD.
