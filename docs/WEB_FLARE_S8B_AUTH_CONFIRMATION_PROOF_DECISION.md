# WEB-FLARE S8B Auth Confirmation Proof Decision

Scope: `Dungeon Runner S8B Staging` only.

Project ref: `qpgwqmduqtqidmhbuclw`.

The managed Auth client proof is blocked because hosted Supabase projects require email confirmation by default before a newly signed-up user receives an authenticated session.

For this isolated staging proof only, PM authorizes a temporary configuration change:

1. disable email confirmation requirement;
2. execute the bounded two-account Auth/session/RLS/reward proof;
3. restore email confirmation requirement immediately afterward;
4. verify the setting is restored before PASS.

This is not production Auth policy. Production must keep email confirmation enabled unless a later Owner-approved design explicitly changes it.

No live S8A, HostGator, Vercel, Gamma Mission Control, StoryForge Studio, or production Supabase resource may be changed as part of this proof.
