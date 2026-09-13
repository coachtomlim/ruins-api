import test from 'node:test';
import assert from 'node:assert/strict';
import {transitionGearJourney,canTransitionGear} from '../public/flare-s8a/gear-journey.mjs';

test('new gear reveal can equip or keep item',()=>{
  assert.equal(transitionGearJourney('home','SHOW_NEW_GEAR'),'reveal');
  assert.equal(transitionGearJourney('reveal','EQUIP'),'detail');
  assert.equal(transitionGearJourney('reveal','KEEP'),'home');
});

test('slot browsing remains bounded on mobile',()=>{
  assert.equal(transitionGearJourney('home','OPEN_SLOT'),'slot');
  assert.equal(transitionGearJourney('slot','OPEN_ITEM'),'detail');
  assert.equal(transitionGearJourney('detail','BACK'),'slot');
});

test('invalid shortcuts fail closed',()=>{
  assert.equal(canTransitionGear('home','EQUIPPED'),false);
  assert.throws(()=>transitionGearJourney('home','EQUIPPED'));
});
