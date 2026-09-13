# WEB-FLARE S8B Prototype Login Retirement

## Current prototype truth

`Buddy / Test` is a hard-coded browser-side demo gate. It is not an account, session, credential store or persisted user identity.

## Retirement rule

Once real S8B registration/authentication is accepted, the production Builder entry must no longer depend on `Buddy / Test`.

## Migration behavior

- Do not migrate `Buddy / Test` into the real account store.
- Do not create a real user automatically from the demo credential.
- Do not treat previous `from=Buddy` links as proof of identity.
- Existing historical prototype links remain display-name-only artifacts.

## Builder entry after S8B

Expected states:

- unauthenticated visitor: `SIGN IN` / `CREATE ACCOUNT` plus any allowed guest preview path;
- authenticated player: player profile and Builder entry;
- receiver converting after a run: registration path retains the current claim context until account creation completes.

## Test-only access

If a test account is required, create it through the real auth provider's supported test/staging mechanism. Do not reintroduce a hard-coded password in public JavaScript.

## Acceptance proof

Search deployed S8B public source for prototype credential constants. Production S8B acceptance fails if public runtime still contains a usable `Buddy / Test` bypass.
