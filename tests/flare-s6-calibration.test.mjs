import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fixture} from './room-fixture.mjs';
import {applyRunnerModel,runnerSummary,buildReceiverDungeon,actualHpPercent} from '../public/flare-s5/game.mjs';
import {Simulation} from '../public/flare-s4/simulation.mjs';
import {calibrateEncounter} from '../public/flare-s6/calibration.mjs';

const base=JSON.parse(fs.readFileSync(new URL('../public/flare-p0/data/catalog.json',import.meta.url),'utf8'));
const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s5/data/game.json',import.meta.url),'utf8'));
function run(runnerId,targetHp){const catalog=applyRunnerModel(base,model,runnerId),runner=runnerSummary(model,runnerId,catalog),cal=calibrateEncounter({catalog,model,runnerId,runner,targetHp}),built=buildReceiverDungeon({roomId:fixture.id,roomTitle:'Probe',map:fixture,catalog,targetHp,...cal.encounter,budget:model.budget}),sim=new Simulation(fixture,built.challenge,catalog);sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();return{runnerId,targetHp,preset:cal.encounter.id,cost:built.spent,status:sim.status,hp:sim.hero.hp,pct:actualHpPercent(sim.status,sim.hero.hp,sim.hero.maxHp),cue:cal.cue.id}}

test('calibration selects legal deterministic defaults',()=>{const rows=[];for(const runnerId of ['warrior-l1','warrior-l2','warrior-l3'])for(const targetHp of [80,60,40])rows.push(run(runnerId,targetHp));console.log('S6_CALIBRATION_PROBE',JSON.stringify(rows));for(const row of rows){assert.ok(row.cost<=100);assert.equal(row.status,'cleared')}});
