# WEB-FLARE S8A Acceptance Scorecard

Use this scorecard after the one-go implementation and before any deployment authorization.

Disposition is binary: every Required row must PASS. No averaging.

| Area | Required evidence | Pass condition |
|---|---|---|
| Predecessor freeze | Git diff/fingerprint | S2-S7.1 unchanged |
| Route isolation | invite encode/decode/browser | `/m/XXXX`; runner+target only; old routes unchanged |
| Invitation | mobile browser | DUNGEON RUNNER, sender, runner, target, animated stance, large Accept visible |
| Mission comprehension | 360x800, 390x844, 430x932 | target-first clear-not-kill mission visible without hunting/scrolling |
| Reward incentive | mission panel | higher fit = higher score + more Gold, max reward cue visible |
| Dungeon choice | mobile browser | one room at a time, large arrows/swipe, large `USE THIS DUNGEON` |
| Optional path | mobile browser | Accept -> Use Dungeon -> Run works without customization |
| Customization | mobile browser | panel/tabs, one category active, budget always visible, large Done |
| Build budget | logic/UI | cannot exceed 100; budget is not confused with earned Gold |
| Runtime determinism | duplicate runs | identical inputs produce identical result |
| Overview | geometry evidence + browser | materially wider dungeon composition, button becomes FOLLOW HERO |
| Follow Hero | geometry evidence + browser | tracked camera restored visibly |
| Pause/Resume | browser | simulation pauses and resumes without corrupting result |
| Reward screen | mobile browser | dedicated full-screen panel, not battlefield overlay |
| Hero Gold | logic/browser | equals actual run Gold and is labelled as sender Hero reward |
| Builder Gold | logic/browser | clear-only score bands exact |
| Failure reward | logic/browser | dead/blocked/timeout => 0 Builder Gold |
| Run Again | browser + canonical input proof | exact current run inputs preserved |
| Edit Dungeon | browser | current room/config retained when returning to customization |
| Registration gate | browser | dedicated account screen, carried context visible, no Buddy/Test |
| No persistence | source scan | no local/session storage, IndexedDB, cookies or backend used as account authority |
| No credentials | browser/source | S8A registration gate collects no email/password/login secret |
| Accessibility | mobile browser | readable text and large controls; no critical tiny-text box |
| Performance | browser evidence | no avoidable duplicate asset/runtime loading; responsive interaction |
| Complete tests | repository | all predecessor tests + S8A tests PASS |
| Flare source/assets | verification | stock-source verification PASS |
| Deployable identity | Git | one exact S8A web SHA named |
| Deployment restraint | evidence | no HostGator deployment and no Vercel operation during implementation |

## Automatic REVISE conditions

Return `S8A TEST STATUS: REVISE` if any Required row is unproven, even if the UI appears functional.

Do not substitute screenshots for functional assertions where geometry, state preservation, reward calculations or deterministic outputs can be tested directly.
