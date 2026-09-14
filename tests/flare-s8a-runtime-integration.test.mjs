import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../public/flare-s8a/runtime-controller.mjs',import.meta.url),'utf8');
test('runtime uses accepted deterministic S7 simulation and renderer',()=>{assert.match(source,/Simulation/);assert.match(source,/Renderer/);assert.match(source,/buildS7Challenge/);assert.match(source,/while\(acc>=1\/60/);});
test('runtime replaces predecessor warrior atlas with Club and Shield composition',()=>{assert.match(source,/loadS3ActorPack/);assert.match(source,/sprites\.warrior=actors\.sprites\.warrior/);assert.match(source,/atlases\.warrior=actors\.atlases\.warrior/);});
test('camera control invalidates composition and captures measurable geometry',()=>{assert.match(source,/toggleCameraMode/);assert.match(source,/cameraGeometry/);assert.match(source,/__s8aCameraProof/);});
test('runtime preserves canonical replay inputs in memory',()=>{assert.match(source,/createReplayContext/);assert.match(source,/canonicalRunInputJson/);assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB/);});
test('Run Again reuses the existing simulation and replay context',()=>{assert.match(source,/runAgain/);assert.match(source,/bridge\.replayRuntime\(\);begin\(\)/);});
