# WEB-FLARE S8B Runner Hub Email Rate-Limit Decision 001

## Status

The first runtime verification attempt on `work/web-flare-s8b-runner-hub-001` was blocked only at the fresh signup/email-send phase by Supabase Auth default SMTP rate limiting:

- HTTP 429
- code: `over_email_send_rate_limit`
- message: `email rate limit exceeded`

No test account was created and staging application tables remained clean.

## Verified unaffected evidence

The same verification run passed before the external email-send blocker:

- branch/head match
- focused tests: 19/19
- full suite: 324/324
- vendor build
- vendor tracked diff: empty
- frozen verifier
- S8A tree diff: empty
- worktree clean

The accepted earlier S8B Account Foundation Client proof already demonstrated the email-confirmation signup path with confirmation required, including the `CHECK YOUR EMAIL` pending state. The Runner Hub source slice does not change the `register()` confirmation semantics: `signUp()` still returns `CHECK_EMAIL` when Supabase returns no session.

## Provider assessment

Supabase documentation states that the built-in SMTP service is intended for initial exploration/testing, has a very low shared email-send quota, and is best-effort. Raising the built-in email-send quota is not the right product workaround. Supabase recommends custom SMTP for production use.

This blocker is therefore classified as:

`EXTERNAL_TEST_TRANSPORT_LIMIT`

not a Runner Hub source, schema, RLS, session, or product defect.

## Decision

Do not:

- disable email confirmation;
- weaken Auth policy;
- change schema;
- change source code merely to avoid the rate limit;
- configure production SMTP solely to complete this staging proof;
- repeatedly retry signup and consume further email quota.

For this Runner Hub acceptance only:

1. retain the already-accepted signup/email-confirmation evidence from the Account Foundation Client proof;
2. treat the current fresh-signup retry as externally blocked rather than failed;
3. continue the remaining authenticated Runner Hub browser proof using one disposable **administratively created and already-confirmed** staging user, which does not require sending a confirmation email;
4. run the real browser sign-in/session/reload/Runner RPC/tabs/saved-goal/sign-out/isolation/mobile checks against that user;
5. delete the disposable user and all derived rows afterward;
6. keep email confirmation REQUIRED throughout.

Administrative creation is test-fixture setup only. It does not alter or replace the production signup path.

## Acceptance consequence

Runner Hub cannot receive final runtime PASS until the authenticated browser journey completes.

A second successful fresh signup email is not required for this specific Runner Hub slice because that behavior was already proven on the immediately preceding Account Foundation Client and the relevant signup source semantics remain unchanged.

Before production launch, Dungeon Runner still requires a deliberate transactional-auth email delivery decision, normally custom SMTP or another managed email-delivery arrangement, with confirmation remaining enabled.
