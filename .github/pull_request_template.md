# Summary

## What Changed

-

## Validation

- [ ] `npm test`
- [ ] `npm run validate:openapi`
- [ ] `npm run validate:assets`
- [ ] `npm run lint`

## Canon / Architecture Check

- [ ] This change does not silently resolve canon conflicts.
- [ ] New gameplay behavior cites `docs/canon/` or adds an explicit unresolved question.
- [ ] Deterministic state changes are covered by tests.
- [ ] API changes preserve current documented behavior or include migration notes.

## Agent Roles

- Codex implements repo changes.
- Claude reviews architecture, canon preservation, deterministic guarantees, and logic risks.
