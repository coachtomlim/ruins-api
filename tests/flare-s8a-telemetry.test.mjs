import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryTelemetry} from '../public/flare-s8a/telemetry.mjs';

test('telemetry records controlled product events',()=>{
  const t=createMemoryTelemetry();
  t.emit('invite_viewed',{runner_id:'warrior-l1',target_hp:50});
  t.emit('camera_mode_changed',{mode:'overview'});
  assert.equal(t.events.length,2);
  assert.deepEqual(t.events[0],{name:'invite_viewed',payload:{runner_id:'warrior-l1',target_hp:50}});
});

test('telemetry strips sensitive or identifying keys',()=>{
  const t=createMemoryTelemetry();
  const event=t.emit('run_completed',{status:'cleared',senderName:'Tom',email:'x@example.com',token:'secret',score:98});
  assert.deepEqual(event.payload,{status:'cleared',score:98});
});

test('unknown telemetry events fail closed',()=>{
  const t=createMemoryTelemetry();
  assert.throws(()=>t.emit('send_password',{value:'no'}));
});
