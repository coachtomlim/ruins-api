# WEB-FLARE S8A Error and Recovery Contract

## Goal

Failures must be understandable on a phone and must not strand the receiver on an empty or half-functional screen.

## Invalid or missing invitation

Show a dedicated panel:

`THIS CHALLENGE CANNOT OPEN`

Explain that the invitation is missing or invalid. Do not start a dungeon or fabricate defaults.

## Asset/catalog load failure

Show:

`DUNGEON ASSETS COULD NOT LOAD`

Primary action: `TRY AGAIN`

Do not enable `RUN THE HERO` until all required room/catalog/actor assets are ready.

## Room load failure

Keep the mission visible, mark the failed room unavailable, and allow another known-good room when possible. Do not silently substitute a different room while showing the failed room name.

## Run initialization failure

Return to `READY_TO_RUN` with current room/configuration preserved and a clear retry action. No reward screen appears because no authoritative terminal run result exists.

## Interrupted runtime

A browser refresh or page close during guest S8A play does not create a persisted result or reward. Do not claim recovery that does not exist.

## Registration gate interruption

Because S8A is memory-only, a refresh can lose the pending claim context. The S8A registration screen must not imply otherwise. Real retry-safe registration recovery is S8B authority.

## Unknown reward state

If run result status is not a recognized terminal status, Builder reward is zero and the UI must avoid a success message.

## General rule

Never convert a transport/UI error into a gameplay loss, reward, or persisted asset. Fail closed and preserve the last valid in-memory game configuration when possible.
