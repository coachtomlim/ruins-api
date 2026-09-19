import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyLoginView,normalizeDailyLoginStatus} from '../public/flare-s8b/daily-login.mjs';

const base=overrides=>({
  reward_day:'2026-09-19',
  claimed_today:false,
  current_streak_day:0,
  next_streak_day:1,
  claimable_gold:5,
  next_reset_at:'2026-09-20T00:00:00Z',
  ...overrides
});

test('fresh daily bonus is 5 Gold on day 1',()=>{
  const vm=dailyLoginView(base());
  assert.equal(vm.claimableGold,5);
  assert.equal(vm.streakLabel,'DAY 1 OF 7');
  assert.equal(vm.actionLabel,'CLAIM 5 GOLD');
  assert.equal(vm.actionDisabled,false);
});

test('day 7 daily bonus includes the 10 Gold streak bonus',()=>{
  const vm=dailyLoginView(base({current_streak_day:6,next_streak_day:7,claimable_gold:15}));
  assert.equal(vm.actionLabel,'CLAIM 15 GOLD');
  assert.equal(vm.streakLabel,'DAY 7 OF 7');
  assert.match(vm.detail,/\+10 bonus Gold/);
});

test('claimed state cannot expose another claimable reward',()=>{
  const vm=dailyLoginView(base({
    claimed_today:true,current_streak_day:4,next_streak_day:5,claimable_gold:0
  }));
  assert.equal(vm.actionLabel,'CLAIMED TODAY');
  assert.equal(vm.actionDisabled,true);
  assert.equal(vm.streakLabel,'DAY 4 OF 7');
});

test('daily login status fails closed on impossible values',()=>{
  assert.throws(()=>normalizeDailyLoginStatus(base({claimable_gold:10})),/CLAIMABLE_VALUE/);
  assert.throws(()=>normalizeDailyLoginStatus(base({next_streak_day:7,claimable_gold:5})),/DAY7_VALUE/);
  assert.throws(()=>normalizeDailyLoginStatus(base({claimed_today:true,claimable_gold:5})),/CLAIMED_VALUE/);
  assert.throws(()=>normalizeDailyLoginStatus(base({reward_day:'today'})),/REWARD_DAY/);
});
