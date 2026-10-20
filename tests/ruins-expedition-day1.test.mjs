import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {parseGateCRoom,canonicalGateCText,DAY1_HASHES} from '../public/ruins-expedition/day1-content.mjs';
import {createDay1State,applyDay1Command,DAY1_SOURCE} from '../public/ruins-expedition/day1-state.mjs';
import {createDay1MemoryStore} from '../public/ruins-expedition/day1-store.mjs';
const src=resolve(dirname(fileURLToPath(import.meta.url)),'../public/ruins-expedition/authority');
const maps={};
for(const n of [1,2]){const buf=readFileSync(resolve(src,`gate_c_room_0${n}.txt`));maps[n]=parseGateCRoom(buf.toString('utf8'));test(`authored Room ${n} SHA-256 matches accepted Gate C`,()=>assert.equal(createHash('sha256').update(canonicalGateCText(buf.toString('utf8'))).digest('hex'),DAY1_HASHES[n]));}
test('Windows CRLF checkout preserves accepted source hash and parser semantics',()=>{
 const lf=canonicalGateCText(readFileSync(resolve(src,'gate_c_room_01.txt'),'utf8')),crlf=lf.replaceAll('\n','\r\n');
 assert.equal(createHash('sha256').update(canonicalGateCText(crlf)).digest('hex'),DAY1_HASHES[1]);
 assert.equal(parseGateCRoom(crlf).title,'Gate C 01: Discovery Altar');
});
let serial=0;
function cmd(state,type,fields={}){return {id:'unit-'+(++serial),expectedRevision:state.revision,type,...fields}}
function go(state,type,fields={}){return applyDay1Command(state,cmd(state,type,fields),maps).state}
function readyRoom2(){let s=createDay1State();s=go(s,'DISCOVER_ALTAR');for(let i=0;i<3;i++)s=go(s,'MOVE',{direction:'right'});s=go(s,'ENTER_ROOM2');return s}
function defeated(){let s=readyRoom2();for(let i=0;i<2;i++)s=go(s,'MOVE',{direction:'right'});for(let i=0;i<3;i++)s=go(s,'ATTACK_ZOMBIE');return s}
function chestClaimed(){let s=defeated();s=go(s,'MOVE',{direction:'right'});return go(s,'CLAIM_ROOM2_CHEST')}
test('preserve exact authored room 1 altar, exit and room 2 zombie/chest coordinates',()=>{
 assert.equal(maps[1].title,'Gate C 01: Discovery Altar');assert.ok(maps[1].events.some(e=>e.location==='2,3,3,3'&&e.setStatus==='gate_c_discovery'));
 assert.ok(maps[1].events.some(e=>e.intermap==='maps/gate_c_room_02.txt,1,4'));
 assert.ok(maps[2].enemies.some(e=>e.category==='zombie'&&e.location==='4,4,1,1'));
 assert.ok(maps[2].events.some(e=>e.setStatus==='gate_c_r2_reward'&&e.loot==='loot/chest_level_1.txt'));
});
test('exit without altar cannot be entered',()=>{let s=createDay1State();for(let i=0;i<3;i++)s=go(s,'MOVE',{direction:'right'});assert.throws(()=>go(s,'ENTER_ROOM2'),/ALTAR_REQUIRED/)});
test('obstacles and forbidden positions enforce authored collision',()=>{let s=createDay1State();s=go(s,'MOVE',{direction:'left'});assert.throws(()=>go(s,'MOVE',{direction:'left'}),/BLOCKED_TILE/);assert.throws(()=>go(s,'MOVE',{direction:'upRight'}),/BAD_DIRECTION/)});
test('recovered authored room transition retains hero and identity and blocks Room 3',()=>{const s=readyRoom2();assert.equal(s.currentRoom,2);assert.equal(s.hero.x,1);assert.equal(s.hero.y,4);assert.equal(s.flags.gate_c_discovery,true);assert.equal(s.dayState[2],'LOCKED');assert.equal(s.checkpoint,'day1-room2-entry');assert.throws(()=>go(s,'ENTER_ROOM2'),/WRONG_ROOM/)});
test('zombie encounter requires spatial approach, fixed HP60; defeat XP2 only once',()=>{let s=readyRoom2();assert.throws(()=>go(s,'ATTACK_ZOMBIE'),/ENEMY_OUT_OF_RANGE/);for(let i=0;i<2;i++)s=go(s,'MOVE',{direction:'right'});for(let i=0;i<3;i++)s=go(s,'ATTACK_ZOMBIE');assert.equal(s.encounter.zombie.hp,0);assert.equal(s.hero.xp,2);assert.equal(s.hero.hp,90);assert.equal(Object.keys(s.claimedLoot).length,1);assert.throws(()=>go(s,'ATTACK_ZOMBIE'),/ENCOUNTER_ALREADY_CLEARED/)});
test('chest requires zombie clear and spatial contact, never rolls twice',()=>{let s=readyRoom2();assert.throws(()=>go(s,'CLAIM_ROOM2_CHEST'),/ZOMBIE_NOT_DEFEATED/);s=defeated();assert.throws(()=>go(s,'CLAIM_ROOM2_CHEST'),/NOT_AT_CHEST/);s=go(s,'MOVE',{direction:'right'});s=go(s,'CLAIM_ROOM2_CHEST');const gold=s.hero.gold;const count=Object.keys(s.claimedLoot).length;
 s=go(s,'CLAIM_ROOM2_CHEST');assert.equal(s.hero.gold,gold);assert.equal(Object.keys(s.claimedLoot).length,count);assert.equal(s.claimedLoot[DAY1_SOURCE.chest].source,'loot/chest_level_1.txt');});
test('operation-id replay is identical with no extra revision; altered reuse rejects',()=>{let s=chestClaimed();const action=cmd(s,'CLAIM_ROOM2_CHEST');const first=applyDay1Command(s,action,maps);const replay=applyDay1Command(first.state,action,maps);assert.equal(replay.state,first.state);assert.equal(replay.receipt.duplicate,true);assert.equal(first.receipt.revision,replay.receipt.revision);assert.throws(()=>applyDay1Command(first.state,{...action,type:'MOVE',direction:'left'},maps),/OPERATION_ID_PAYLOAD_MISMATCH/)});
test('stale multi-tab revision rejected before claim or move',()=>{const s=readyRoom2(),first=cmd(s,'MOVE',{direction:'right'}),second=cmd(s,'MOVE',{direction:'down'});const a=applyDay1Command(s,first,maps);assert.throws(()=>applyDay1Command(a.state,second,maps),/REVISION_CONFLICT/)});
test('settlement is terminal, Day 2 stays locked and reward cannot be farmed',()=>{let s=chestClaimed();const settled=go(s,'SETTLE_DAY1');assert.equal(settled.status,'AWAITING_DAY');assert.equal(settled.dayState[1],'SETTLED');assert.equal(settled.dayState[2],'LOCKED');assert.equal(settled.checkpoint,'day1-settled-room2');assert.equal(settled.hero.gold,30);assert.throws(()=>go(settled,'CLAIM_ROOM2_CHEST'),/DAY_ALREADY_SETTLED/);assert.throws(()=>go(settled,'MOVE',{direction:'right'}),/DAY_ALREADY_SETTLED/)});
test('settlement requires claimed chest (not merely defeated zombie)',()=>assert.throws(()=>go(defeated(),'SETTLE_DAY1'),/CHEST_NOT_CLAIMED/));
test('memory reference store restores same checkpoint and receipts without reset',async()=>{const store=createDay1MemoryStore(chestClaimed());const first=await store.load();const op=cmd(first,'SETTLE_DAY1');const result=await store.dispatch(op,maps);assert.equal((await store.load()).revision,result.state.revision);const duplicate=await store.dispatch(op,maps);assert.equal(duplicate.receipt.duplicate,true);assert.equal((await store.load()).hero.gold,30)});
test('failed command leaves persisted state and revision unchanged',async()=>{const store=createDay1MemoryStore();const first=await store.load();await assert.rejects(store.dispatch(cmd(first,'ENTER_ROOM2'),maps),/ALTAR_REQUIRED/);assert.deepEqual(await store.load(),first)});
test('reward fixture explicitly nontransferable and live policy undecided',()=>{const s=chestClaimed();assert.equal(s.policy.kind,'LOCAL_NONTRANSFERABLE');assert.equal(s.policy.calendar,'UNRESOLVED');assert.equal(s.claimedLoot[DAY1_SOURCE.chest].fixture,true)});
