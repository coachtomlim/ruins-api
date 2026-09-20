import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DAILY_TRIAL_VERSION,
  DAILY_TRIAL_REWARD_GOLD,
  DAILY_TRIAL_ENCOUNTER,
  PREFERRED_RUNNER_STATES
} from '../tools/flare-s8b-daily-trial-calibration.mjs';

test('Daily Trial v1 reward and encounter are locked for calibration',()=>{
  assert.equal(DAILY_TRIAL_VERSION,'s8b-daily-trial-001');
  assert.equal(DAILY_TRIAL_REWARD_GOLD,5);
  assert.deepEqual(DAILY_TRIAL_ENCOUNTER,{
    enemyTypes:['goblin','skeleton','none'],
    supportTypes:['small-potion'],
    trapTypes:[]
  });
});

test('Daily Trial calibration covers exactly the nine accepted PREFERRED Runner states',()=>{
  assert.equal(PREFERRED_RUNNER_STATES.length,9);
  assert.deepEqual(PREFERRED_RUNNER_STATES.map(x=>`${x.hp}/${x.attack}/${x.defense}`),[
    '100/12/1','100/12/2','100/13/1','105/12/1','105/12/2',
    '105/13/1','110/12/1','115/12/1','120/12/1'
  ]);
});

test('Daily Trial v1 solo pacing remains 5 Gold per settled trial',()=>{
  assert.equal(DAILY_TRIAL_REWARD_GOLD*7,35);
  assert.equal(45+DAILY_TRIAL_REWARD_GOLD*7,80);
});
