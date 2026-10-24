# C2.5R checkpoint 03, 2026-10-24 SGT

Fresh administrative PG17.6 restore PASSED against the actual independently retrieved artifact after capture VM replacement and removal of synthetic primary key copy A. Original artifact 7fe9463f6451d6139308bbf47f5cf580170d562c61a709f34b080a6768c04734; encrypted relay a1d0c34e816b0f879915b2fb6b9d9f72f58660db6a6269d6368cea8e66a030ac. Source inventory pin 42cc3e7f91d74a260b16966d7338d0200f6f52bc7f1acf1e7c18de57f244cda8.

32 tables / 35 fake rows; 13 inventory categories; sequences, project migration history and 19 effective checks passed. Five negative restore cases passed: wrong key, authenticated corruption, effective ACL drift, role drift, incomplete history. Recovery context separately passed wrong-key/wrong-recipient/corruption tests.

Final successful restore runner pin dba3c17853c990ccf332b5f61437e81963a99c98. Important corrections: image-cache preflight; input-less subprocess /dev/null to prevent unattended SIGTTIN suspension; targeted metadata drift checks; pinned-source validation and exact disposable reconstruction of public schema's original initdb PUBLIC USAGE baseline. The earlier suspicion of ordering alone was rejected by semantic verification. No source/shared grant changed. Fault receipts are retained rather than overwritten as successes.

Final-source snapshot/producer regression underway. Work journal still awaits independently transferred restore receipt, so it has not prematurely declared PASS. Maintenance and durable Owner key custody remain separate future decisions. No real connection/export/credential request/staging write/011A/local-PC operation/billing/production action or executor delegation.
