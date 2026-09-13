import test from 'node:test';
import assert from 'node:assert/strict';
import {buildRoomCarousel} from '../public/flare-s8a/room-carousel.mjs';

const rooms=[{id:'r1',name:'Pillar Court'},{id:'r2',name:'Crossed Court'},{id:'r3',name:'Broken Gallery'}];

test('room carousel shows one room with wraparound navigation',()=>{
  const first=buildRoomCarousel({rooms,index:0});
  assert.equal(first.current.name,'Pillar Court');
  assert.equal(first.counter,'1 / 3');
  assert.equal(first.previousIndex,2);
  assert.equal(first.nextIndex,1);
  assert.equal(buildRoomCarousel({rooms,index:3}).current.id,'r1');
});

test('an unavailable room remains identified while use is disabled by state',()=>{
  const vm=buildRoomCarousel({rooms,index:1,unavailableIds:['r2']});
  assert.equal(vm.current.id,'r2');
  assert.equal(vm.available,false);
});
