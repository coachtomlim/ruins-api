# RUINS 010B-1: Codex Independent Implementation and Ownership

**Date:** 2026-10-23 SGT. **PM:** Dungeon Bravo Dev4. **Status:** OFFLINE_IMPLEMENTATION_APPROVED / GATE_0_5_LIVE_EXPORT_HOLD.

**Owner direction:** Codex must independently own and be able to develop, repair, test, maintain and ultimately supervise this workflow without relying on Claude. Claude is paused; **one executor only**.

**Source:** `coachtomlim/ruins-api` accepted base `3b2bd1a98ecaadf78f28a8824bd742cc42482eca`. Claude's *unapproved-for-live* baseline is in:
`G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\STAGING_READINESS_010\RECOVERY_010B\BACKUP_010B1\CLAUDE_REVIEW_PACKET\`.
Manifest: `BACKUP_010B1\CLAUDE_REVIEW_PACKET_MANIFEST.sha256`.
Review packet: https://drive.google.com/file/d/18BIswToBORWKH48qOsLvjkV5QBo2f4wJ/view .

## Deliverable: Independent, reproducible backup/restore capability

1. **Own the code, not only audit it.** In a new isolated *non-synced* worktree, ingest packet+manifest, examine all F0–F7 SQL/CLI/PowerShell, build independently maintainable **non-secret** scripts/tests, fix defects and commit only to your isolated branch. Keep GitHub source authoritative and G: sanitized evidence. Never modify Claude's original packet or Owner's C: checkout, BAT or audit folder.
2. **VeraCrypt R: and E: assessment.** Independently prove the mounted R: really maps to `\Device\VeraCryptVolumeR`, the source is an Owner-controlled 8 GB VeraCrypt container on local non-synced E: with verified tool binaries, and no dump, PGDATA, temp, stderr, hash, swap/cache or output is unintentionally staged on unencrypted/synced paths. Check capacity, mount/unmount, header/rescue risks, locked/open file behavior, access rights, credential and passphrase privacy, 1.26.29 provenance, Windows crash/pagefile caveats. Do not inspect passphrases, mount/dismount without approval, change VeraCrypt settings or create a header backup without separate Owner action.
3. **Fix mandatory blockers.**
   - Current live PowerShell uses `PGSSLMODE=require` — design and test **server identity verification** using Supabase's documented `sslmode=verify-full`, a trustworthy root CA and matching hostname, without live credentials. Never downgrade quietly: https://supabase.com/docs/guides/database/psql .
   - Build enforceable **pre-execution trust** for the entire script/SQL/family/tool bundle. A manifest alongside modifiable scripts alone is not a sufficient trust root; require an independently verified pin/signature and tamper negative controls. No silent source substitution.
   - Restore `CaptureDir` must be canonical path contained in verified encrypted R:, reject links/junctions, wrong project, unverified receipts, incomplete/missing or tampered dumps. Fail closed on any command failure, empty output or error; independently test corrupt policy/row/SQL/dump and dismounted or substituted R:.
   - Review plaintext `PGPASSWORD` environment inherited by pg tools, PowerShell transcripts/history, logs, dumps and child-process memory. The Owner supplies the real credential in a **fresh private masked terminal only after PM gate acceptance**, never in chat, tools, G: or process command arguments. Use fail-closed read-only remote command mode wherever compatible.
4. **Reproduce independently.** Fresh synthetic PostgreSQL 17.6 source+target entirely on R:, F0–F7 schema and Auth/Storage data, roles and migration history, private row digest/ACL/RLS, protected SL-SIM tables, retry/abort failure handling and disposable restore. Prove 220/220 or suitably grounded counts, zero unexplained object/privilege differences and all in-scope row digests, plus mutation tests. Do not depend on Claude's test PASS; generate new Codex evidence. Preserve explicit omissions: actual Storage binaries, Vault, provider configuration, role passwords, Edge secrets, real Auth continuity.
5. **Operator-ready result.** Provide a sanitized procedure and exact SHA-256 of *new* candidate scripts/commands and trusted verification method, maintainable by Codex alone. Metadata-only evidence to `G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\STAGING_READINESS_010\RECOVERY_010B\BACKUP_010B1\CODEX_INDEPENDENT_001\`. No raw dumps, secrets, tokens, connection URLs or row contents to G:, Github, chat or screenshots.

## Authority boundaries

Owner authorization `010B-1` permits **one read-only pre-r2 logical export of Supabase staging project `qpgwqmduqtqidmhbuclw`**, protected encrypted offline storage and one disposable local restore, with human-private credential entry; **it does not authorize migration 011A**. **Currently Gate 0.5 HOLD:** Codex may implement/repair and run synthetic/local tests, but MUST NOT start credential prompt, connect to staging for live F0/F6/F7/dumps, or trigger a real backup until Dev4 reviews the new exact candidate and explicitly issues `GATE_0_5: APPROVE`. Do not change billing, create roles/keys, execute staging writes, deploy, touch Friend/SL-SIM or production. Claude must not work concurrently.

## Required return

`RUINS_001C_010B1_CODEX_INDEPENDENT: PASS_READY_FOR_DEV4_GATE_0_5 | REVISE | BLOCKED`. Include independent VeraCrypt risks/mitigations, branch and HEAD, diff, exact source/manifests/hashes, negative tests, synthetic restore totals, command families, environment/certificate constraints, residual risks and G: evidence. Dev4 adjudicates Gate 0.5; no implicit live approval.
