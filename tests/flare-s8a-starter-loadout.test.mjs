import test from 'node:test';
import assert from 'node:assert/strict';
import {STARTER_CLUB,STARTER_SHIELD,rookieStarterProgression,rookieStarterSnapshot} from '../public/flare-s8a/starter-loadout.mjs';

test('starter runner gets attack from club and defense from wooden shield',()=>{
  const snap=rookieStarterSnapshot();
  assert.deepEqual(snap.base,{hp:100,attack:8,defense:0});
  assert.deepEqual(snap.effective,{hp:100,attack:12,defense:1});
  assert.equal(STARTER_CLUB.modifiers.attack,4);
  assert.equal(STARTER_SHIELD.modifiers.defense,1);
});

test('starter has no armor pieces so first gear acquisition remains meaningful',()=>{
  const gear=rookieStarterProgression().equipment;
  assert.equal(gear.weapon.id,'wooden-club');
  assert.equal(gear.shield.id,'wooden-shield');
  for(const slot of ['head','chest','hands','legs','feet'])assert.equal(gear[slot],null,slot);
});

test('starter visual provenance is stock Flare',()=>{
  assert.match(STARTER_CLUB.flareSource,/fantasycore\/items\/base\/weapons\/melee\/club\.txt/);
  assert.match(STARTER_SHIELD.flareSource,/fantasycore\/items\/base\/shields\/wood\.txt/);
  assert.equal(STARTER_CLUB.gfx,'club');
  assert.equal(STARTER_SHIELD.gfx,'buckler');
});
