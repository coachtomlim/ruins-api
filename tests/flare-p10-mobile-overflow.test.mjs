import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');

test('P10 §8 fix: practice.css resets html/body margin (was missing, causing a real 4px horizontal overflow at mobile widths)',async()=>{
  const css=await read('public/flare-s8b/practice.css');
  const accountCss=await read('public/flare-s8b/account.css');
  assert.match(css,/html,body\{margin:0/,'practice.css must reset the UA default 8px body margin, the same way account.css already does');
  assert.match(accountCss,/html,body\{margin:0/);
});
