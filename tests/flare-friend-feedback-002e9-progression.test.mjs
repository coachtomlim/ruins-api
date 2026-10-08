import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';
import {applyRunnerModel,runnerSummary} from '../public/flare-s7/game.mjs';
import {buildCustomizationCatalog} from '../public/flare-s8a/catalog-view-model.mjs';
import {buildDungeonPresets,GOVERNED_PRESET_IDS} from '../public/flare-s8a/dungeon-presets.mjs';
import {presetById} from '../public/flare-s71/calibration.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from '../public/flare-s8a/level2-content.mjs';
import {BUILDER_LEVEL_KEY,LEGACY_UNLOCK_KEY,STARTER_DUNGEON_IDS,BROKEN_GALLERY_ID,readBuilderLevel,grantFirstRunLevel,contentForLevel,newContentAtLevel,editorContentIds,clampBuilderLevel,customizationUnlockedAt,CATEGORIES,CATEGORY_LABELS} from '../public/flare-s8a/builder-level.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const readJson=path=>JSON.parse(fs.readFileSync(new URL(path,import.meta.url),'utf8'));
const memoryStorage=(initial={})=>{const m=new Map(Object.entries(initial));return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),dump:()=>Object.fromEntries(m)}};

test('a fresh session is Builder Level 1 with customization locked',()=>{
  assert.equal(readBuilderLevel(memoryStorage()),1);
  assert.equal(customizationUnlockedAt(1),false);
  assert.equal(readBuilderLevel(null),1);
  assert.equal(readBuilderLevel({getItem(){throw new Error('blocked')}}),1);
});

test('the first completed run grants Builder Level 2 for this session and a same-tab reload keeps it',()=>{
  const store=memoryStorage(),first=grantFirstRunLevel(store,readBuilderLevel(store));
  assert.deepEqual({level:first.level,leveledUp:first.leveledUp},{level:2,leveledUp:true});
  assert.equal(store.dump()[BUILDER_LEVEL_KEY],'2');
  assert.equal(readBuilderLevel(store),2,'same-session reload');
  const second=grantFirstRunLevel(store,2);
  assert.equal(second.leveledUp,false,'level-up is celebrated exactly once');
  assert.equal(readBuilderLevel(memoryStorage()),1,'fresh tab/device/session starts at Level 1 again — no durable claim');
});

test('a 002E7/002E8 in-flight session flag is honoured as Level 2 but never written again',()=>{
  const store=memoryStorage({[LEGACY_UNLOCK_KEY]:'1'});
  assert.equal(readBuilderLevel(store),2);
  assert.equal(store.dump()[BUILDER_LEVEL_KEY],undefined);
});

test('blocked sessionStorage still levels up for the page lifetime and reports it did not persist',()=>{
  const broken={getItem(){throw new Error('x')},setItem(){throw new Error('x')}};
  const grant=grantFirstRunLevel(broken,1);
  assert.equal(grant.level,2);assert.equal(grant.leveledUp,true);assert.equal(grant.persistedForSession,false);
});

test('level values are clamped to the two supported Builder Levels',()=>{
  assert.equal(clampBuilderLevel(0),1);assert.equal(clampBuilderLevel('7'),2);assert.equal(clampBuilderLevel(2),2);assert.equal(clampBuilderLevel(undefined),1);
});

test('the interface categories are stable and SUPPORT is singular',()=>{
  assert.deepEqual(CATEGORIES,['monsters','traps','supports','dungeons']);
  assert.deepEqual(Object.values(CATEGORY_LABELS),['MONSTERS','TRAPS','SUPPORT','DUNGEONS']);
});

test('Level 1 content: Goblin + Skeleton, three starter dungeon shells, Broken Gallery NOT exposed',()=>{
  const l1=contentForLevel(1);
  assert.deepEqual(l1.monsters,['goblin','skeleton']);
  assert.deepEqual(l1.traps,[]);
  assert.deepEqual(l1.dungeons,['iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-08']);
  assert.deepEqual(l1.dungeons.map(id=>S7_ROOMS[id].name),['Pillar Court','Crossed Court','Scattered Hall']);
  assert.equal(l1.dungeons.includes(BROKEN_GALLERY_ID),false);
  assert.equal(BROKEN_GALLERY_ID,'iron-labyrinth-07');
  assert.equal(S7_ROOMS[BROKEN_GALLERY_ID].name,'Broken Gallery');
  assert.deepEqual(STARTER_DUNGEON_IDS,l1.dungeons);
});

test('Level 2 NEW content: Zombie + Skeleton Archer, Spike + Dart Trap, no new Support, Broken Gallery',()=>{
  const n=newContentAtLevel(2);
  assert.deepEqual(n.monsters,['zombie','skeleton-archer']);
  assert.deepEqual(n.traps,['spike-trap','dart-trap']);
  assert.deepEqual(n.supports,[]);
  assert.deepEqual(n.dungeons,['iron-labyrinth-07']);
});

test('Level 2 cumulative access: four monsters, both traps, existing supports, four dungeons; Vaulted Crossing and Twin Lanes stay reserved',()=>{
  const l2=contentForLevel(2);
  assert.deepEqual(l2.monsters,['goblin','skeleton','zombie','skeleton-archer']);
  assert.deepEqual(l2.traps,['spike-trap','dart-trap']);
  assert.deepEqual(l2.supports,['small-potion','battle-tonic','iron-tonic']);
  assert.deepEqual(l2.dungeons,['iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-08','iron-labyrinth-07']);
  assert.equal(l2.dungeons.includes('iron-labyrinth-15'),false);
  assert.equal(l2.dungeons.includes('iron-labyrinth-18'),false);
  assert.ok(S7_ROOMS['iron-labyrinth-15']&&S7_ROOMS['iron-labyrinth-18'],'not deleted or repurposed');
  assert.equal(l2.monsters.includes('goblin-elite'),false);
  assert.equal(l2.monsters.includes('antlion'),false);
});

test('the editor keeps an input for every id a governed preset references, even while locked at Level 1',()=>{
  const presets=GOVERNED_PRESET_IDS.map(presetById),ids=editorContentIds(1,presets);
  assert.ok(ids.traps.includes('spike-trap'),'Brutal preset still has its Spike Trap input so encounter state round-trips');
  assert.ok(ids.supports.includes('small-potion'));
  assert.deepEqual(ids.dungeons,contentForLevel(1).dungeons);
});

test('governed dungeon presets are built over the three starter shells only',()=>{
  const base=readJson('../public/flare-p0/data/catalog.json'),model=extendModelWithLevel2(readJson('../public/flare-s7/data/game.json')),catalog=extendCatalogWithLevel2(applyRunnerModel(base,model,'warrior-l1'),model),runner=runnerSummary(model,'warrior-l1',catalog);
  const presets=buildDungeonPresets({catalog,model,runnerId:'warrior-l1',runner,targetHp:60,budget:100,roomIds:contentForLevel(1).dungeons});
  assert.deepEqual([presets.tooEasy.roomId,presets.justRight.roomId,presets.brutal.roomId],['iron-labyrinth-01','iron-labyrinth-03','iron-labyrinth-08']);
});

test('customization catalog honours Builder Level access (Level 2 lists Zombie and Skeleton Archer, not Elite/Antlion)',()=>{
  const base=readJson('../public/flare-p0/data/catalog.json'),model=extendModelWithLevel2(readJson('../public/flare-s7/data/game.json')),catalog=extendCatalogWithLevel2(applyRunnerModel(base,model,'warrior-l1'),model),runner=runnerSummary(model,'warrior-l1',catalog);
  const vm2=buildCustomizationCatalog({model,catalog,runnerId:'warrior-l1',runner,access:contentForLevel(2)});
  assert.deepEqual(vm2.monsters.map(m=>m.label),['Goblin','Skeleton','Zombie','Skeleton Archer']);
  assert.deepEqual(vm2.monsters.map(m=>m.cost),[20,30,35,35]);
  assert.deepEqual(vm2.traps.map(t=>t.label),['Spike Trap','Dart Trap']);
  assert.deepEqual(vm2.supports.map(s=>s.label),['Small Potion','Battle Tonic','Iron Tonic']);
  const vm1=buildCustomizationCatalog({model,catalog,runnerId:'warrior-l1',runner,access:contentForLevel(1)});
  assert.deepEqual(vm1.monsters.map(m=>m.label),['Goblin','Skeleton']);
  assert.deepEqual(vm1.traps,[]);
});

test('the receiver wires Builder Level into dungeon visibility, controls and the DUNGEONS tab',async()=>{
  const [mjs,html,css]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/challenge.html'),read('public/flare-s8a/style.css')]);
  assert.match(mjs,/const visibleSpecs=\(\)=>contentForLevel\(builderLevel\)\.dungeons\.map\(id=>S7_ROOMS\[id\]\);/);
  assert.match(mjs,/function applyBuilderLevel\(level\)\{/);
  assert.match(mjs,/function renderDungeonCards\(\)\{/);
  assert.match(mjs,/roomIds:specs\.map\(s=>s\.id\)/);
  for(const tab of ['monsters','traps','supports','dungeons'])assert.match(html,new RegExp(`data-custom-tab="${tab}"`));
  assert.match(html,/data-custom-tab="supports">SUPPORT</);
  assert.doesNotMatch(html,/>SUPPORTS</);
  assert.match(html,/data-custom-panel="dungeons" hidden/);
  assert.match(css,/\.dungeon-grid\{/);
});

test('selected option cards use a strong reversed background, not a subtle outline',async()=>{
  const css=await read('public/flare-s8a/style.css');
  assert.match(css,/\.card:has\(:checked\)\{border-color:#f6d77d;background:linear-gradient\(#f4cd70,#dda02b\);color:#1b101c/);
});

test('Broken Gallery is excluded from the Level 1 starter chooser and the receiver never persists Level 2 beyond sessionStorage',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.doesNotMatch(mjs,/localStorage|indexedDB|document\.cookie|\.rpc\(['"]set_builder/);
});
