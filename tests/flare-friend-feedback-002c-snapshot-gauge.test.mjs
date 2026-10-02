import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildEstimateGaugeViewModel} from '../public/flare-s8a/estimate-gauge-view-model.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

// --- GAUGE VIEW MODEL ---

test('gauge target marker is fixed at the challenged target regardless of estimate',()=>{
  const low=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:20});
  const high=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:95});
  assert.equal(low.targetPercent,60);
  assert.equal(high.targetPercent,60);
});

test('gauge estimate marker reflects the current encounter and is clamped to 0-100',()=>{
  const normal=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:68});
  assert.equal(normal.estimatePercent,68);
  const clampedHigh=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:140});
  assert.equal(clampedHigh.estimatePercent,100);
  const clampedLow=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:-20});
  assert.equal(clampedLow.estimatePercent,0);
});

test('gauge has no estimate before an encounter can be evaluated (invitation screen)',()=>{
  const noEstimate=buildEstimateGaugeViewModel({targetHp:60});
  assert.equal(noEstimate.hasEstimate,false);
  assert.equal(noEstimate.estimatePercent,null);
  assert.equal(noEstimate.guidance,'');
});

test('gauge zones: too harsh, near target, too gentle match the existing targetFitCue classifier',()=>{
  const harsh=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:30});
  assert.equal(harsh.zone,'harsh');
  assert.match(harsh.guidance,/Too harsh\. Add support/);
  const near=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:58});
  assert.equal(near.zone,'close');
  assert.match(near.guidance,/Near target/);
  const gentle=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:85});
  assert.equal(gentle.zone,'gentle');
  assert.match(gentle.guidance,/Too gentle\. Add danger/);
});

test('gauge estimate label shows a rounded percent, not false precision',()=>{
  const vm=buildEstimateGaugeViewModel({targetHp:60,estimatedHpPercent:67.8});
  assert.equal(vm.estimateLabel,'~68% HP');
});

// --- MARKUP: misleading 3-button panel replaced with a real gauge ---

test('the old target-meter (TOO HARSH | 60% TARGET | TOO GENTLE as three equal controls) is gone',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.doesNotMatch(html,/class="target-meter"/);
  assert.doesNotMatch(html,/id="targetMarker"/);
});

test('invitation and customize screens each have a real gauge with a fixed target marker',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="inviteGaugeTarget"/);
  assert.match(html,/id="customizeGaugeTarget"/);
  assert.match(html,/id="customizeGaugeEstimate"/);
  assert.match(html,/id="customizeGaugeEstimateLabel"/);
  assert.match(html,/id="customizeGaugeGuidance"/);
});

test('customize screen gauge updates on monster/trap/support change via the existing renderControls change listener',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/control\.addEventListener\('change',\(\)=>\{session=setEncounter\(session,encounter\(\)\);show\(\);\}\)/);
  assert.match(mjs,/buildEstimateGaugeViewModel\(\{targetHp:invite\.targetHp,estimatedHpPercent:estimateEncounter/);
});

test('the gauge is rendered as an output (no input/slider element), driven only by estimateEncounter/calibrateEncounter',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const gaugeBlock=html.slice(html.indexOf('id="customizeGauge"'),html.indexOf('</div></div><strong id="dungeonBudget"'));
  assert.doesNotMatch(gaugeBlock,/<input/);
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.doesNotMatch(mjs,/fetch\([^)]*openai|anthropic|ai-encounter/i);
});

// --- SNAPSHOT WIRING (Part A) ---

test('correlated boot fetches the public snapshot and resolves Runner authority before building the runtime catalog',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/fetchCorrelatedSnapshot\(\)/);
  const bootStart=mjs.indexOf('async function bootReceiver');
  const boot=mjs.slice(bootStart,mjs.indexOf('void bootReceiver();'));
  const catalogIdx=boot.indexOf('catalog=applyRunnerModel');
  const authorityIdx=boot.indexOf('runnerAuthority=resolveRunnerAuthority');
  const runnerIdx=boot.indexOf('runner=runnerSummary(model,invite.runnerId,catalog)');
  assert.ok(catalogIdx<authorityIdx && authorityIdx<runnerIdx,'authority must be resolved after the catalog exists and before runner is derived from it');
});

test('a snapshot-authoritative resolution overrides catalog HP/ATK/DEF before runner stats are derived, so inspector and runtime/combat/receipt agree',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/if\(runnerAuthority\.source==='snapshot'\)\{catalog\.heroes\.warrior\.maxHp=runnerAuthority\.maxHp;catalog\.heroes\.warrior\.damage=runnerAuthority\.attack;catalog\.heroes\.warrior\.armor=runnerAuthority\.defense;\}/);
});

test('legacy (non-correlated) links never attempt a snapshot fetch',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/if\(!publicToken\)return null;/);
});

test('a genuine snapshot-fetch failure shows a bounded retry state instead of silently inventing account stats',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/COULD NOT LOAD THIS RUNNER/);
  assert.match(mjs,/RETRY/);
  assert.doesNotMatch(mjs,/catch\(error\)\{[^}]*runnerAuthority=resolveRunnerAuthority/);
});

test('runner-authority.mjs is reused unchanged as the single source of snapshot-vs-template decision (no second implementation)',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/import \{resolveRunnerAuthority\} from '\.\/runner-authority\.mjs'/);
  assert.equal((mjs.match(/function resolveRunnerAuthority/g)||[]).length,0);
});

test('no private identifiers (ownership_id, player/account IDs) are ever read from the public snapshot client-side',async()=>{
  const [mjs,adapter]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8b/public-challenge-snapshot.mjs')]);
  for(const src of [mjs,adapter])assert.doesNotMatch(src,/ownership_id|owner_player_id|owner_runner_id|player_id|account_id/i);
});

// --- REPLAY / ACTIVITY REGRESSION (Parts J/K already landed in 002A/002B) ---

test('RUN AGAIN still carries the non-cumulative replacement copy and a fresh attempt token',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  assert.match(html,/A new run will replace your current challenge result\./);
  assert.match(mjs,/replayRuntime\(\)\{currentAttemptToken=createAttemptToken\(\);/);
});

test('Challenge Activity client still reads only current results via v2',async()=>{
  const adapter=await read('public/flare-s8b/account-adapter.mjs');
  assert.match(adapter,/get_builder_challenge_results_v2/);
  assert.doesNotMatch(adapter,/client\.rpc\('get_builder_challenge_results',/);
});
