import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');

// --- MISSION SCREEN: exactly 3 choices, difficulty primary, room secondary ---

test('mission screen shows a single-dungeon chooser and no longer exposes the 6-room carousel as the primary surface',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  const mission=html.slice(html.indexOf('data-screen="mission"'),html.indexOf('data-screen="customize"'));
  assert.match(mission,/id="dungeonPresets" class="dungeon-chooser"/);
  assert.match(mission,/class="mission-secondary" hidden/);
});

test('room-stage/prev/next controls still exist (ids preserved) but are demoted to secondary, hidden by default',async()=>{
  const html=await read('public/flare-s8a/challenge.html');
  assert.match(html,/id="previousRoom"/);
  assert.match(html,/id="nextRoom"/);
  assert.match(html,/id="roomPreview"/);
});

test('exactly 3 presets are addressable by the chooser (presetIndex cycles mod 3), not a 4th/5th tier',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/const presetList=\(\)=>\[dungeonPresets\.tooEasy,dungeonPresets\.justRight,dungeonPresets\.brutal\];/);
  assert.match(mjs,/presetIndex=\(presetIndex-1\+3\)%3/);
  assert.match(mjs,/presetIndex=\(presetIndex\+1\)%3/);
});

test('JUST RIGHT is the default displayed/applied preset (index 1), not locking out the other two',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/let presetIndex=1; \/\/ 0=too easy, 1=just right \(default\), 2=brutal/);
  assert.match(mjs,/\$\('presetRecommended'\)\.hidden=!preset\.recommended/);
});

test('the chooser shows difficulty label, estimated finish, room, and preset contents — not room-appearance-first — plus explicit RECOMMENDED and position indicator',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/\$\('presetEstimate'\)\.textContent=`ESTIMATED FINISH ~\$\{Math\.round\(preset\.estimatedHpPercent\)\}% HP`/);
  assert.match(mjs,/\$\('presetRoomName'\)\.textContent=roomSpec\?\.name\|\|preset\.roomId/);
  assert.match(mjs,/\$\('presetContents'\)\.textContent=names\.length\?names\.join\(' · '\):/);
  assert.match(mjs,/\$\('presetPosition'\)\.textContent=`\$\{presetIndex\+1\} \/ 3`/);
});

test('the dungeon preview uses the real governed room renderer (drawPreview), not an invented thumbnail',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/if\(roomData\)drawPreview\(\$\('presetPreview'\),roomData\.map,roomData\.tiles\)/);
});

test('explicit LEFT/RIGHT controls exist with accessible labels, no reliance on swipe/scroll',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/prev\.setAttribute\('aria-label','Previous dungeon'\)/);
  assert.match(mjs,/next\.setAttribute\('aria-label','Next dungeon'\)/);
  assert.match(mjs,/prev\.addEventListener\('click',\(\)=>\{presetIndex=\(presetIndex-1\+3\)%3;applyCurrentPreset\(\);show\(\);\}\)/);
  assert.match(mjs,/next\.addEventListener\('click',\(\)=>\{presetIndex=\(presetIndex\+1\)%3;applyCurrentPreset\(\);show\(\);\}\)/);
});

test('generic reward-cue copy is demoted to a secondary Gold line, not the primary mission rationale',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/\$\('missionRewardCue'\)\.textContent='Closer to target earns more Builder Gold\.'/);
  assert.doesNotMatch(mjs,/WIN UP TO 25 GOLD/);
});

test('runner context line connects Runner capability to the preset decision',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/\$\('missionRunnerContext'\)\.textContent=`\$\{session\.senderName\}'s Runner has \$\{runner\.hp\} HP, \$\{runner\.attack\} ATK and \$\{runner\.defense\} DEF\.`/);
});

test('no HARDCORE/IMPOSSIBLE tier is rendered in the mission screen markup or script',async()=>{
  const [html,mjs]=await Promise.all([read('public/flare-s8a/challenge.html'),read('public/flare-s8a/challenge.mjs')]);
  assert.doesNotMatch(html,/HARDCORE|IMPOSSIBLE/i);
  assert.doesNotMatch(mjs,/HARDCORE|IMPOSSIBLE/i);
});

// --- SELECTION APPLIES THE ACTUAL PRESET ENCOUNTER ---

test('navigating to a preset applies its room and encounter via the existing applyEncounter pipeline (browsing the chooser IS selecting, per Part 1 — there is no separate commit step in the mockup)',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/function applyPreset\(preset\)\{/);
  assert.match(mjs,/applyEncounter\(preset\.encounter\);/);
  assert.match(mjs,/function applyCurrentPreset\(\)\{applyPreset\(presetList\(\)\[presetIndex\]\);session=setEncounter\(session,encounter\(\)\);\}/);
});

test('USE THIS DUNGEON still goes through the existing chooseSessionRoom/transition pipeline, now acting on the applied preset state',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/\$\('useDungeon'\)\.addEventListener\('click',\(\)=>transition\('USE_DUNGEON'\)\)/);
  assert.match(mjs,/function chooseSessionRoom\(\)\{session=selectDungeon\(session,selectedSpec\(\)\.id\);session=setEncounter\(session,encounter\(\)\)\;?\}/);
});

// --- EDIT DUNGEON STARTS FROM THE SELECTED PRESET ---

test('CUSTOMIZE/EDIT DUNGEON transitions share the same session.encounter already set by the selected preset, no reset',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  // transition('CUSTOMIZE') calls chooseSessionRoom() which re-reads the live DOM encounter() —
  // the same radios/checkboxes applyPreset() just set — so Edit Dungeon opens on the preset state.
  assert.match(mjs,/if\(\['USE_DUNGEON','CUSTOMIZE'\]\.includes\(event\)\)chooseSessionRoom\(\);/);
});

// --- FOUNDATION REGRESSION: snapshot authority, legacy fallback, editor, receipt/replay ---

test('snapshot-authoritative Runner stats are computed before presets, so presets reflect the real Runner',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  const bootStart=mjs.indexOf('async function bootReceiver');
  const boot=mjs.slice(bootStart,mjs.indexOf('void bootReceiver();'));
  const runnerIdx=boot.indexOf('runner=runnerSummary(model,invite.runnerId,catalog)');
  const presetsIdx=boot.indexOf('dungeonPresets=buildDungeonPresets');
  assert.ok(runnerIdx>0&&presetsIdx>runnerIdx,'presets must be built from the authority-resolved runner, after it exists');
});

test('legacy (non-correlated) links still generate 3 presets from the template Runner, same pipeline',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  // buildDungeonPresets is called unconditionally in bootReceiver regardless of publicToken/snapshot
  // source — legacy links get presets from template runner stats, correlated links from snapshot
  // stats (already applied to catalog.heroes.warrior earlier in the same function).
  const bootStart=mjs.indexOf('async function bootReceiver');
  const boot=mjs.slice(bootStart,mjs.indexOf('void bootReceiver();'));
  assert.equal((boot.match(/buildDungeonPresets/g)||[]).length,1);
  assert.doesNotMatch(boot,/if\(publicToken\)[^;]*buildDungeonPresets/);
});

test('the visual dungeon editor (monster/trap/support cards) is untouched by this change',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/function renderControls\(\)\{/);
  assert.match(mjs,/function monsterCard\(/);
  assert.match(mjs,/function itemCard\(/);
});

test('receipt/replay/attempt-token semantics are untouched by this change',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/currentAttemptToken=createAttemptToken\(\)/);
  assert.match(mjs,/submit_builder_challenge_result_v2|submitResultReceipt/);
});
