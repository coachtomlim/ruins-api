import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync(new URL('../public/flare-s8a/tokens.css',import.meta.url),'utf8');

test('mobile tokens preserve readable text and large actions',()=>{
  assert.match(css,/--dr-body-size:16px/);
  assert.match(css,/--dr-primary-min-height:56px/);
  assert.match(css,/--dr-secondary-min-height:52px/);
  assert.match(css,/--dr-tab-min-height:48px/);
  assert.match(css,/safe-area-inset-top/);
  assert.match(css,/safe-area-inset-bottom/);
});
