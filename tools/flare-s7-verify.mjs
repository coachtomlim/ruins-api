import fs from 'node:fs';import assert from 'node:assert/strict';
import {parseMap,parseAnimation} from '../public/flare-p0/src/core/flare.mjs';import {deriveSlots} from '../public/flare-s2/core.mjs';
import {S7_ROOMS,FLARE_115_PIN} from '../public/flare-s7/rooms.mjs';import {S7_ACTORS,requireS7AnimationStates} from '../public/flare-s7/actors.mjs';
import {applyRunnerModel,buildS7Challenge} from '../public/flare-s7/game.mjs';import {Simulation} from '../public/flare-s7/simulation.mjs';

const root=new URL('../',import.meta.url),raw=`https://raw.githubusercontent.com/flareteam/flare-game/${FLARE_115_PIN}/`,base=JSON.parse(fs.readFileSync(new URL('public/flare-p0/data/catalog.json',root),'utf8')),model=JSON.parse(fs.readFileSync(new URL('public/flare-s7/data/game.json',root),'utf8'));
async function source(path){const response=await fetch(raw+path,{headers:{'user-agent':'QuickDungeonS7Verifier/1.0'}});if(!response.ok)throw Error(`${path} returned ${response.status}`);return response.text()}
const matrix=[];
for(const spec of Object.values(S7_ROOMS)){
  const local=fs.readFileSync(new URL(`public/flare-s7/${spec.local}`,root),'utf8'),upstream=await source(spec.source);assert.equal(local.replace(/\r\n/g,'\n'),upstream.replace(/\r\n/g,'\n'),`${spec.id} differs from Flare v1.15`);
  const map=parseMap(local);map.id=spec.id;const slots=deriveSlots(map,3),catalog=applyRunnerModel(base,model,'warrior-l1'),encounter={enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:[]},built=buildS7Challenge({roomId:spec.id,roomTitle:spec.name,map,catalog,targetHp:50,encounter}),sim=new Simulation(map,built.challenge,catalog);sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();assert.equal(sim.status,'cleared',`${spec.id} default simulation did not clear`);matrix.push({id:spec.id,name:spec.name,size:`${map.width}x${map.height}`,spawn:slots.spawn,exit:slots.exit,path:slots.pathLength,status:sim.status,hp:sim.hero.hp,ticks:sim.tick});
}
for(const [id,spec] of Object.entries(S7_ACTORS)){const parsed=parseAnimation(await source(`mods/fantasycore/${spec.source}`)),pack=requireS7AnimationStates(parsed,id);assert.equal(pack.animations.attack,pack.animations.swing);for(const state of ['stance','run','swing','hit','die'])assert.ok(Object.keys(pack.animations[state].entries).length,`${id} ${state} has no frames`)}
console.log('S7 STOCK SOURCE PASS');console.log(`FLARE v1.15: ${FLARE_115_PIN}`);for(const row of matrix)console.log(`${row.id} | ${row.name} | ${row.size} | spawn ${row.spawn.join(',')} | exit ${row.exit.join(',')} | path ${row.path} | ${row.status} | HP ${row.hp} | ticks ${row.ticks}`);console.log('ACTORS: goblin-elite and antlion real stance/run/swing/hit/die PASS');
