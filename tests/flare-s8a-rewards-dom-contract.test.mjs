import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const readHtml=()=>readFile(new URL('../public/flare-s8a/challenge.html',import.meta.url),'utf8');
const readMjs=()=>readFile(new URL('../public/flare-s8a/challenge.mjs',import.meta.url),'utf8');

// Live production failure (think-2-thrive.com, correlated Friend Feedback run, 2026-09-29):
// "TypeError: Cannot set properties of null (setting 'textContent')" at
// $('heroReward').querySelector('span').textContent = m.heroReward.label
// The anonymous nested <span> inside #heroReward was missing at render time, crashing renderCurrent
// before the correlated result receipt could ever be built/sent. This test locks in the fix: the
// Hero reward label has its own stable id, every Rewards render target is contract-checked, and a
// missing target throws a precise diagnostic instead of a generic null-property TypeError.

test('Rewards DOM contract: every required render target exists exactly once with a stable id', async () => {
  const html = await readHtml();
  const requiredIds = [
    'heading-rewards', 'resultTarget', 'resultFinished', 'resultDifference', 'resultScore',
    'heroRewardLabel', 'heroRewardGold', 'builderRewardGold', 'resultReceiptStatus', 'retryResultReceipt',
  ];
  for (const id of requiredIds) {
    const matches = html.match(new RegExp(`id="${id}"`, 'g')) || [];
    assert.equal(matches.length, 1, `expected exactly one id="${id}" in challenge.html, found ${matches.length}`);
  }
});

test('Hero reward label is an explicit stable id, not an anonymous nested span lookup', async () => {
  const html = await readHtml();
  const mjs = await readMjs();
  assert.match(html, /<span id="heroRewardLabel">/);
  assert.doesNotMatch(mjs, /querySelector\('span'\)/);
  assert.doesNotMatch(mjs, /\$\('heroReward'\)\.querySelector/);
  assert.match(mjs, /requiredElement\('heroRewardLabel'\)\.textContent=m\.heroReward\.label/);
});

test('renderCurrent uses an explicit DOM contract helper that throws a precise diagnostic', async () => {
  const mjs = await readMjs();
  assert.match(mjs, /function requiredElement\(id\)\{const el=\$\(id\);if\(!el\)throw new Error\(`S8A_DOM_CONTRACT_MISSING:\$\{id\}`\);return el;\}/);
  assert.match(mjs, /const REWARDS_DOM_CONTRACT=\[/);
  for (const id of ['heading-rewards','resultTarget','resultFinished','resultDifference','resultScore','heroRewardLabel','heroRewardGold','builderRewardGold','resultReceiptStatus','retryResultReceipt']) {
    assert.match(mjs, new RegExp(`'${id}'`));
  }
});

test('completeRuntime prepares the correlated receipt payload before attempting Rewards render, and always attempts submission', async () => {
  const mjs = await readMjs();
  const start = mjs.indexOf('completeRuntime(result,score){');
  assert.notEqual(start, -1, 'completeRuntime not found');
  const end = mjs.indexOf('},replayRuntime', start);
  const body = mjs.slice(start, end);
  const payloadIdx = body.indexOf('lastReceiptPayload=buildResultReceipt');
  const showIdx = body.indexOf('show()');
  const finallyIdx = body.indexOf('finally');
  const sendIdx = body.indexOf('sendResultReceipt()');
  assert.ok(payloadIdx !== -1 && showIdx !== -1 && finallyIdx !== -1 && sendIdx !== -1, 'expected payload build, guarded show(), and a finally-based receipt send');
  assert.ok(payloadIdx < showIdx, 'receipt payload must be built before the Rewards render is attempted');
  assert.ok(showIdx < finallyIdx && finallyIdx < sendIdx, 'receipt submission must run in a finally block after the guarded render attempt');
  assert.match(body, /try\{show\(\);\}catch\(error\)\{console\.error\(error\);\}finally\{void sendResultReceipt\(\);\}/);
});
