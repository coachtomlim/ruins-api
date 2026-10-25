# RUINS 010B-2 — Owner-key recovery drill and coordinated administrative hold

**Status:** documentation / harmless public challenge only. **C3 live export: HOLD. 011A migration: HOLD.**
**No age identity, public recipient, encrypted live data, staging connection, infrastructure change, or operational freeze is produced by this package.**

## Current authority

- Owner confirmed **Bitwarden Free account has been set up**. This is **not** evidence an age identity is stored, an offline independent copy exists, or decryption has been verified.
- Supabase shared staging `qpgwqmduqtqidmhbuclw`: `ACTIVE_HEALTHY`, PostgreSQL 17.6, seven relevant schemas with **107 / 107 SELECT-accessible tables**, `ruins_private` and `ruins_owner` absent at observation. These are ephemeral catalog observations, not guarantees about future time.
- Last implementation with 31/31 preflight/unit tests is at `5a3f4261360fa2426e730241eff2147b7d22cb77`; no live backup is authorized by those tests.
- Existing governance for cross-project deployment holds: `b9d76b25df1495f046640558ba19b2416b3964c4`; provider check found RUINS repo Git-triggered Vercel deployment disabled, but other routes (manual SQL/admin, SL-SIM deployment, managed functions) may affect schemas. Do not equate a missing workflow directory with no deployment pathways.

## B: Owner private key-custody drill — the exact limited request

1. In a **trusted, Owner-controlled environment** that meets your no-ASUS-C: preference, use only official age software. Privately create one age X25519 key pair (`age-keygen -o key.txt`). The identity file is **secret** and must not be transmitted to ChatGPT, GitHub, G:/Google Drive, Cloud Shell backup runner, or an untrusted browser utility. Avoid unattended sync and shell logging of private material.
2. Store the entire secret identity (including exact `AGE-SECRET-KEY-1...` line) in a **Bitwarden Free Secure Note**. Independently keep **the same identity** as a legible, sealed paper copy in another secure physical location. This is the separate recovery failure domain. Ensure the Bitwarden master-passphrase and two-step recovery code are separately safeguarded; do not put both in the same paper envelope as the age key.
3. Retain **only the public recipient** (usually `age1...`) outside the vault. Obtain it locally by `age-keygen -y key.txt`. The public recipient may be provided to Dev4 later; never share the private identity.
4. Download or transcribe the harmless `recovery_challenge.txt` in this package to a **trusted, non-synced scratch location**. Challenge-ID `80c7192affb024734ac8c672`, size 288 bytes, SHA-256 `328d61d9418ce260eb3e4d088551dfed8975525afeb369638ff62220c87363ba`. It is public, not a user secret.
5. Encrypt that text locally using the **public** recipient: `age -r PUBLIC_RECIPIENT -o challenge.age recovery_challenge.txt`. Keep `challenge.age` available for both recovery tests. Do not publish the unencrypted private identity or use web-based decryptors.
6. **Primary test:** open your Bitwarden Secure Note, privately create a temporary identity file in your trusted local recovery environment, decrypt `challenge.age` with `age -d -i IDENTITY_FILE -o recovered-primary.txt challenge.age`, then compare SHA-256 of recovered output to `328d61d9418ce260eb3e4d088551dfed8975525afeb369638ff62220c87363ba`. You can run `python verify_recovery.py recovered-primary.txt` in the same folder as its manifest. Delete plaintext identity and decrypted scratch files afterwards; close the vault.
7. **Independent offline test:** without accessing Bitwarden, manually reconstruct the **same** identity from the protected offline copy in an **independent trusted recovery context** (not a second Bitwarden export / cached account), decrypt `challenge.age` again into a different file, and independently verify the same expected SHA-256. Re-seal the offline record and clear temporary private identity files. This tests recoverability of the paper record. Do not photograph the key or submit the decrypted output.
8. Privately record the date, two storage-domain labels, recipient fingerprint (public only), and two `HASH_PASS` outcomes. If either fails, leave `C3` on HOLD and re-test from the primary original; **do not generate a second unrelated key** as a supposed backup of the first.

**Attestation to Dev4:** State only `Bitwarden Secure Note: saved and reopened; offline copy: independent; Bitwarden recovery: PASS; offline recovery: PASS; public recipient: ready`. Sharing the public recipient is permitted only when requested for the separate encrypted public-key challenge. No private material is needed.

**Limitations:** This manual drill is Owner-attested, not remotely proven to Dev4. With no Owner public recipient yet, Dev4 has **not** encrypted a challenge to the Owner identity. The plaintext test above can be completed privately without sending the recipient. After private success, Dev4 can additionally encrypt a fresh challenge using only the public recipient if desired.

## A: Future administrative-change hold — announcement template (DRAFT; do not send/activate until coordinated)

**Subject:** Proposed bounded no-DDL/no-role-change interval for shared Dungeon Runner S8B Staging

> A **pre-r2 SQL logical baseline** is planned on shared Supabase project `qpgwqmduqtqidmhbuclw`. No interval is currently scheduled. During the future approved interval, please do not deploy database migrations or change schemas, roles, grants, policies, triggers, extensions, publications, storage schema or job definitions. Normal application reads and writes may continue under the documented MVCC snapshot caveat.
>
> Please identify any automated migration hooks or changes under your control that could run during the proposed period. Do not stop applications, disable Auth/Storage or suspend classroom services based on this notice alone. A specific start/end and responsible operator acknowledgements will be requested separately.

### Hold authority and accountable acknowledgement matrix (all PENDING)

| Operator domain | Known component | Required attestation | Status |
|---|---|---|---|
| Supabase administrator | Staging project, SQL editor, migrations, managed extensions, roles | No uncoordinated DDL/role/grant change; pre-r2 recheck | PENDING |
| RUINS / Friend / Daily Trial | `ruins-api` repo, Quick Dungeon web delivery, Friend/Trial SQL and manual deploy flows | No direct/admin schema change, including manual migrations | PENDING |
| SL-SIM owner/PM | `sl_sim`, hosted-poc, postpilot schemas; `sl-sim-seat-router` active Edge Function | No postpilot/hosted/seat-migration activity during named window | PENDING |
| Deployment operators | Vercel `sl-sim-basic1-postpilot`, hosted-proof, UAT, seat-admission and any Hostinger/HostGator/manual SQL flows | No deployment hook applying DB migrations, permissions or DDL | PENDING |

**NO FREEZE NOW:** Do not send a cross-project stop signal or infer acknowledgements from this document. Before scheduling a real window, consult owner/operators and record the exact UTC/SGT interval, how automatic migrations are prevented, each acknowledgement, abort conditions, and who releases the hold. A no-writer freeze is not necessary for ordinary MVCC row consistency, but global role and sequence state have narrower guarantees.

## Acceptance / status

- `BITWARDEN_ACCOUNT_EXISTS`: **Owner reported yes**.
- `AGE_OWNER_IDENTITY_IN_VAULT`: **Unverified**.
- `OFFLINE_INDEPENDENT_COPY`: **Unverified**.
- `PRIMARY_RECOVERY_PASS`: **Unverified**.
- `OFFLINE_RECOVERY_PASS`: **Unverified**.
- `ALL_ADMIN_ACKNOWLEDGEMENTS`: **Pending**.
- `C3_LIVE_EXPORT`: **HOLD**, requires separate specific Owner authorization after readiness.
- `011A_MIGRATION`: **HOLD**, requires separate recovery+governance gate.

No key generated; public challenge is safe to store in G:/GitHub. No synthetic success is claimed without a test transcript; only the local SHA-256 challenge generation and verification code is tested here.
