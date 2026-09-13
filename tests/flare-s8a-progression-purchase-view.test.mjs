import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgressionCatalog} from '../public/flare-s8a/progression-catalog.mjs';
import {buildProgressionPurchaseView} from '../public/flare-s8a/progression-purchase-view.mjs';

const catalog=normalizeProgressionCatalog({version:1,statUpgrades:[{id:'hp-1',stat:'hp',amount:10,goldCost:10}],equipment:[{id:'blade-1',slot:'weapon',name:'Iron Blade',goldCost:20,modifiers:{attack:3}}]});

test('purchase confirmation shows authoritative quote inputs without mutating anything',()=>{
  const vm=buildProgressionPurchaseView({catalog,offerId:'blade-1',goldBalance:25});
  assert.equal(vm.title,'CONFIRM UPGRADE');
  assert.equal(vm.label,'Iron Blade');
  assert.equal(vm.currentGold,25);
  assert.equal(vm.cost,20);
  assert.equal(vm.remainingGold,5);
  assert.equal(vm.primaryAction,'BUY ITEM');
});

test('insufficient Gold converts purchase action into earn-more state',()=>{
  const vm=buildProgressionPurchaseView({catalog,offerId:'hp-1',goldBalance:5});
  assert.equal(vm.affordable,false);
  assert.equal(vm.title,'NOT ENOUGH GOLD');
  assert.equal(vm.primaryAction,'EARN MORE GOLD');
});
