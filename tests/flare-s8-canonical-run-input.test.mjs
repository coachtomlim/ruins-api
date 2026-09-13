import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalRunInput,canonicalRunInputJson} from '../public/flare-s8a/canonical-run-input.mjs';

test('canonical run input is stable across object key ordering',()=>{
  const a={runnerId:'warrior-l3',targetHp:60,roomId:'iron-labyrinth-01',rulesVersion:'s8a',encounter:{trapTypes:['spike-trap'],supportTypes:['small-potion'],enemyTypes:['goblin','skeleton','none']}};
  const b={rulesVersion:'s8a',roomId:'iron-labyrinth-01',targetHp:60,runnerId:'warrior-l3',encounter:{enemyTypes:['goblin','skeleton','none'],supportTypes:['small-potion'],trapTypes:['spike-trap']}};
  assert.equal(canonicalRunInputJson(a),canonicalRunInputJson(b));
});

test('canonical run input preserves ordered gameplay arrays',()=>{
  const a=canonicalRunInputJson({runnerId:'x',targetHp:50,roomId:'r',rulesVersion:'v',encounter:{enemyTypes:['goblin','skeleton']}});
  const b=canonicalRunInputJson({runnerId:'x',targetHp:50,roomId:'r',rulesVersion:'v',encounter:{enemyTypes:['skeleton','goblin']}});
  assert.notEqual(a,b);
});

test('canonical run input excludes UI-only fields by contract',()=>{
  const value=canonicalRunInput({runnerId:'x',targetHp:50,roomId:'r',rulesVersion:'v',encounter:{enemyTypes:[]},cameraMode:'overview',panel:'rewards'});
  assert.deepEqual(Object.keys(value),['runnerId','targetHp','roomId','encounter','rulesVersion']);
});
