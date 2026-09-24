// Non-sensitive release identity for WEB-FLARE. Carries no credential, no endpoint, no player data —
// safe to display in the Hub footer or diagnostics, and safe to read from any support ticket.
// This file is regenerated (never hand-edited) by scripts/release/generate-manifest.mjs, which pins
// RELEASE_SOURCE_SHA to the exact commit the manifest was traced from.
export const RELEASE_ID='WEB-FLARE-RC1';
export const RELEASE_SOURCE_SHA='e8c50936fb7c7d665438fb3ef1baa524c8dee637';
export const RELEASE_GAME_RULES_VERSION=3; // public/flare-s7/data/game.json .version
export const RELEASE_CONTENT_VERSION='flare-p0-v1.15-stock'; // stock Flare dungeon/asset generation in use
export const RELEASE_ENCOUNTER_ADVISOR_VERSION='p10-deterministic-encounter-advisor-001';
export const RELEASE_MANIFEST_VERSION=1;

export function releaseIdentityLabel(){
  return `${RELEASE_ID} · ${RELEASE_SOURCE_SHA.slice(0,7)}`;
}
