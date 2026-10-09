import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {readFile} from 'node:fs/promises';
import {parseMap} from '../public/flare-p0/src/core/flare.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';
import {applyRunnerModel,runnerSummary,buildS7Challenge,encounterCost} from '../public/flare-s7/game.mjs';
import {Simulation} from '../public/flare-s7/simulation.mjs';
import {estimateEncounter} from '../public/flare-s7/calibration.mjs';
import {extendModelWithLevel2,extendCatalogWithLevel2} from '../public/flare-s8a/level2-content.mjs';
import {contentForLevel,newContentAtLevel,BROKEN_GALLERY_ID} from '../public/flare-s8a/builder-level.mjs';
import {buildCustomizationCatalog} from '../public/flare-s8a/catalog-view-model.mjs';
import {installPagedSelector} from '../public/flare-s8a/paged-selector.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const readJson=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const model=extendModelWithLevel2(readJson('../public/flare-s7/data/game.json'));
const catalog=extendCatalogWithLevel2(applyRunnerModel(readJson('../public/flare-p0/data/catalog.json'),model,'warrior-l1'),model);
const runner=runnerSummary(model,'warrior-l1',catalog);
const roomMap=id=>{const map=parseMap(fs.readFileSync(new URL(`../public/flare-s7/${S7_ROOMS[id].local}`,import.meta.url),'utf8'));map.id=id;return map};
const play=(roomId,encounter)=>{const map=roomMap(roomId),built=buildS7Challenge({roomId,roomTitle:S7_ROOMS[roomId].name,map,catalog,targetHp:50,encounter,budget:100}),sim=new Simulation(map,built.challenge,catalog);sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();return{built,sim,result:sim.result()}};

test('every Level 2 unlock is usable end to end: each new monster, trap and the new dungeon builds, estimates and plays',()=>{
  const fresh=newContentAtLevel(2);
  for(const monster of fresh.monsters){
    const e={enemyTypes:[monster,'none','none'],supportTypes:[],trapTypes:[]};
    assert.ok(estimateEncounter({catalog,model,runnerId:'warrior-l1',runner,encounter:e}).estimatedHpPercent<100);
    assert.equal(play(BROKEN_GALLERY_ID,e).result.status,'cleared',monster);
  }
  for(const trap of fresh.traps){
    const e={enemyTypes:['goblin','none','none'],supportTypes:[],trapTypes:[trap]},{sim,result}=play(BROKEN_GALLERY_ID,e);
    assert.equal(result.status,'cleared',trap);
    assert.ok(sim.events.some(x=>x.type==='trap'&&x.item.startsWith(trap)),`${trap} fired`);
  }
  for(const room of fresh.dungeons)assert.equal(play(room,{enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]}).result.status,'cleared');
});

test('the full Level 2 kit fits a legal budget in Broken Gallery (Zombie + Skeleton Archer + a trap)',()=>{
  const e={enemyTypes:['zombie','skeleton-archer','none'],supportTypes:[],trapTypes:['dart-trap']};
  assert.equal(encounterCost(catalog,e),85);
  assert.ok(['cleared','dead'].includes(play(BROKEN_GALLERY_ID,e).result.status));
});

test('the editor lists exactly the Level 2 kit with real costs, and the DUNGEONS list includes Broken Gallery',()=>{
  const vm=buildCustomizationCatalog({model,catalog,runnerId:'warrior-l1',runner,access:contentForLevel(2)});
  assert.deepEqual(vm.monsters.map(m=>[m.id,m.cost]),[['goblin',20],['skeleton',30],['zombie',35],['skeleton-archer',35]]);
  assert.deepEqual(vm.traps.map(t=>[t.id,t.cost]),[['spike-trap',20],['dart-trap',15]]);
  assert.ok(contentForLevel(2).dungeons.includes(BROKEN_GALLERY_ID));
});

test('levelling up rebuilds controls but re-applies the player\'s current selection and room',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  const fn=mjs.slice(mjs.indexOf('function applyBuilderLevel(level){'),mjs.indexOf('function',mjs.indexOf('function applyBuilderLevel(level){')+10));
  assert.match(fn,/const keepRoomId=selectedSpec\(\)\?\.id,keep=encounter\(\);/);
  assert.match(fn,/renderControls\(\);applyEncounter\(keep\);session=setEncounter\(session,encounter\(\)\);/);
});

test('dungeon cards change the real session room (Broken Gallery is runnable, not a preview)',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/input\.addEventListener\('change',\(\)=>\{roomIndex=specs\.findIndex\(x=>x\.id===spec\.id\);session=selectDungeon\(session,spec\.id\);show\(\);\}\);/);
  assert.match(mjs,/window\.__s8aData=\{model,catalog,invite,runner,rooms,specs:allSpecs,/);
});

test('trap/support editor cards use real Flare art where governed art exists; guard-mixer monsters use the packaged governed thumbnails',async()=>{
  const [mjs,icons]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/card-icons.mjs')]);
  assert.match(mjs,/const icon=flareArtIcon\(item\.id\)\|\|encounterItemBadge\(item\.id\);/);
  assert.match(mjs,/i\.src=LOOT_ASSETS\[m\.id\]/);
  assert.match(icons,/export function flareArtIcon\(id\)\{\s*if\(!FLARE_ART\[id\]\)return null;/);
});

test('mobile paged selector opens on the selected card and still never auto-toggles a selection',()=>{
  class Element{
    children=[];listeners={};attributes={};checked=false;textContent='';
    classList={values:new Set(),add:v=>this.classList.values.add(v),toggle:(v,on)=>on?this.classList.values.add(v):this.classList.values.delete(v)};
    append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}}
    querySelector(selector){return this.children.find(node=>node.tag===selector)}
    setAttribute(key,value){this.attributes[key]=value}
    addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
  }
  const old=globalThis.document;globalThis.document={createElement:tag=>Object.assign(new Element(),{tag})};
  try{
    const parent=new Element(),row=new Element();parent.append(row);
    const make=(value,checked=false)=>{const input=Object.assign(new Element(),{tag:'input',type:'radio',name:'guard-0',value,checked});const card=new Element();card.append(input,Object.assign(new Element(),{tag:'strong',textContent:value}));row.append(card);return{input,card}};
    make('none');make('goblin');make('skeleton');const zombie=make('zombie',true);
    const render=installPagedSelector(row,'monster for guard 1');
    assert.equal(typeof render.syncToSelection,'function');
    assert.ok(zombie.card.classList.values.has('is-current-page'),'opens on the selected Zombie card');
    assert.equal(zombie.input.checked,true,'paging/sync never changes the selection');
  }finally{globalThis.document=old}
});
