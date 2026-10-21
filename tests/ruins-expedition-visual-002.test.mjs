import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFile(resolve(root,path),'utf8');
const [html,app,css,art,provenance]=await Promise.all([
  read('public/ruins-expedition/index.html'),read('public/ruins-expedition/day1-app.mjs'),
  read('public/ruins-expedition/day1-visual-002.css'),read('public/ruins-expedition/day1-art.mjs'),
  read('docs/ruins/RUINS_DAILY_EXPEDITION_001B_VISUAL_002_ASSET_PROVENANCE.md')
]);

test('Visual 002 renders recognizable pinned Flare actors and authored props',()=>{
  assert.match(art,/loadS3ActorPack/);assert.match(art,/loadLevel2ActorPack/);
  assert.match(art,/tileset_cave\.png/);assert.match(art,/dungeon_door_left\.png/);
  assert.match(art,/altarDormant/);assert.match(art,/altarActive/);
  assert.match(art,/chestClosed/);assert.match(art,/chestOpen/);
  assert.doesNotMatch(app,/function marker\(/);assert.doesNotMatch(app,/fillText\(['"](?:H|Z|✶|◆)/);
});

test('asset provenance fixes every runtime source to the accepted stock pin',()=>{
  assert.match(provenance,/2ef474f5f5f368628bc526f9e56f936dac743e49/);
  assert.match(provenance,/CC-BY-SA 3\.0/);assert.match(provenance,/warrior/);
  assert.match(provenance,/zombie/);assert.match(provenance,/dungeon_door_right\.png/);
});

test('completion view gives a truthful local Day 1 receipt',()=>{
  for(const phrase of ['DAY 1 COMPLETE','2 / 10','ALTAR','ZOMBIE','CHEST','+30 Gold · +2 XP','Rewards do not transfer']) assert.ok(html.includes(phrase),`missing completion copy: ${phrase}`);
  assert.match(app,/settledThisSession=true/);assert.match(app,/Checkpoint restored\. Day 1 remains complete/);
  assert.match(css,/\.completion\[hidden\]\{display:none\}/);
});

test('player-facing copy contains no implementation or adjudication language',()=>{
  assert.doesNotMatch(html,/revision|Gate C|visual hold|diagnostic/i);
  const journal=app.slice(app.indexOf("$('journal').addEventListener"),app.indexOf("$('closeJournal')"));
  assert.doesNotMatch(journal,/revision|Gate C|Owner policy|backend approval|proof-only/i);
});

test('mobile controls meet the 44px target and reduced motion is respected',()=>{
  assert.match(css,/#sound\{[^}]*min-height:44px/);
  assert.match(css,/\.dpad button\{[^}]*width:44px;height:44px/);
  assert.match(css,/#journal\{[^}]*min-height:44px/);
  assert.match(css,/\.modalHeader button\{[^}]*min-height:44px/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('feedback occupies an opaque non-overlapping layout band',()=>{
  assert.match(html,/<div class="feedback">/);
  assert.match(css,/\.feedback\{[^}]*background:#0b0f12/);
  assert.match(css,/\.notice\{position:static/);
  assert.doesNotMatch(app,/Isometric source layout|coordinates and collision/);
});

test('existing audio manager and semantic event bridge remain in service',()=>{
  assert.match(app,/createAudioManager/);
  for(const event of ['DOOR_OPEN','ZOMBIE_HIT','ZOMBIE_DIE','PLAYER_HIT','GOLD_PICKUP','ITEM_PICKUP']) assert.match(app,new RegExp(event));
});
