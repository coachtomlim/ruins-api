# RUINS 010B-2 / C2.5 checkpoint 02

Date: 2026-10-24 SGT. Status: IMPLEMENTED_AND_PARTIALLY_EXECUTED; full acceptance pending.

## Authority and source

Contract: 61c5d8f01a56e965df97643dc3322ec821309ebc.
Accepted C0-C2 source remains d0d534a592dd5a3395f7dfee830d710e812e2a45.
New branch: work/ruins-001c-010b2-c25-prelive-001.
Probe execution source: a1946a29c99a2a3b306344c1b3c7de9b26b8b11f.
Probe SHA-256: 1b209c0358c54057a46c5224c4efc112b56917f58c879a528f4cc852236ae041.
Probe stdout SHA-256: 9148d2c262cf0a2b12f3eb8cbc688c66cf0b88543934cee7bfea3a77589134b3.
Streaming execution source: d1831575bd8a4a708641f7e607fc762fb41f6dd9.
Streaming script SHA-256: 24fae1c16a4d42feb6aa81836860902c5b947fec1ce77e20ab5bbbed44ddf494.

## Actual execution

Fresh ephemeral Cloud Shell; Cloud API credential authorization declined. Official PG17.6 image pinned at postgres@sha256:00bc86618629af00d2937fdc5a5d63db3ff8450acf52f0636ec813c7f4902929. Signed apt age 1.1.1. No new project, billing or Actions.

18-check probe PASS (diagnostic, NOT C2.5 acceptance): nonsuperuser capture; PG17.6; Alice RLS; anon denied; passwordless role export; exported snapshot; concurrent UPDATE and ALTER blocked; nonempty schema/data/history; stable value/catalog inventory; new-relation drift; sequence drift; expired snapshot denied; after-r2 private-schema whole-dump failure; pre-r2 guard; no COMPLETE artifact.

The initial fixture lacked database ownership and role-switch test authority. Both were corrected in the synthetic bootstrap. Capture stayed nonsuperuser. Bootstrap is used for fixture creation and independent SET ROLE authorization tests.

Streaming proof uses separately owned fake auth/storage schemas with explicit baseline read permissions. Managed SHARE lock is denied. This demonstrates that existing-table locks alone cannot supply a live no-writer window. The synthetic stream source has no background writers by construction; that is not proof that live staging can be quiesced.

Actual flow: PG stdout -> gzip -> age, bash pipefail. Producer rc71 negative rejected and partial ciphertext removed. No plaintext dump files. Plaintext exists in database pages, process memory and pipe buffers; no secure-erasure guarantee. Each database uses network=none and tmpfs PGDATA (256MiB); streaming DB has a 384MiB memory cap. Host /dev/shm is 64MiB. Python inventory and ciphertext bundle construction are buffered and this harness is intentionally bounded to tiny fake data, not live-sized workloads.

## Transfer and independent key custody

Ciphertext-only outer gzip/tar: 8,915 bytes; SHA-256 d5e2af458878eca5059f3af766ebf9a1bd02006e84f1c557c5b0b76ab2f4ffb7.
Raw ciphertext-member tar: 20,480 bytes; SHA-256 b04f1e79c350a722d894b9c239829da3a90a119a2cc11a7fd96267dbf7f28d89.
Members: roles.age, schema.age, data.age, history.age, manifest.age. Manifest encrypted/authenticated; contains member hashes, byte sizes and expected inventory. Outer hash separately pinned in this receipt.

Drive object: 1lQLM8CC1X_h93iW4UT0igY6lYGLbBJVc.
Folder: 1Epe8xGSpL4Big-wEKWgywj_iDMoQLnvA, under canonical CLOUD_FIRST_010B2, name C25_PRELIVE_PACK_WORK5_20261024.
Both folder and ciphertext object permissions readback show owner-only, no public/domain grants. Authenticated connector re-download materialized into a DISTINCT Work scratch file and independently passed exact size/SHA-256. No source-file shortcut used.

Private synthetic age key generated in Work cloud scratch using pinned pyrage 1.3.0. Only public recipient entered capture Cloud Shell. Private key never printed, entered code/chat/browser, or uploaded to Drive/GitHub. Original custody-A file deleted; independent custody-B file used to decrypt actual Drive-retrieved ciphertext and authenticate all four members plus manifest in memory. Four custom/managed schema families and history represent seven tables / fourteen fake rows here.
Custody A/B are separate synthetic paths outside the capture VM but share a Work host. This does NOT prove durable independently administered Owner custody or disaster resilience. It is not an approved live-key custody location.

After successful retrieval, Cloud Shell Restart selected, Want clean VM state checked; UI explicitly states a new VM will be provisioned and processes lost. Provisioning is pending at this checkpoint. Full VM destruction and fresh restoration are not yet claimed. Source DB container was already removed by the harness.

## Incomplete gates, no live authority

Still required: fresh-target restoration; actual reconstruction of custom roles from captured output rather than preinstalled baseline; managed-target restore permissions; robust approved no-writer/no-DDL/no-role-change protocol with timeout/lost-response/ABA adversarial coverage; full object inventory; recipient pin/rotation/custody runbook; per-exclusion recovery decisions. Current source is synthetic-only with no endpoint option.

C3 real Supabase connection/export and 011A remain HOLD. No credentials requested, no ASUS drives accessed, no wallet/production operation, no Claude or separate Codex executor.
