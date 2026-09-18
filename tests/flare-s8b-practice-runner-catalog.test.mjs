import test from 'node:test';
import assert from 'node:assert/strict';
import {applyPracticeRunnerToCatalog} from '../public/flare-s8b/practice-runner-catalog.mjs';

const baseCatalog=()=>({
  heroes:{warrior:{maxHp:100,damage:12,armor:1,speed:4,range:1}},
  enemies:{goblin:{maxHp:10,damage:2,armor:0}},
  items:{}
});

test('practice catalog uses authoritative effective Runner stats without mutating the base catalog',()=>{
  const base=baseCatalog();
  const snapshot={mode:'PRACTICE',rewardSettlement:false,effectiveStats:{hp:105,attack:13,defense:2}};
  const catalog=applyPracticeRunnerToCatalog(base,snapshot);
  assert.deepEqual(catalog.heroes.warrior,{maxHp:105,damage:13,armor:2,speed:4,range:1});
  assert.deepEqual(base.heroes.warrior,{maxHp:100,damage:12,armor:1,speed:4,range:1});
  assert.deepEqual(catalog.enemies,base.enemies);
});

test('practice catalog fails closed without an explicit no-reward practice snapshot',()=>{
  assert.throws(()=>applyPracticeRunnerToCatalog(baseCatalog(),null),/PRACTICE_RUNNER_SNAPSHOT_REQUIRED/);
  assert.throws(()=>applyPracticeRunnerToCatalog(baseCatalog(),{mode:'PRACTICE',rewardSettlement:true,effectiveStats:{hp:100,attack:12,defense:1}}),/PRACTICE_RUNNER_SNAPSHOT_REQUIRED/);
  assert.throws(()=>applyPracticeRunnerToCatalog({heroes:{}},{mode:'PRACTICE',rewardSettlement:false,effectiveStats:{hp:100,attack:12,defense:1}}),/PRACTICE_BASE_CATALOG_REQUIRED/);
});
