# WEB-FLARE S8B Sender Identity Contract

## S8A prototype behavior

The current sender display name may travel separately in a sanitized `from` query parameter. It is display-only and not proof of identity.

## S8B persistent behavior

A persistent challenge should have an authenticated sender owner.

The authoritative sender player ID is stored on the challenge record. The receiver-facing display name should be resolved from the challenge/player profile context, not trusted from an arbitrary `from=` query parameter.

## Compatibility

Legacy S7/S7.1/S8A prototype links may continue to display their sanitized query name while those routes remain frozen. They do not become authenticated challenge records retroactively.

## Reward ownership

Hero-side persistent reward settlement requires a known challenge sender account. Do not credit Hero Gold based only on a display name in a URL.

## Privacy

Public challenge payloads expose only the safe display name needed for gameplay context, not email, auth-provider identifiers or other private profile fields.
