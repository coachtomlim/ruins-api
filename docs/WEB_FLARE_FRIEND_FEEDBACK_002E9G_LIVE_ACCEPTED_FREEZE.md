# WEB-FLARE FRIEND_FEEDBACK_002E9G Live Accepted Freeze

Status: **OWNER ACCEPTED / LIVE CLOSED**

This record freezes the accepted Friend Feedback 002E9G release before any subsequent audio, RUINS/Daily Expedition, Quick Run, progression, content, or other gameplay feature work begins.

## 1. Accepted source authority

- Repository: `coachtomlim/ruins-api`
- Accepted branch at close: `work/web-flare-friend-feedback-nav-001`
- Accepted/live artifact commit: `7a436176a13cde60ab7a1a900511ff711aaf7e4e`
- Release source SHA recorded by the 002E9G package: `c7104c8b1f4752e6c17aa9a8b10c37af4bfbc9ee`
- Release manifest: `docs/release/web-flare-friend-feedback-nav-001-release.manifest.json`
- Release ZIP: `docs/release/web-flare-friend-feedback-nav-001-release.zip`
- Portable ZIP SHA-256: `f00468df2a15ce761145a5d96b5f70be28fe98b662a759a8ba09d461af130eba`

The dedicated frozen release ref is:

`release/friend-feedback-002e9g-live-accepted`

and it must remain pointed at the exact accepted commit above.

## 2. Live acceptance

Final live acceptance result:

`FRIEND_FEEDBACK_002E9G_LIVE_ACCEPTANCE: PASS`

Accepted behaviors include:

- public Hub HTTP 200;
- frozen legacy routes 7/7 PASS;
- real persisted Friend challenge;
- genuine `/m/XXXX` invite with real correlation token and no `demo=1`;
- Friend invitation boot with sender identity, Runner, target and enabled chooser;
- Level 1 chooser/run completion;
- first correlated result receipt delivered successfully;
- natural Level 2 unlock;
- Gizmo review;
- Level 2 Builder;
- 4 Goblins / 4 of 8 / 80 of 100;
- second correlated result receipt delivered successfully;
- HOME -> Runner Hub -> CONTINUE AS GUEST;
- correlated Friend context, Gizmos and Level 2 retained;
- no deployment or rollback required during final acceptance.

Accepted first result id:

`66539b38-c3d4-4890-99db-4428a949ca4e`

Accepted second result id:

`7feef69f-9f90-4652-8ee3-aae0591ce745`

## 3. Owner video evidence

Full live Friend-receiver acceptance video:

`G:\My Drive\Quick Dungeon\Owner Review\FRIEND_REWARD_JOURNEY_001\FINAL_LIVE_002E9G_ACCEPTANCE\FRIEND_002E9G_LIVE_RECEIVER_FULL_RUN.mp4`

- duration: 00:02:14.333
- resolution: 390 x 844
- Friend-receiver perspective
- first and second receipts visible
- natural Level 2 unlock visible
- Continue as Guest visible
- page errors: 0

Preferred Owner/demo recording with visible cursor:

`G:\My Drive\Quick Dungeon\Owner Review\FRIEND_REWARD_JOURNEY_001\FINAL_LIVE_002E9G_ACCEPTANCE\FRIEND_002E9G_LIVE_RECEIVER_CURSOR_RUN.mp4`

- duration: 00:03:38.667
- resolution: 390 x 844
- Friend-receiver perspective
- visible natural pointer movement and click feedback
- one dungeon run only
- successful receipt shown
- Level 2/Gizmos shown
- 4 Goblins / 4 of 8 / 80 of 100 shown
- second dungeon run deliberately omitted
- Continue as Guest shown
- page errors: 0

## 4. Deployment shape frozen

The accepted live production tree is the merged 002E9G deployment shape:

- current release files present;
- historical/frozen extras preserved;
- deployment-managed `config.js` preserved;
- existing `.htaccess` behavior preserved;
- frozen short routes preserved;
- no change to SL_SIM;
- no change to `main`;
- no production Supabase schema/config mutation caused by final acceptance.

Do not reconstruct production as a clean 131-file-only tree. Historical route dependencies must remain preserved.

## 5. Frozen route regression set

The following accepted routes are predecessor/frozen behavior and must continue to pass unless the Owner explicitly authorizes a replacement:

- `/q/hiS4`
- `/q/Rind`
- `/g/MsJ9`
- `/h/UvVY`
- `/j/UvVY`
- `/k/UvVY`
- `/m/UvVY?from=Tom`

At final acceptance: **7/7 PASS**.

## 6. Post-freeze feature boundary

The following are **post-002E9G** and are not part of this accepted release:

- Flare audio integration;
- RUINS / Daily Expedition;
- any new Quick Run/Daily Run design;
- new rooms, monsters, traps, loot rules or progression;
- new music/ambience/SFX behavior;
- any 002E9H portability hardening or later work.

The Flare audio intake completed separately as:

`FLARE_AUDIO_INTAKE_001: PASS`

but **no audio intake asset or audio code is part of this frozen release**.

Any subsequent feature branch must preserve this accepted release as a recoverable baseline and prove the frozen regression set before promotion.

## 7. Change rule

Do not move the frozen release ref to a later commit.

Do not rewrite or amend the accepted commit.

Do not claim a later build is 002E9G merely because it is descended from this commit.

Later work must use a new branch/version identifier and must retain the ability to compare against:

`7a436176a13cde60ab7a1a900511ff711aaf7e4e`

---

Freeze result:

`FRIEND_FEEDBACK_002E9G: LIVE CLOSED / ACCEPTED / FROZEN`
