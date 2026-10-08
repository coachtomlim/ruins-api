import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseMap} from '../public/flare-p0/src/core/flare.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';
import {applyRunnerModel,runnerSummary,encounterCost,normalizeEncounter,buildS7Challenge,monsterSummary} from '../public/flare-s7/game.mjs';
import {estimateEncounter} from '../public/flare-s7/calibration.mjs';
import {Simulation} from '../public/flare-s7/simulation.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2,LEVEL2_MONSTER_IDS,LEVEL2_MONSTER_MODEL,LEVEL2_MONSTER_TIMING,receiptSupportsEncounter,SKELETON_ARCHER_RANGED_BEHAVIOUR_DEFERRED} from '../public/flare-s8a/level2-content.mjs';
import {buildResultReceipt} from '../public/flare-s8a/result-receipt.mjs';

const readJson=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8')),base=readJson('../public/flare-p0/data/catalog.json'),rawModel=readJson('../public/flare-s7/data/game.json');
const model=extendModelWithLevel2(rawModel);
const roomMap=id=>{const map=parseMap(fs.readFileSync(new URL(`../public/flare-s7/${S7_ROOMS[id].local}`,import.meta.url),'utf8'));map.id=id;return map};
const setup=(runnerId='warrior-l1')=>{const catalog=extendCatalogWithLevel2(applyRunnerModel(base,model,runnerId),model);return{catalog,runner:runnerSummary(model,runnerId,catalog)}};
function run(roomId,encounter,{runnerId='warrior-l1',targetHp=50}={}){
  const {catalog}=setup(runnerId),map=roomMap(roomId),built=buildS7Challenge({roomId,roomTitle:S7_ROOMS[roomId].name,map,catalog,targetHp,encounter,budget:100}),sim=new Simulation(map,built.challenge,catalog);
  sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();return{catalog,built,sim,result:sim.result()};
}

test('Zombie parameters are exactly the locked 002E9 authority',()=>{
  const {catalog}=setup(),z=catalog.enemies.zombie;
  assert.deepEqual([z.maxHp,z.damage,z.armor,z.cost,z.gold],[50,8,1,35,11]);
  assert.equal(model.monsters.zombie.rating,'Medium');assert.equal(model.monsters.zombie.role,'Bruiser');assert.equal(model.monsters.zombie.tier,2);
  assert.equal(model.monsters.zombie.animation,'mods/fantasycore/animations/enemies/zombie.txt');
  assert.equal(model.monsters.zombie.sprite,'images/enemies/zombie.png');
  assert.equal(z.sprite,'zombie');
});

test('Skeleton Archer parameters are exactly the locked 002E9 authority',()=>{
  const {catalog}=setup(),a=catalog.enemies['skeleton-archer'];
  assert.deepEqual([a.maxHp,a.damage,a.armor,a.cost,a.gold],[45,8,2,35,11]);
  assert.equal(model.monsters['skeleton-archer'].rating,'Medium');assert.equal(model.monsters['skeleton-archer'].role,'Ranged Guard');assert.equal(model.monsters['skeleton-archer'].tier,2);
  assert.equal(model.monsters['skeleton-archer'].animation,'mods/fantasycore/animations/enemies/skeleton_archer.txt');
  assert.equal(model.monsters['skeleton-archer'].sprite,'images/enemies/skeleton_archer.png');
  assert.equal(a.sprite,'skeleton-archer');
});

test('Level 2 timing/range fields are explicit, documented and sit inside the existing melee contract',()=>{
  assert.deepEqual(LEVEL2_MONSTER_TIMING.zombie,{interval:1,windup:.34,animationTime:.4,range:1.08,radius:.24});
  assert.deepEqual(LEVEL2_MONSTER_TIMING['skeleton-archer'],{interval:.9,windup:.3,animationTime:.4,range:1.08,radius:.22});
  assert.equal(SKELETON_ARCHER_RANGED_BEHAVIOUR_DEFERRED,true);
});

test('existing monster economics are untouched (Goblin, Skeleton, Goblin Elite, Antlion)',()=>{
  const {catalog}=setup(),pick=id=>{const e=catalog.enemies[id];return[e.maxHp,e.damage,e.armor,e.cost,e.gold]};
  assert.deepEqual(pick('goblin'),[30,5,1,20,6]);assert.deepEqual(pick('skeleton'),[45,7,2,30,9]);
  assert.deepEqual(pick('goblin-elite'),[55,9,2,40,12]);assert.deepEqual(pick('antlion'),[70,8,4,50,15]);
  assert.deepEqual(LEVEL2_MONSTER_IDS,['zombie','skeleton-archer']);
  assert.equal(Object.isFrozen(LEVEL2_MONSTER_MODEL.zombie),true);
});

test('the raw frozen S7 model is not mutated by extending it',()=>{assert.equal(rawModel.monsters.zombie,undefined);assert.equal(model.monsters.zombie.name,'Zombie')});

test('Level 2 monsters are accepted by normalization, budget and estimator',()=>{
  const {catalog,runner}=setup(),e=normalizeEncounter({enemyTypes:['zombie','skeleton-archer','goblin'],supportTypes:[],trapTypes:[]});
  assert.deepEqual(e.enemyTypes,['zombie','skeleton-archer','goblin']);
  assert.equal(encounterCost(catalog,e),35+35+20);
  const est=estimateEncounter({catalog,model,runnerId:'warrior-l1',runner,encounter:e});
  assert.equal(est.cost,90);assert.ok(est.estimatedHpPercent>0&&est.estimatedHpPercent<100);
  const summary=monsterSummary('zombie',model,'warrior-l1',catalog,runner);
  assert.equal(summary.gold,11);assert.equal(summary.cost,35);
  assert.throws(()=>buildS7Challenge({roomId:'iron-labyrinth-01',roomTitle:'x',map:roomMap('iron-labyrinth-01'),catalog,targetHp:50,encounter:{enemyTypes:['zombie','zombie','zombie'],supportTypes:[],trapTypes:[]}}),/Budget exceeded/);
});

test('Zombie runs in the deterministic simulation: swing attacks, hero kills it, 11 Gold dropped',()=>{
  const a=run('iron-labyrinth-01',{enemyTypes:['zombie','none','none'],supportTypes:[],trapTypes:[]}),b=run('iron-labyrinth-01',{enemyTypes:['zombie','none','none'],supportTypes:[],trapTypes:[]});
  assert.equal(a.result.status,'cleared');assert.equal(a.result.gold,11);assert.equal(a.result.kills,1);
  assert.ok(a.sim.events.some(x=>x.type==='attack'&&x.actor==='guard-1'),'zombie attacked the hero');
  assert.ok(a.sim.events.some(x=>x.type==='damage'&&x.actor==='guard-1'&&x.value===7),'zombie hit = ATK 8 - hero DEF 1');
  assert.ok(a.sim.events.some(x=>x.type==='death'&&x.actor==='guard-1'));
  assert.deepEqual(a.result,b.result);
  assert.equal(a.built.challenge.enemies[0].type,'zombie');
});

test('Skeleton Archer runs in the deterministic simulation under the existing melee-reach contract',()=>{
  const a=run('iron-labyrinth-01',{enemyTypes:['skeleton-archer','none','none'],supportTypes:[],trapTypes:[]}),b=run('iron-labyrinth-01',{enemyTypes:['skeleton-archer','none','none'],supportTypes:[],trapTypes:[]});
  assert.equal(a.result.status,'cleared');assert.equal(a.result.gold,11);assert.equal(a.result.kills,1);
  assert.ok(a.sim.events.some(x=>x.type==='attack'&&x.actor==='guard-1'));
  assert.ok(a.sim.events.some(x=>x.type==='damage'&&x.actor==='guard-1'&&x.value===7));
  assert.deepEqual(a.result,b.result);
  assert.equal(a.catalog.enemies['skeleton-archer'].range,1.08);
});

test('both Level 2 monsters play together in every room including Broken Gallery, with a serializable challenge',()=>{
  for(const roomId of ['iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-08','iron-labyrinth-07']){
    const r=run(roomId,{enemyTypes:['zombie','skeleton-archer','none'],supportTypes:['small-potion'],trapTypes:[]});
    assert.ok(['cleared','dead'].includes(r.result.status),`${roomId}: ${r.result.status}`);
    assert.equal(r.result.totalEnemies,2);
    const json=JSON.stringify(r.built.challenge);assert.deepEqual(JSON.parse(json),r.built.challenge);
    assert.match(r.built.challenge.id,/^quick-[a-z0-9]+$/);
  }
});

test('traps unlocked at Level 2 (Spike, Dart) keep their existing economics',()=>{
  assert.deepEqual([model.items['spike-trap'].damage,model.items['spike-trap'].cost,model.items['spike-trap'].armorPiercing],[30,20,false]);
  assert.deepEqual([model.items['dart-trap'].damage,model.items['dart-trap'].cost,model.items['dart-trap'].armorPiercing],[16,15,true]);
});

test('a legal Level 2 budget can reach 31 hero Gold, the governed receipt ceiling (002E9A)',()=>{
  // Two Level 2 monsters + a Skeleton is exactly 100 budget and 31 Gold — the governed receipt
  // maximum since 002E9A raised the server and client bound from 30 to 31.
  const {catalog}=setup(),e={enemyTypes:['zombie','zombie','skeleton'],supportTypes:[],trapTypes:[]};
  assert.equal(encounterCost(catalog,e),100);
  const gold=e.enemyTypes.reduce((n,id)=>n+catalog.enemies[id].gold,0);
  assert.equal(gold,31);
});

test('result receipt: Level 2 monsters are server-supported since 002E9A; unknown ids still are not',()=>{
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','skeleton','none']}),true);
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin-elite','antlion','none']}),true);
  assert.equal(receiptSupportsEncounter({enemyTypes:['zombie','none','none']}),true);
  assert.equal(receiptSupportsEncounter({enemyTypes:['goblin','skeleton-archer','none']}),true);
  assert.equal(receiptSupportsEncounter({enemyTypes:['dragon','none','none']}),false);
  assert.equal(receiptSupportsEncounter({enemyTypes:['Zombie','none','none']}),false);
  assert.equal(buildResultReceipt({publicToken:'a'.repeat(40),roomId:'iron-labyrinth-07',encounter:{enemyTypes:['zombie','zombie','skeleton']},result:{status:'cleared',hp:50,maxHp:100},heroGold:31,attemptToken:'b'.repeat(20)}).p_hero_gold,31);
  // payload shape for a supported encounter is unchanged
  const p=buildResultReceipt({publicToken:'a'.repeat(40),roomId:'iron-labyrinth-01',encounter:{enemyTypes:['goblin']},result:{status:'cleared',hp:50,maxHp:100},heroGold:6,attemptToken:'b'.repeat(20)});
  assert.equal(p.p_hero_gold,6);
});
