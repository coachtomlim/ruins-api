# RUINS 001C / 010B-1 — Dev4 Gate 0.5 004 (2026-10-23)

**Decision: REVISE / LIVE_BACKUP_HOLD.** Owner has authorized 010B-1 backup and disposable restore only, not privileged host changes. 011A migration remains unauthorized.

## Verified

Source branch `work/ruins-001c-010b1-codex-independent-002` at `208b8399409383a4dcf329be8270e8e8a201a101` is published, with parent `257a8f5c6a81ebcfce79726c8ea625a909acc8bd`. The publication blocker is closed. Independently read GitHub source and sanitized Google Drive evidence in https://drive.google.com/drive/folders/1z3TphvTTnbThGpzYNXZ3XulyWFaWSI4S .

Codex synthetic PostgreSQL 17.6 test reports 410/410 objects, 34/34 data objects, 12/12 SL-SIM protection checks, unchanged role/access matrices, and tamper/CA/hostname/ACL negative controls. Dev4 accepts this as **offline-only proof**; no live export, credential or staging connection was executed. Candidate verifier SHA-256: `072d5d41d8b07086a76be3db4b98398794eb7ba27143971d7f8530606b564e`; bundle manifest `04711cf8f1845a5108b33cf567478be983f69244435fde14f2ac559f1c78f585`; CA PEM `700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7`, DER `807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa`. Reverify after any source edit.

## Blocking controls

H1 **C: OS encryption NOT_OBSERVED**. Elevated authority is needed to query BitLocker/Device Encryption status. Active pagefile, hibernation and crash-dump destinations on C: can spill plaintext when not protected by system encryption. No encryption or OS setting changes authorized. If C: and other active spill destinations are not demonstrably encrypted, stop and propose a new owner-approved mitigation or alternate encrypted host.

H2 **E: ciphertext container ACL REVISE**. Inherited `Authenticated Users: Modify` and `Users: ReadAndExecute` create deletion/tampering and copying exposure. Protect only the verified E: *container file*, with original descriptor and rollback, after explicit Owner approval; never change E: root or parent ACL.

H3 **VeraCrypt recovery NOT_PROVEN**. R: mapped to `\\Device\\VeraCryptVolumeR`, serial `04E4F605` and an 8 GiB source container; no second offline copy or external/embedded-header trial exists. Design independent offline encrypted physical destination (~20 GiB free for two 8 GiB disposable trials), clean dismount, hash-verified copy, separate protected external-header backup and disposable-only recovery checks. No container/header action or password prompt permitted without Owner scope approval. Source path should not be copied to GitHub or evidence.

H4 **Supabase host/CA CONDITIONAL**. Client enforces `sslmode=verify-full` with candidate pinned CA. Obtain exact nonsecret **session pooler** host and project CA from signed-in staging Connect UI, independently compare to pins, and record host only after verifying project `qpgwqmduqtqidmhbuclw`. Never guess based on region or probe DB port.

**Conclusion:** source + synthetic security accepted; Gate 0.5 not accepted. Codex sole developer; Claude paused. Live backup and 011A HOLD. Immediate 004 work: only read-only host/endpoint evidence and owner approval proposal, not elevation or mutations.
