# C2.5R maintenance and key-custody decision proposal

2026-10-24 SGT. Review-only proposal. No C3 authorization request, credentials, real export or service changes are made by this document.

## Maintenance requirement: NEEDS_OWNER_MAINTENANCE_WINDOW_AUTH

The synthetic protocol uses pg_export_snapshot in a repeatable-read read-only keeper and imports that same ID in schema, data and migration-history pg_dump sessions. Ordinary DML remains possible; its later changes do not enter that MVCC data snapshot. Global role export, sequences and later relation changes are not made atomic by this technique. Catalog pre/post comparison cannot detect changes reverted before the second comparison. Tests explicitly demonstrate this ABA gap.

A future capture that promises exact role/sequence/catalog alignment therefore requires a separately authorized, externally governed manual freeze. The backup credential cannot impose it through SHARE locking, and no additional shared database grants are proposed.

### Reviewable future freeze procedure

1. Before scheduling: enumerate and assign an accountable operator for every writer/admin path in all seven in-scope schema families, covering all 107 catalog tables reported by Dev4, not just RUINS. Include Friend/Trial APIs, SL-SIM classroom and pilot clients/services, Auth logins/token refresh/background jobs, Storage operations, SQL editors/admin sessions, migrations, database jobs, integration workers and role administration. This enumeration is a prerequisite, not an assertion that these writers have already been found. Any unknown/unowned writer is NO-GO.
2. Obtain Owner approval for exact UTC/SGT start/end, affected projects/users, downtime impact, responsible operators, abort threshold and resumption plan. Explicitly include Auth/Storage and shared SL-SIM dependencies. Do not infer permission to pause them from database backup approval alone.
3. Each responsible operator stops or drains its writer/DDL/role-change path using its approved service controls. No grants, blanket RLS changes, database privilege escalations or unapproved infrastructure changes are a substitute. Record operator attestations and a common freeze token. If a platform-managed writer cannot be credibly stopped or bounded, abort the exact-global-consistency claim and return for a different scope/authorization.
4. Verify writer sessions/jobs drained and transactions complete using separately authorized observation. Freeze is external governance, not something a read-only connection can prove from a count or session list. Prepare a time-bounded abort/restart watchdog and require operators to report any accidental activity. Any violation invalidates this run, even if a pre/post hash happens to match.
5. While freeze is active: verify pre-r2 and source/tool/recipient pins, take initial role/catalog/sequence inventory, open keeper, export schema/data/history with one snapshot, capture passwordless roles, take final inventory, check all exit codes/member completeness and finish encryption. If keeper dies, command fails/times out, history is incomplete, recipient differs or any freeze violation occurs, do not promote the run. Do not resume a partial capture under a new snapshot using the old run ID.
6. Resume services only through the authorized operator runbook. Releasing the writer freeze can follow verified capture/encryption and source sanity checks if the Owner approved that boundary; Drive/restore validation can continue afterward. The run is not PASS until fresh restore is verified. An approval requiring restore before resumption must budget the longer window explicitly.
7. Preserve receipts for start/end, involved services, freeze token and deviations without credentials or data values. A failed run remains failed; make a new run ID after an approved new freeze, and retain evidence of the failure.

No maintenance window is scheduled or approved now. Source remains pre-r2; any ruins_private/r2 indication is fail-closed and requires future S2FIX owner-split recovery work.

## Owner-managed key custody: NEEDS_OWNER_KEY_CUSTODY_DECISION

Proposed policy for future Owner review:

- The Owner generates an age identity within an existing Owner-controlled custody system. Only the public recipient and its independently verified fingerprint enter the backup pack. Do not send a private identity/password to this thread, GitHub, Drive, logs or Cloud Shell.
- Maintain at least two recoverable private-identity copies with independent failure domains and access controls, for example an existing encrypted Owner-managed vault plus a separately protected offline recovery copy held in another physical location or approved recovery custodian. The actual systems/custodian are Owner decisions. No new paid service or local-device action is authorized by this proposal.
- Before live capture, use a nonsecret challenge encrypted to the pinned recipient and demonstrate recovery from the secondary copy after primary access is unavailable. Save only challenge hashes, public recipient, custody-copy labels and successful validation receipt. Do not expose identity contents.
- Record who can recover, when access is permitted, succession/departure procedures, periodic recovery-test interval and what happens if a copy is unavailable. Both copies on the same host or in the same Drive/account failure domain are insufficient for the intended live design.
- Lost identity: stop capture to that recipient and assess existing archive recoverability using a tested remaining copy. If no usable identity remains, the affected archives are unrecoverable. Never label them recovered merely because ciphertext remains intact.
- Rotation: verify new recipient separately, prove its recovery copy, authorize the change and record which archives use which recipient. Retain old private identities while old archives are retained. New recipient selection does not reencrypt old archives automatically.

The C2.5R rehearsal deliberately uses fake identities in two Work scratch paths outside capture Cloud Shell. Primary A is removed and secondary B performs recovery after capture-VM replacement. These copies share the Work host and are temporary; that is a cryptographic and environment-loss rehearsal, not durable independent Owner custody. No live key was generated, requested or stored.

## Approval order

Dev4 first adjudicates the scoped C2.5R synthetic package. Only after technical acceptance and reviewable maintenance/custody decisions should a separate exact C3 authorization proposal be submitted. No real capture follows merely from C2.5R PASS. Managed Supabase restore, Auth continuity and post-r2 recovery remain separate requirements; 011A remains HOLD.
