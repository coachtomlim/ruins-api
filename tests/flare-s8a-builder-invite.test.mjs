import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildChallengeInvite} from '../public/flare-s8a/builder-invite.mjs';

const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));

test('sender builder creates isolated m invite with precision-goal share copy',()=>{
  const built=buildChallengeInvite({baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8a/',sender:'Tom',runnerId:'warrior-l3',targetHp:60,model});
  assert.equal(built.code,'UvVY');
  assert.equal(built.url,'https://think-2-thrive.com/m/UvVY?from=Tom');
  assert.match(built.share.text,/exit near 60% HP/i);
  assert.doesNotMatch(JSON.stringify(built.invite),/room|enemy|trap|support|reward/i);
});
