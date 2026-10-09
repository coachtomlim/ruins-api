import {isGovernedBrutal} from './governed-encounter.mjs';
// 002E9 Stage A — Level 2 monster content (Zombie, Skeleton Archer).
//
// public/flare-s7 and public/flare-s71 are frozen predecessor trees (tools/frozen-web-trees.json), so
// the two new monsters are layered onto the loaded S7 game model and catalog HERE instead of being
// added to s7/game.json. The shapes below are exactly what s7 already uses for goblin-elite and
// antlion (model.monsters[id] + catalog.enemies[id]); every s7 helper (normalizeEncounter,
// encounterCost, estimateEncounter, buildS7Challenge, Simulation) is keyed on those two maps and so
// accepts the new ids with no further change.
//
// Stats/costs/gold are LOCKED by the 002E9 work order. interval/windup/animationTime/range/radius are
// the smallest values consistent with the existing deterministic enemy contract: they sit between
// Skeleton (0.9s/0.3s) and Antlion (0.92s/0.3s), with melee reach 1.08 like every other enemy.
//
// SKELETON_ARCHER_RANGED_BEHAVIOUR_DEFERRED: the Archer uses the same simplified melee-reach
// deterministic contract as every other monster (range 1.08, Flare `swing` animation). Raising
// `range` would make the base Simulation hit from a distance, but the estimator and calibration do
// not model approach-time damage, so true ranged behaviour needs a recalibration pass of its own.
export const SKELETON_ARCHER_RANGED_BEHAVIOUR_DEFERRED=true;

export const LEVEL2_MONSTER_IDS=Object.freeze(['zombie','skeleton-archer']);

export const LEVEL2_MONSTER_MODEL=Object.freeze({
  zombie:Object.freeze({name:'Zombie',hp:50,attack:8,defense:1,cost:35,gold:11,rating:'Medium',role:'Bruiser',tier:2,animation:'mods/fantasycore/animations/enemies/zombie.txt',sprite:'images/enemies/zombie.png'}),
  'skeleton-archer':Object.freeze({name:'Skeleton Archer',hp:45,attack:8,defense:2,cost:35,gold:11,rating:'Medium',role:'Ranged Guard',tier:2,animation:'mods/fantasycore/animations/enemies/skeleton_archer.txt',sprite:'images/enemies/skeleton_archer.png'})
});

export const LEVEL2_MONSTER_TIMING=Object.freeze({
  zombie:Object.freeze({interval:1,windup:.34,animationTime:.4,range:1.08,radius:.24}),
  'skeleton-archer':Object.freeze({interval:.9,windup:.3,animationTime:.4,range:1.08,radius:.22})
});

export function extendModelWithLevel2(model){
  if(!model?.monsters)throw new Error('S7 game model is required');
  const next=structuredClone(model);
  for(const id of LEVEL2_MONSTER_IDS)next.monsters[id]={...LEVEL2_MONSTER_MODEL[id]};
  return next;
}

export function extendCatalogWithLevel2(catalog,model){
  if(!catalog?.enemies)throw new Error('S7 catalog is required');
  for(const id of LEVEL2_MONSTER_IDS){
    const m=model?.monsters?.[id];if(!m)throw new Error(`Missing Level 2 monster: ${id}`);
    catalog.enemies[id]={name:m.name,sprite:id,maxHp:m.hp,damage:m.attack,armor:m.defense,cost:m.cost,gold:m.gold,...LEVEL2_MONSTER_TIMING[id],behavior:'guard'};
  }
  return catalog;
}

// The result-receipt RPC (submit_builder_challenge_result_v2) validates enemy slots against a fixed
// server-side list. 002E9A (migration 20261003, applied and proven on S8B staging) added zombie and
// skeleton-archer. This list must stay identical to that server list: encounters containing anything
// outside it are not submitted, and the client reports that truthfully instead of attempting a call
// the server is certain to reject.
export const RECEIPT_SERVER_ENEMY_IDS=Object.freeze(['goblin','skeleton','goblin-elite','antlion','zombie','skeleton-archer']);
// 002E9C/002E9D: what the result service accepts.
//  * up to RECEIPT_SERVER_ORDINARY_MAX_ENEMIES monsters for ANY legal encounter (proven on S8B staging: eight slots);
//  * the exact governed Level 1 BRUTAL preset (five monsters, room iron-labyrinth-08) up to RECEIPT_SERVER_MAX_ENEMIES
//    (proven on S8B staging by the 002E9C migration).
// The Level 2 guard mixer can build four or five legal guards (e.g. 5 x Goblin = 100). The 002E9D migration
// (20261005, staging version 20261009071015) is applied and proven on S8B staging, so ordinary receipts accept up to
// eight entries; the server still derives budget (<=100) and Gold, so illegal builds are rejected. Nine entries and
// unknown ids are never submitted.
export const RECEIPT_SERVER_ORDINARY_MAX_ENEMIES=8;
export const RECEIPT_SERVER_MAX_ENEMIES=5;
export function receiptSupportsEncounter(encounter,{roomId='',maxOrdinary=RECEIPT_SERVER_ORDINARY_MAX_ENEMIES,maxGoverned=RECEIPT_SERVER_MAX_ENEMIES}={}){
  const enemies=(encounter?.enemyTypes||[]).filter(id=>id&&id!=='none');
  if(!enemies.every(id=>RECEIPT_SERVER_ENEMY_IDS.includes(id)))return false;
  if(enemies.length<=maxOrdinary)return true;
  return enemies.length<=maxGoverned&&isGovernedBrutal(roomId,encounter);
}
