# WEB-FLARE S8B Security Test Matrix

Minimum security acceptance for real accounts and persistence.

| ID | Attempt | Expected result |
| --- | --- | --- |
| SEC-01 | Guest reads `/api/me` | 401 |
| SEC-02 | Player A reads Player B saved goal by ID | deny/not found |
| SEC-03 | Player A reads Player B wallet/ledger | deny |
| SEC-04 | Browser submits larger builder reward than canonical run | ignored/rejected; server reward wins |
| SEC-05 | Same claim retried with same idempotency key | same existing result, no duplicate ledger entry |
| SEC-06 | Same claim retried with new idempotency key after already claimed | no duplicate reward |
| SEC-07 | Consumed claim presented by another player | deny |
| SEC-08 | Expired/revoked claim | no reward mutation |
| SEC-09 | Modified runner/target/room in browser during claim | authoritative claim context unchanged |
| SEC-10 | Normal browser client attempts server-only ledger insert | deny |
| SEC-11 | Signed-out token/session used after logout | protected request denied |
| SEC-12 | Public challenge invite used as reward claim token | deny |
| SEC-13 | Service/admin secret search in public bundle | none present |
| SEC-14 | Prototype Buddy/Test bypass on S8B production route | absent |
| SEC-15 | Unknown mutation outcome followed by retry | reconcile first; no duplicate side effect |

The selected backend must provide evidence for every applicable case before account functionality is called production-ready.
