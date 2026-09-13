import test from 'node:test';
import assert from 'node:assert/strict';
import {mobilePolicy} from '../public/flare-s8a/mobile-policy.mjs';

test('phone policy keeps readable type and large primary actions',()=>{
  for(const [width,height] of [[360,800],[390,844],[430,932]]){
    const p=mobilePolicy({width,height});
    assert.equal(p.orientation,'portrait');
    assert.ok(p.bodyTextMinPx>=16);
    assert.ok(p.primaryActionMinPx>=52);
    assert.equal(p.avoidDocumentScroll,true);
    assert.equal(p.panelHeight,'100dvh');
  }
});

test('small portrait devices enter compact layout without shrinking touch targets',()=>{
  const p=mobilePolicy({width:360,height:700});
  assert.equal(p.compact,true);
  assert.ok(p.primaryActionMinPx>=52);
  assert.ok(p.categoryTabsMinPx>=48);
});
