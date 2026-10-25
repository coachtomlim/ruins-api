# RUINS 010B2 — C3 offline policy preflight (not a database client)

**Authority:** read-only preparation only. `C3_LIVE_EXPORT_HOLD`, `011A_HOLD`.

This is a Python-stdlib, no-network/no-subprocess checker of nonsecret catalog metadata and administrative/key-custody readiness. It does **not** connect to Supabase or Google Drive, freeze any service, make an export, test an actual private key, or grant authorization. Passing means only `READY_FOR_SEPARATE_AUTHORIZATION_REVIEW`.

Run locally in the disposable ChatGPT container, not the Owner PC:

```bash
python3 -m unittest -v test_audit.py
python3 audit.py catalog_20261025.json owner_pending.json
```

Expected current result: `C3_PREFLIGHT_HOLD`, process exit `2`, because the Owner has **not** completed Bitwarden and independent offline key recovery, nor has the administrative freeze window been assigned or acknowledged.

The catalog fixture is a **single read-only metadata observation** of shared staging `qpgwqmduqtqidmhbuclw` on 2026-10-25 UTC, not a guarantee of later scope. A fresh observation is mandatory for the actual decision; the checker refuses catalog observations older than one hour and changes to any of the expected 107 tables / seven schema families. Schema drift requires independent adjudication, not permissions broadening or automatic baseline updates.

The plan accepts **only** nonsecret attestations. It rejects extra fields and secret-bearing markers. **Never put age private keys, Bitwarden contents, authenticator codes, recovery codes, DB passwords, tokens or actual user records in these files.** Do not mark a custody check true until the Owner personally confirms success from an independently protected offline copy. An automated boolean by itself cannot prove physical custody or a real freeze: validate the human attestations separately before C3 review.

Always obtain a **separate explicit Owner authorization** for a specific one-time live cloud export. Do not interpret a positive preflight as that authorization, and never proceed to `011A` under this gate.

Source basis: Dev4 A/B preparation commit `895dcc8e6b29cbeb01c68e6c08a3e4f76972ff9a`, Work5 C2.5R accepted source `6050dc5efff780f92ac2e0ac18cd77775956fe0e` and Bitwarden Free custody manual `5f7af761dfa68c6c13b0d7d46b2c60f96e72443c`.
