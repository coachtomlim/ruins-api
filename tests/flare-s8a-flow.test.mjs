import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {encodeInviteCode,decodeInviteCode,makeInviteUrl,inviteCodeFromLocation,safeSender,inviteSender} from '../public/flare-s8a/flow.mjs';

const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));

test('S8A invite keeps the accepted four-character runner-target encoding',()=>{
  const invite={runnerId:'warrior-l3',targetHp:60};
  const code=encodeInviteCode(invite,model);
  assert.equal(code,'UvVY');
  assert.equal(code.length,4);
  const decoded=decodeInviteCode(code,model);
  assert.deepEqual({runnerId:decoded.runnerId,targetHp:decoded.targetHp},invite);
  assert.doesNotMatch(JSON.stringify(decoded),/room|enemy|trap|support|reward|account/i);
});

test('S8A public invites use isolated /m route and preserve sender separately',()=>{
  const invite={runnerId:'warrior-l3',targetHp:60};
  const url=makeInviteUrl('https://think-2-thrive.com/quick-dungeon/flare-s8a/',invite,model,{sender:'Tom'});
  assert.equal(url.href,'https://think-2-thrive.com/m/UvVY?from=Tom');
  assert.equal(inviteCodeFromLocation({pathname:'/m/UvVY',search:'?from=Tom'}),'UvVY');
  assert.equal(inviteSender('?from=%3CTom%3E'),'Tom');
  assert.equal(safeSender(''),'Buddy');
});

test('S8A local preview also resolves the m-route contract',()=>{
  const invite={runnerId:'warrior-l1',targetHp:50};
  const url=makeInviteUrl('http://127.0.0.1:4178/quick-dungeon/flare-s8a/',invite,model);
  assert.match(url.pathname,/^\/m\/[A-Za-z0-9_-]{4}$/);
  assert.equal(inviteCodeFromLocation({pathname:url.pathname,search:''}),url.pathname.split('/').pop());
});

test('invalid invite codes fail closed',()=>{
  assert.throws(()=>decodeInviteCode('abc',model));
  assert.throws(()=>decodeInviteCode('!!!!',model));
  assert.throws(()=>encodeInviteCode({runnerId:'warrior-l3',targetHp:61},model));
});
