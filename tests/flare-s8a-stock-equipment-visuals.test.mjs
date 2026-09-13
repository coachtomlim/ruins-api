import test from 'node:test';
import assert from 'node:assert/strict';
import {FLARE_STOCK_PIN,STOCK_EQUIPMENT_VISUALS,stockEquipmentVisual} from '../public/flare-s8a/stock-equipment-visuals.mjs';

test('starter club and wooden shield use pinned Flare visual identities',()=>{
  assert.equal(FLARE_STOCK_PIN,'2ef474f5f5f368628bc526f9e56f936dac743e49');
  assert.equal(stockEquipmentVisual('wooden-club').gfx,'club');
  assert.equal(stockEquipmentVisual('wooden-shield').gfx,'buckler');
});

test('leather family exposes each individual armor slot',()=>{
  assert.equal(STOCK_EQUIPMENT_VISUALS['leather-hood'].slot,'head');
  assert.equal(STOCK_EQUIPMENT_VISUALS['leather-chest'].slot,'chest');
  assert.equal(STOCK_EQUIPMENT_VISUALS['leather-gloves'].slot,'hands');
  assert.equal(STOCK_EQUIPMENT_VISUALS['leather-pants'].slot,'legs');
  assert.equal(STOCK_EQUIPMENT_VISUALS['leather-boots'].slot,'feet');
});
