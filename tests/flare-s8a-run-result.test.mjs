import test from 'node:test';
import assert from 'node:assert/strict';
import {TERMINAL_RUN_STATUSES,isTerminalRunStatus,validateTerminalResult,runOutcomeKind} from '../public/flare-s8a/run-result.mjs';

test('recognized terminal statuses are explicit',()=>{
  assert.deepEqual(TERMINAL_RUN_STATUSES,['cleared','dead','blocked','timeout']);
  for(const status of TERMINAL_RUN_STATUSES)assert.equal(isTerminalRunStatus(status),true);
  assert.equal(isTerminalRunStatus('running'),false);
  assert.equal(isTerminalRunStatus('mystery'),false);
});

test('unknown result cannot reach reward success path',()=>{
  assert.throws(()=>validateTerminalResult({status:'mystery'}));
  assert.equal(runOutcomeKind({status:'cleared'}),'success');
  assert.equal(runOutcomeKind({status:'dead'}),'failed');
});
