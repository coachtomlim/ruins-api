# C2.5 checkpoint 01
Date: 2026-10-24 SGT
Status: IMPLEMENTING, not accepted and not live authorized.
Contract read in full at 61c5d8f01a56e965df97643dc3322ec821309ebc. Accepted source d0d534a592dd5a3395f7dfee830d710e812e2a45 preserved as branch base.
Cloud Shell opened with EPHEMERAL banner; Cloud API credential prompts rejected. Fresh VM has no cached PostgreSQL image or age. Official pinned PG17.6 image pull and signed apt age installation started. No real endpoint or credentials supplied.
Implementation direction: managed-like nonsuperuser postgres, four application schemas plus Auth/Storage synthetic rows and migration history. Common exported snapshot for pg_dump members. Global roles and sequences additionally require an explicitly approved no-writer/no-DDL/no-role-change window; locks and drift checks are defense in depth, not a substitute for that authorization. Concurrent-write, DDL drift, interrupted producer and lost response must prevent COMPLETE publication.
Independent synthetic key custody and deliberate capture-environment destruction remain pending. No live proposal may be submitted until every C2.5 acceptance item is demonstrated.
