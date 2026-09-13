import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync(new URL('../public/flare-s8a/panel-shell.css',import.meta.url),'utf8');

test('panel shell is viewport-bound and hides document-scale overflow',()=>{
  assert.match(css,/height:100dvh/);
  assert.match(css,/overflow:hidden/);
  assert.match(css,/grid-template-rows:auto minmax\(0,1fr\) auto/);
});

test('choice-heavy panels may scroll internally without moving primary actions',()=>{
  assert.match(css,/\.dr-panel-scroll\{[^}]*overflow:auto/);
  assert.match(css,/overscroll-behavior:contain/);
});

test('panel shell uses large buttons and three-category customization tabs',()=>{
  assert.match(css,/min-height:var\(--dr-primary-min-height\)/);
  assert.match(css,/min-height:var\(--dr-secondary-min-height\)/);
  assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
});
