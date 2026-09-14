import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../public/flare-s8a/challenge.mjs',import.meta.url),'utf8');
test('receiver controller consumes prepared session and view contracts',()=>{assert.match(source,/createReceiverSession/);assert.match(source,/advanceReceiver/);assert.match(source,/buildReceiverView/);});
test('receiver controller wires novice path and optional category panels',()=>{for(const event of ['ACCEPT','USE_DUNGEON','CUSTOMIZE','DONE'])assert.match(source,new RegExp(`['"]${event}['"]`));for(const panel of ['monsters','traps','supports'])assert.match(source,new RegExp(panel));});
test('receiver config remains page-memory only',()=>{assert.doesNotMatch(source,/localStorage|sessionStorage|indexedDB|document\.cookie/);});
