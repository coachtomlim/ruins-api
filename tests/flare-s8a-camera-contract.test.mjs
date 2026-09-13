import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraDelta,cameraMateriallyChanged} from './helpers/s8a-camera-proof.mjs';

test('overview proof rejects a no-op camera toggle',()=>{
  const follow={s:.55,x:120,y:80};
  const same={s:.55,x:120,y:80};
  assert.equal(cameraMateriallyChanged(follow,same),false);
});

test('overview proof accepts material scale or translation changes',()=>{
  const follow={s:.55,x:120,y:80};
  assert.equal(cameraMateriallyChanged(follow,{s:.50,x:120,y:80}),true);
  assert.equal(cameraMateriallyChanged(follow,{s:.55,x:132,y:80}),true);
  const d=cameraDelta(follow,{s:.50,x:132,y:80});
  assert.ok(d.scaleDelta>=.02);
  assert.ok(d.translationDelta>=8);
});
