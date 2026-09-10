import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fixture} from './room-fixture.mjs';
import {applyRunnerModel,runnerSummary,buildReceiverDungeon,actualHpPercent} from '../public/flare-s5/game.mjs';
import {Simulation} from '../public/flare-s4/simulation.mjs';
import {calibrateEncounter,difficultyCue} from '../public/flare-s6/calibration.mjs';
import {encodeInviteCode,decodeInviteCode,makeInviteUrl} from '../public/flare-s6/flow.mjs';

const base=JSON.parse(fs.readFileSync(new URL('../public/flare-p0/data/catalog.json',import.meta.url),'utf8'));
const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s6/data/game.json',import.meta.url),'utf8'));
const html=fs.readFileSync(new URL('../public/flare-s6/challenge.html',import.meta.url),'utf8');
const builder=fs.readFileSync(new URL('../public/flare-s6/index.html',import.meta.url),'utf8');
function run(runnerId,targetHp){const catalog=applyRunnerModel(base,model,runnerId),runner=runnerSummary(model,runnerId,catalog),cal=calibrateEncounter({catalog,model,runnerId,runner,targetHp}),built=buildReceiverDungeon({roomId:fixture.id,roomTitle:'Probe',map:fixture,catalog,targetHp,...cal.encounter,budget:model.budget}),sim=new Simulation(fixture,built.challenge,catalog);sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();return{runnerId,targetHp,preset:cal.encounter.id,cost:built.spent,status:sim.status,pct:actualHpPercent(sim.status,sim.hero.hp,sim.hero.maxHp)}}

test('calibration selects legal defaults across all runner tiers',()=>{for(const runnerId of ['warrior-l1','warrior-l2','warrior-l3'])for(const targetHp of [80,60,40]){const row=run(runnerId,targetHp);assert.ok(row.cost<=100);assert.equal(row.status,'cleared')}});
test('tough warrior 60 percent target is materially better calibrated than S5 default',()=>{const row=run('warrior-l3',60);assert.equal(row.cost,100);assert.ok(Math.abs(row.pct-60)<=15,`actual ${row.pct}% was still too far from 60%`)});
test('mid-band calibration is credible for level 1 and level 2 runners',()=>{assert.ok(Math.abs(run('warrior-l1',60).pct-60)<=10);assert.ok(Math.abs(run('warrior-l2',40).pct-40)<=10)});
test('difficulty cue remains guidance rather than an exact result prediction',()=>{assert.equal(difficultyCue(95,60).label,'Easy');assert.equal(difficultyCue(66,60).label,'Fair');assert.equal(difficultyCue(42,60).label,'Brutal');assert.match(html,/does not tell you the answer or guarantee the result/i)});
test('S6 invitation still carries only runner and target in four characters',()=>{const invite={runnerId:'warrior-l3',targetHp:60},code=encodeInviteCode(invite,model),decoded=decodeInviteCode(code,model);assert.equal(code.length,4);assert.deepEqual({runnerId:decoded.runnerId,targetHp:decoded.targetHp},invite);const url=makeInviteUrl('https://think-2-thrive.com/quick-dungeon/flare-s6/',invite,model,{sender:'Buddy'});assert.match(url.href,/^https:\/\/think-2-thrive\.com\/h\/[A-Za-z0-9_-]{4}$/)});
test('sender still chooses no room monsters potion or trap',()=>{assert.doesNotMatch(builder,/id="roomPreview"|id="enemy1"|id="potion"|id="trap"/);assert.match(builder,/choose the runner and target/i)});
test('receiver opening explains the task and short-route assets are canonical',()=>{assert.match(html,/HOW TO PLAY/);assert.match(html,/Choose a room/);assert.match(html,/Build the danger/);assert.match(html,/Run the gauntlet/);assert.match(html,/href="\/quick-dungeon\/flare-s6\/style\.css"/);assert.match(html,/src="\/quick-dungeon\/flare-s6\/challenge\.mjs"/)});
