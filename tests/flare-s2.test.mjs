import test from 'node:test';import assert from 'node:assert/strict';
import {gridPath,deriveSlots,buildChallenge,encodeChallenge,decodeChallenge,builderScore} from '../public/flare-s2/core.mjs';
function map(){const w=12,h=12,c=Array(w*h).fill(0);for(let y=2;y<10;y++)c[y*w+6]=1;c[6*w+6]=0;return{width:w,height:h,collision:c};}
const catalog={rules:'web-flare-0.2.0',heroes:{warrior:{}},enemies:{goblin:{cost:20},skeleton:{cost:30}},items:{'small-potion':{cost:15}}};
test('path detours through legal gap',()=>{const p=gridPath(map(),[1,10],[10,1]);assert.ok(p);assert.ok(p.some(([x,y])=>x===6&&y===6));});
test('slots are distinct and useful',()=>{const s=deriveSlots(map(),3);const all=[s.spawn,s.exit,...s.enemySlots,s.potion].map(p=>p.join(','));assert.equal(new Set(all).size,all.length);assert.ok(s.pathLength>8);});
test('challenge is deterministic and budgeted',()=>{const a=buildChallenge({roomId:'r1',roomTitle:'Room',enemyTypes:['goblin','skeleton'],potion:true,targetHp:50,catalog,map:map()});const b=buildChallenge({roomId:'r1',roomTitle:'Room',enemyTypes:['goblin','skeleton'],potion:true,targetHp:50,catalog,map:map()});assert.equal(a.challenge.id,b.challenge.id);assert.equal(a.spent,65);assert.equal(a.remaining,35);});
test('overspend is rejected',()=>assert.throws(()=>buildChallenge({roomId:'r1',enemyTypes:['skeleton','skeleton','skeleton'],potion:true,targetHp:50,catalog,map:map(),budget:90}),/Budget exceeded/));
test('share token round trips',()=>{const x={a:1,b:'hello',c:[2,3]};assert.deepEqual(decodeChallenge(encodeChallenge(x)),x);});
test('builder score rewards close prediction',()=>{assert.equal(builderScore('cleared',52,50),96);assert.equal(builderScore('dead',0,10),80);assert.equal(builderScore('blocked',50,50),0);});
