import test from 'node:test';import assert from 'node:assert/strict';
import {fixture} from './room-fixture.mjs';
import {applyGameModel,runnerSummary,monsterSummary,buildS4Challenge,DEFAULTS} from '../public/flare-s4/game.mjs';
import {Simulation} from '../public/flare-s4/simulation.mjs';
import {encodeGauntletCode,decodeGauntletCode,makePlayerUrl} from '../public/flare-s4/flow.mjs';
import {encodeGauntletCode as encodeS3Code} from '../public/flare-s3/flow.mjs';

const base={version:1,rules:'web-flare-0.2.0',heroes:{warrior:{name:'Warrior',sprite:'warrior',maxHp:100,damage:12,armor:0,interval:.6,windup:.18,animationTime:.4,range:1.05,speed:4.8,radius:.22}},enemies:{goblin:{name:'Goblin',sprite:'goblin',maxHp:30,damage:5,armor:0,interval:.8,windup:.28,animationTime:.4,range:1.08,radius:.22,gold:6,cost:20,behavior:'guard'},skeleton:{name:'Skeleton',sprite:'skeleton',maxHp:45,damage:7,armor:0,interval:.9,windup:.3,animationTime:.4,range:1.08,radius:.22,gold:9,cost:30,behavior:'guard'}},items:{'small-potion':{name:'Small potion',kind:'heal',heal:10,cost:15}}};
const model={version:1,runner:{id:'warrior-l1',name:'The Runner',className:'Warrior',level:1,hero:'warrior',baseHp:100,baseAttack:8,baseDefense:1,weapon:{id:'wooden-club',name:'Wooden Club',attack:4,defense:0}},monsters:{goblin:{name:'Goblin',hp:30,attack:5,defense:1,cost:20,rating:'Light'},skeleton:{name:'Skeleton',hp:45,attack:7,defense:2,cost:30,rating:'Medium'}},items:{'small-potion':{name:'Small Potion',heal:10,cost:15},'spike-trap':{name:'Spike Trap',damage:8,cost:20,oneShot:true}}};
const run=sim=>{sim.start();for(let i=0;i<3600&&sim.status==='running';i++)sim.step();return sim};

test('runner attack defense and weapon bonus become actual catalogue combat stats',()=>{const catalog=applyGameModel(base,model),runner=runnerSummary(model,catalog);assert.equal(runner.baseAttack,8);assert.equal(runner.weaponAttack,4);assert.equal(catalog.heroes.warrior.damage,12);assert.equal(catalog.heroes.warrior.armor,1)});

test('monster comparison values match the damage formula used by combat',()=>{const catalog=applyGameModel(base,model),runner=runnerSummary(model,catalog),g=monsterSummary('goblin',model,catalog,runner),s=monsterSummary('skeleton',model,catalog,runner);assert.deepEqual([g.damageToRunner,g.runnerDamage],[4,11]);assert.deepEqual([s.damageToRunner,s.runnerDamage],[6,10])});

test('simulation uses runner defense and monster defense, not decorative display values',()=>{const catalog=applyGameModel(base,model),built=buildS4Challenge({roomId:fixture.id,roomTitle:'Test',map:fixture,catalog,enemyTypes:['goblin','none','none'],potion:false,trap:false,targetHp:50}),sim=run(new Simulation(fixture,built.challenge,catalog));const damage=sim.events.filter(e=>e.type==='damage');assert.ok(damage.some(e=>e.actor==='hero'&&e.value===11));assert.ok(damage.some(e=>e.actor==='guard-1'&&e.value===4));assert.equal(sim.status,'cleared')});

test('spike trap costs budget, triggers once, and applies defense-reduced damage',()=>{const catalog=applyGameModel(base,model),built=buildS4Challenge({roomId:fixture.id,roomTitle:'Trap',map:fixture,catalog,enemyTypes:['none','none','none'],potion:false,trap:true,targetHp:50}),sim=run(new Simulation(fixture,built.challenge,catalog));assert.equal(built.spent,20);assert.equal(sim.events.filter(e=>e.type==='trap').length,1);assert.equal(sim.hero.hp,93);assert.equal(sim.status,'cleared')});

test('balanced encounter plus potion and trap remains inside 100 gold',()=>{const catalog=applyGameModel(base,model),built=buildS4Challenge({roomId:fixture.id,roomTitle:'Balanced',map:fixture,catalog,enemyTypes:DEFAULTS.enemyTypes,potion:true,trap:true,targetHp:50});assert.equal(built.spent,85);assert.equal(built.remaining,15)});

test('S4 keeps four-character links while encoding the trap choice',()=>{const options={roomId:fixture.id,enemyTypes:['goblin','skeleton','none'],potion:true,trap:true,targetHp:50},code=encodeGauntletCode(options),decoded=decodeGauntletCode(code);assert.equal(code.length,4);assert.equal(decoded.codeVersion,2);assert.equal(decoded.trap,true);assert.deepEqual(decoded.enemyTypes,options.enemyTypes);const url=makePlayerUrl('https://think-2-thrive.com/quick-dungeon/flare-s4/',options,{sender:'Buddy'});assert.match(url.href,/^https:\/\/think-2-thrive\.com\/q\/[A-Za-z0-9_-]{4}$/)});

test('S4 decoder preserves legacy S3 four-character challenge links',()=>{const old=encodeS3Code({roomId:fixture.id,enemyTypes:['goblin','skeleton','none'],potion:true,targetHp:50}),decoded=decodeGauntletCode(old);assert.equal(decoded.codeVersion,1);assert.equal(decoded.trap,false);assert.equal(decoded.targetHp,50)});
