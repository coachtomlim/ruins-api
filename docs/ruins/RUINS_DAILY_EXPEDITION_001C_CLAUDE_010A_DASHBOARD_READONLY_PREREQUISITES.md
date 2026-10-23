# RUINS 001C — Claude 010A: Read-only Staging Dashboard Prerequisites

**Owner of review:** Dungeon Bravo Dev4 PM. **Executor:** Claude Code on ASUS, sole UI executor. **Scope:** OBSERVE-ONLY, no staging operations. **Date:** 2026-10-23 SGT.  
**Source:** `coachtomlim/ruins-api`, `work/ruins-001c-staging-readiness-010-dev4`, reviewed SHA `10d02a549408fd0a0197e008860c48b1be66441b`. **Staging Supabase ref:** `qpgwqmduqtqidmhbuclw` (Dungeon Runner S8B Staging). **No source edit.**

## Target results

Resolve only two gaps in the verified Dev4 010 read-only report:

1. **Data API exposure:** using the already-authorized signed-in Supabase *staging project* dashboard, read `Integrations / Data API / settings` (actual menu wording may differ), record whether enabled, exact exposed schema names, the automatic table exposure setting, and a fresh observation timestamp. `ruins_private` must not be listed. Do not edit settings; no refresh on another project; no test REST queries that read data.
2. **Backup/recovery feasibility:** inspect staging project backup configuration through **read-only dashboard UI**: whether automated backups are enabled, available backups/recovery points, retention policy, whether PITR exists, documented restore paths and the project's current plan limitations. **Do not trigger a backup, download a backup, restore, export tables, browse private data or change a plan.** If the UI does not show a provably recoverable backup and a bounded procedure, say `BACKUP_RESTORE_READINESS: NOT_PROVEN` rather than asserting PASS. If a rehearsal would be necessary, propose a separate disposable restoration test with its own authorization, never into the shared project.

## Safety boundary

- Never look at, copy, screenshot or handle database passwords, project API keys, tokens, Auth users, SQL result data, connection strings, Vault secrets or environment secrets.
- Do NOT create/update/delete role, schema, object, migration, Edge Function, Auth setting, backup or restore; do not click any button that performs or schedules such an action. No `CREATE`/`ALTER`/`GRANT`/`REVOKE`/write queries. No production project; no SL-SIM/Friend changes.
- If authentication/verification is needed, stop and return `WAITING_FOR_OWNER_LOGIN`; no credential handling or bypass. If the dashboard is inaccessible, return `NOT_OBSERVED` and explain.
- Run no executor in parallel against source or shared staging. Do not modify owner C: checkout or existing untracked BAT/audit files. Minimize temp data.

## Evidence and handoff

Write a short, sanitized report named `RUINS_DAILY_EXPEDITION_001C_CLAUDE_010A_DASHBOARD_READONLY_RESULT.md` with evidence metadata, project ID, UTC/SGT timestamp, exact exposed schemas and backup/retention findings. Screenshots ONLY of non-secret dashboard settings and backup-state panels, if safe. Save under:

`G:\My Drive\Quick Dungeon\Owner Review\RUINS_DAILY_EXPEDITION_001C\STAGING_READINESS_010\DASHBOARD_READONLY_010A\`

Return `DATA_API_EXPOSURE: PASS|REVISE|NOT_OBSERVED`, `BACKUP_RESTORE_READINESS: PASS|NOT_PROVEN|NOT_OBSERVED`, `SHARED_MUTATIONS: ZERO`, and the G: report path. Do not begin 011A or independently recommend executing r2; return findings to Dev4 PM for adjudication.
