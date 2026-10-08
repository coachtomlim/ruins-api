import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildResultViewModel} from '../public/flare-s8a/result-view-model.mjs';
import {buildRewardJourney,JOURNEY_SCENE_IDS,performanceTitle,distanceLine} from '../public/flare-s8a/reward-journey.mjs';
import {planResultReceipt,receiptBlockMessage} from '../public/flare-s8a/receipt-plan.mjs';
import {FLARE_ART,CATEGORY_ART} from '../public/flare-s8a/flare-art.mjs';
import {S7_ROOMS} from '../public/flare-s7/rooms.mjs';

const read=p=>readFile(new URL(`../${p}`,import.meta.url),'utf8');
const names={zombie:'Zombie','skeleton-archer':'Skeleton Archer','spike-trap':'Spike Trap','dart-trap':'Dart Trap','iron-labyrinth-07':'Broken Gallery'};
const nameOf=id=>names[id]||id;
const clearedResult=(over={})=>({status:'cleared',hp:56,maxHp:100,gold:24,...over});
const journeyFor=({result=clearedResult(),score=88,targetHp=50,senderName='Makidon'}={})=>buildRewardJourney({result:buildResultViewModel({result,score,targetHp,senderName}),senderName,level:2,nameOf});

test('the journey is exactly SUCCESS, PERFORMANCE, YOU GAINED, YOUR FRIEND GAINED, ACHIEVEMENT, NEW GIZMOS, KEEP PROGRESSING in that order',()=>{
  assert.deepEqual(JOURNEY_SCENE_IDS,['success','performance','reward','friend','achievement','gizmos','momentum']);
  assert.deepEqual(journeyFor().scenes.map(s=>s.id),[...JOURNEY_SCENE_IDS]);
});

test('PERFORMANCE binds the real target, finished HP and difference — and ships no percentile or ranking claim',()=>{
  const p=journeyFor().scenes[1];
  assert.deepEqual(p.rows.map(r=>[r.label,r.value]),[['TARGET','50% HP'],['YOU FINISHED','56% HP']]);
  assert.equal(p.distance,'6 POINTS FROM TARGET');
  const all=JSON.stringify(journeyFor());
  assert.doesNotMatch(all,/TOP \d+%|PERCENT|OF ALL|RANK|TOP 10/i);
});

test('performance title and distance wording follow the real difference, never a fixed boast',()=>{
  assert.equal(performanceTitle(0),'PRECISION RUN');assert.equal(performanceTitle(5),'PRECISION RUN');assert.equal(performanceTitle(12),'SOLID RUN');assert.equal(performanceTitle(40),'RUN COMPLETE');
  assert.equal(distanceLine(0),'RIGHT ON TARGET');assert.equal(distanceLine(1),'ONLY 1 POINT FROM TARGET');assert.equal(distanceLine(4),'ONLY 4 POINTS FROM TARGET');assert.equal(distanceLine(30),'30 POINTS FROM TARGET');
});

test('Builder Gold and Friend/Hero Gold are separate variables with YOU GAINED / YOUR FRIEND GAINED wording',()=>{
  // 56% finish vs 50% target => 6 points off => 88 score => Builder 20 Gold; Hero Gold comes from the run itself (24).
  const j=journeyFor();
  assert.equal(j.scenes[2].gainedLabel,'YOU GAINED');assert.equal(j.scenes[2].gold,20);assert.equal(j.scenes[2].goldLabel,'20 GOLD');
  assert.equal(j.scenes[3].title,'YOUR FRIEND GAINED');assert.equal(j.scenes[3].gold,24);assert.equal(j.scenes[3].goldLabel,'24 GOLD');
  assert.equal(j.scenes[3].heroLabel,"MAKIDON'S HERO");
  assert.notEqual(j.builderGold,j.friendGold);
  // wording must not imply both always receive the same reward
  assert.doesNotMatch(JSON.stringify(j.scenes[2])+JSON.stringify(j.scenes[3]),/both of you|BOTH|you win/i);
});

test('unequal rewards render independently (future-proof): 25 vs 3 Gold',()=>{
  const j=journeyFor({result:clearedResult({gold:3,hp:50}),score:100});
  assert.equal(j.scenes[2].gold,25);assert.equal(j.scenes[3].gold,3);
});

test('a run that did not clear stays truthful: no SUCCESS claim, 0 Builder Gold, still shows real numbers',()=>{
  const j=journeyFor({result:{status:'dead',hp:0,maxHp:100,gold:6},score:0});
  assert.equal(j.scenes[0].title,'RUN COMPLETE');assert.equal(j.scenes[0].celebrate,false);assert.equal(j.scenes[0].subtitle,'THE HERO DID NOT CLEAR THIS TIME');
  assert.equal(j.scenes[1].rows[1].value,'0% HP');assert.equal(j.scenes[2].gold,0);assert.equal(j.scenes[3].gold,6);
});

test('ACHIEVEMENT: Level 2 hexagon, YOU / LEVELED / UP! on three lines, session-only truth note',()=>{
  const a=journeyFor().scenes[4];
  assert.equal(a.level,2);assert.deepEqual(a.lines,['YOU','LEVELED','UP!']);assert.equal(a.levelLabel,'LEVEL');
  assert.equal(a.eyebrow,'ACHIEVEMENT UNLOCKED!');assert.equal(a.next,'SEE WHAT YOU UNLOCKED →');
  assert.match(a.sessionNote,/this session/i);
});

test('NEW GIZMOS: stable four-category shell with exactly the Level 2 content',()=>{
  const g=journeyFor().scenes[5];
  assert.equal(g.title,'Your kit just got bigger!');assert.equal(g.try,'TRY OUT NEW GIZMOS');
  assert.deepEqual(g.categories.map(c=>c.label),['MONSTERS','TRAPS','SUPPORT','DUNGEONS']);
  assert.deepEqual(g.categories[0].items.map(i=>i.name),['Zombie','Skeleton Archer']);
  assert.deepEqual(g.categories[1].items.map(i=>i.name),['Spike Trap','Dart Trap']);
  assert.deepEqual(g.categories[2].items,[]);
  assert.equal(g.categories[2].emptyCopy,'No new Support unlocked at Level 2.');
  assert.deepEqual(g.categories[3].items.map(i=>i.name),['Broken Gallery']);
  assert.equal(g.categories[3].items[0].kind,'dungeon');
  assert.deepEqual(g.categories.map(c=>c.copy),['Choose what guards each room.','Add hazards to change the challenge.','Helpful items can unlock at other levels.','Choose the arena for your challenge.']);
  assert.ok(g.categories.every(c=>c.detailLabel==='NEW AT LEVEL 2'));
});

test('KEEP PROGRESSING: account framing never claims Level 2 or Gold are saved',()=>{
  const m=journeyFor().scenes[6];
  assert.equal(m.title,'READY TO BUILD YOUR OWN?');
  assert.deepEqual([m.customize,m.create,m.guest],['CUSTOMIZE THIS DUNGEON','CREATE ACCOUNT','CONTINUE AS GUEST']);
  assert.match(m.truthNote,/this session only/i);
  assert.match(m.truthNote,/Create an account to keep progressing/);
  assert.doesNotMatch(JSON.stringify(m),/SAVE YOUR PROGRESS|KEEP YOUR GOLD|saved to your account/i);
});

test('the reward journey rejects a missing result instead of inventing numbers',()=>{assert.throws(()=>buildRewardJourney({}),/requires a result/)});

test('Tactics coin: approved transparent RGBA PNG ships and is rendered as a bare transparent image',async()=>{
  const bytes=await readFile(new URL('../public/flare-s8a/assets/tactics-coins.png',import.meta.url));
  assert.equal(bytes.subarray(1,4).toString(),'PNG');
  assert.equal(bytes.readUInt32BE(16),1448);assert.equal(bytes.readUInt32BE(20),1086);
  assert.equal(bytes[25],6,'colour type 6 = RGBA, i.e. a real alpha channel');
  const [css,view]=await Promise.all([read('public/flare-s8a/style.css'),read('public/flare-s8a/reward-journey-view.mjs')]);
  assert.match(css,/\.j-coin\{[^}]*background:transparent/);
  assert.doesNotMatch(css,/\.j-coin\{[^}]*(border-radius|border:)/);
  assert.match(view,/coin\.src=coinSrc/);
});

test('real Flare art, not emoji: monsters, traps, health potion and the Broken Gallery room',async()=>{
  assert.match(FLARE_ART.zombie.src,/images\/enemies\/zombie\.png$/);
  assert.match(FLARE_ART['skeleton-archer'].src,/images\/enemies\/skeleton_archer\.png$/);
  assert.match(FLARE_ART['spike-trap'].src,/images\/powers\/spikes\.png$/);
  assert.match(FLARE_ART['dart-trap'].src,/images\/powers\/arrows\.png$/);
  assert.match(FLARE_ART['small-potion'].src,/images\/loot\/hp_potion\.png$/);
  assert.deepEqual(CATEGORY_ART,{monsters:'goblin',traps:'spike-trap',supports:'small-potion',dungeons:null});
  assert.equal(S7_ROOMS['iron-labyrinth-07'].source,'mods/empyrean_campaign/maps/iron_labyrinth/room7.txt');
  const files=await Promise.all(['reward-journey.mjs','reward-journey-view.mjs','flare-art.mjs','challenge.mjs','card-icons.mjs'].map(f=>read(`public/flare-s8a/${f}`)));
  for(const src of files)assert.doesNotMatch(src,/[👾⚠🧪🏰]/u);
});

test('the Broken Gallery preview is the real Flare room on a transparent canvas (no extra inner box)',async()=>{
  const [art,mjs,css]=await Promise.all([read('public/flare-s8a/flare-art.mjs'),read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/style.css')]);
  assert.match(art,/export function drawRoomPreviewTransparent\(/);
  assert.doesNotMatch(art.slice(art.indexOf('export function drawRoomPreviewTransparent')),/fillRect/);
  assert.match(mjs,/drawRoomPreviewTransparent\(canvas,room\.map,room\.tiles\)/);
  assert.match(css,/\.j-dungeon\{[^}]*background:transparent/);
});

test('selected category and option states reverse the background strongly (gold fill, dark text)',async()=>{
  const css=await read('public/flare-s8a/style.css');
  assert.match(css,/\.j-tool\.is-active\{border-color:#f6d77d;background:linear-gradient\(#f4cd70,#dda02b\);color:#1b101c/);
});

test('TRY OUT NEW GIZMOS opens the REAL customization flow (EDIT_DUNGEON on the chosen tab), not a sandbox',async()=>{
  const [mjs,view]=await Promise.all([read('public/flare-s8a/challenge.mjs'),read('public/flare-s8a/reward-journey-view.mjs')]);
  assert.match(mjs,/function openUnlockedTool\(panel\)\{activePanel=panel;journeyView\.dismiss\(\);transition\('EDIT_DUNGEON'\);\}/);
  assert.match(mjs,/onTry:panel=>openUnlockedTool\(panel\)/);
  assert.match(view,/button\('j-next',s\.try,\(\)=>onTry\?\.\(activeKey\)\)/);
  assert.doesNotMatch((mjs+view).replace(/\/\/.*$/gm,''),/sandbox|playground|concept dungeon/i);
});

test('account conversion hands off through the existing SAVE_GOAL transition; guest simply dismisses',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/onCreateAccount:\(\)=>\{journeyView\.dismiss\(\);transition\('SAVE_GOAL'\);\}/);
  assert.match(mjs,/onGuest:\(\)=>journeyView\.dismiss\(\)/);
});

test('result variables feeding the journey come from buildResultViewModel (target, actual, difference, both Golds)',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  assert.match(mjs,/renderRewardJourney\(m\);\}/);
  assert.match(mjs,/buildRewardJourney\(\{result:m,senderName:session\.senderName,level:builderLevel,nameOf:journeyNameOf\}\)/);
});

test('reduced motion: journey content is shown immediately and animation/confetti are skipped',async()=>{
  const [css,view]=await Promise.all([read('public/flare-s8a/style.css'),read('public/flare-s8a/reward-journey-view.mjs')]);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.journey-overlay \*\{animation:none!important;transition:none!important\}/);
  assert.match(view,/if\(reducedMotion\(\)\)return;\s*for\(let i=0;i<52;i\+\+\)/);
});

// --- receipt hardening ---

const token='T'.repeat(40),attempt='a'.repeat(20);
const planFor=(encounter,over={})=>planResultReceipt({publicToken:token,roomId:'iron-labyrinth-01',encounter,result:{status:'cleared',hp:56,maxHp:100},heroGold:15,attemptToken:attempt,...over});

test('receipt plan: Level 1 encounters build the unchanged result payload (attempt token, room, encounter, gold)',()=>{
  const plan=planFor({enemyTypes:['goblin','skeleton','none'],trapTypes:[],supportTypes:[]});
  assert.equal(plan.block,null);
  assert.equal(plan.payload.p_attempt_token,attempt);assert.equal(plan.payload.p_room_id,'iron-labyrinth-01');
  assert.equal(plan.payload.p_hero_gold,15);assert.equal(plan.payload.p_terminal_status,'cleared');
  assert.deepEqual(plan.payload.p_encounter.enemyTypes,['goblin','skeleton','none']);
});

test('receipt plan: Level 2 monsters are reported as unsupported by the result service, never silently submitted',()=>{
  const plan=planFor({enemyTypes:['zombie','skeleton-archer','none'],trapTypes:[],supportTypes:[]});
  assert.equal(plan.payload,null);assert.equal(plan.block,'UNSUPPORTED_ENCOUNTER');
  assert.match(receiptBlockMessage(plan.block,'Makidon'),/Makidon can't receive Level 2 monster runs yet/);
});

test('receipt plan never throws: an invalid payload (31 Gold, bad token) becomes an explicit block',()=>{
  const bad=planFor({enemyTypes:['goblin','none','none']},{heroGold:31});
  assert.equal(bad.payload,null);assert.equal(bad.block,'PAYLOAD_INVALID');assert.ok(bad.error);
  assert.doesNotThrow(()=>planFor({enemyTypes:['goblin']},{attemptToken:'x'}));
  assert.equal(planFor({enemyTypes:['goblin']},{attemptToken:'x'}).block,'PAYLOAD_INVALID');
});

test('receipt plan: a legacy challenge with no public token plans nothing and blocks nothing',()=>{
  const plan=planResultReceipt({publicToken:'',encounter:{enemyTypes:['goblin']},result:{status:'cleared',hp:1,maxHp:100},heroGold:1,attemptToken:attempt});
  assert.deepEqual({payload:plan.payload,block:plan.block},{payload:null,block:null});
});

test('completeRuntime plans the receipt before any presentation and always sends in finally (retry/idempotency/supersession untouched)',async()=>{
  const mjs=await read('public/flare-s8a/challenge.mjs');
  const start=mjs.indexOf('completeRuntime(result,score){'),end=mjs.indexOf('replayRuntime(');
  const body=mjs.slice(start,end);
  assert.ok(body.indexOf('planResultReceipt(')<body.indexOf('show();'),'payload is built before show()');
  assert.match(body,/finally\{void sendResultReceipt\(\);\}/);
  assert.match(mjs,/replayRuntime\(\)\{currentAttemptToken=createAttemptToken\(\);session=advanceReceiver\(session,'RUN_AGAIN'\);show\(\);\}/);
  assert.match(mjs,/\$\('retryResultReceipt'\)\.addEventListener\('click',sendResultReceipt\)/);
  assert.match(mjs,/submitResultReceipt\(\{client,payload:lastReceiptPayload\}\)/);
  assert.doesNotMatch(mjs,/heroReward['"]?\)\.(textContent|innerHTML)/,'the heroReward DOM crash fix is not regressed');
});
