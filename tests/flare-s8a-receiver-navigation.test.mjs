import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canTransition,transitionJourney} from '../public/flare-s8a/journey.mjs';
import {createReceiverSession,advanceReceiver,selectDungeon} from '../public/flare-s8a/receiver-session.mjs';
import {buildRegistrationViewModel} from '../public/flare-s8a/registration-view-model.mjs';
import {registrationCopy} from '../public/flare-s8a/mission-copy.mjs';

const readHtml=()=>readFile(new URL('../public/flare-s8a/challenge.html',import.meta.url),'utf8');
const readMjs=()=>readFile(new URL('../public/flare-s8a/challenge.mjs',import.meta.url),'utf8');

test('HOME control exists once, points at the public S8B hub, and is outside runtime-only markup',async()=>{
  const html=await readHtml();
  const matches=html.match(/id="navHome"/g)||[];
  assert.equal(matches.length,1);
  assert.match(html,/id="navHome" class="nav-link" href="\/quick-dungeon\/flare-s8b\/"/);
});

test('BACK control exists once and is wired through the journey state machine, not browser history',async()=>{
  const html=await readHtml();
  const mjs=await readMjs();
  assert.equal((html.match(/id="navBack"/g)||[]).length,1);
  assert.match(mjs,/\$\('navBack'\)\.addEventListener\('click',\(\)=>transition\('BACK'\)\)/);
  assert.doesNotMatch(mjs,/history\.(back|go)\(/);
});

test('BACK transitions resolve to the correct prior screen for each governed state',()=>{
  assert.equal(canTransition('mission','BACK'),true);
  assert.equal(transitionJourney('mission','BACK'),'invitation');
  assert.equal(canTransition('ready','BACK'),true);
  assert.equal(transitionJourney('ready','BACK'),'mission');
  assert.equal(canTransition('customize','BACK'),true);
  assert.equal(transitionJourney('customize','BACK'),'ready');
  assert.equal(canTransition('invitation','BACK'),false);
  assert.equal(canTransition('rewards','BACK'),false);
  assert.equal(canTransition('registration','BACK'),false);
});

test('advanceReceiver executes BACK through the same validated session machinery as every other event',()=>{
  let session=createReceiverSession({invite:{runnerId:'warrior-l3',targetHp:60},senderName:'Tom'});
  session=advanceReceiver(session,'ACCEPT');
  session=selectDungeon(session,'iron-labyrinth-01');
  session=advanceReceiver(session,'USE_DUNGEON');
  assert.equal(session.journey,'ready');
  session=advanceReceiver(session,'BACK');
  assert.equal(session.journey,'mission');
});

test('runtime has no HOME/BACK controls that could corrupt an active run',async()=>{
  const mjs=await readMjs();
  assert.match(mjs,/\$\('receiverNav'\)\.hidden=view\.kind==='runtime'/);
});

test('opening copy (V18): one combined headline, one explanation paragraph, Runner level label, VIEW RUNNER',async()=>{
  const [html,mjs]=await Promise.all([readHtml(),readFile(new URL('../public/flare-s8a/challenge.mjs',import.meta.url),'utf8')]);
  assert.match(mjs,/HAS CHALLENGED YOU TO BUILD A DUNGEON FOR 'THE RUNNER'/);
  assert.match(mjs,/Your Dungeon will contain monsters who will attack the Runner! But fear not, we have devised some good ones for you already! Just choose one and go!/);
  assert.match(html,/id="inviteExplain"/);
  assert.match(html,/id="inviteRunner"/);
  assert.match(html,/VIEW RUNNER/);
  assert.doesNotMatch(html,/YOU ARE THE DUNGEON BUILDER|Your friend's Runner is ready\./);
});

test('primary buttons have an explicit bold/contrast/state contract, not just inherited button styling',async()=>{
  const css=await readFile(new URL('../public/flare-s8a/style.css',import.meta.url),'utf8');
  assert.match(css,/\.primary\{[^}]*color:#000/);
  assert.match(css,/\.primary\{[^}]*font-weight:800/);
  assert.match(css,/\.primary:hover:not\(:disabled\)/);
  assert.match(css,/\.primary:active:not\(:disabled\)/);
  assert.match(css,/\.primary:focus-visible/);
  assert.match(css,/\.primary:disabled\{[^}]*opacity/);
});

test('registration copy no longer implies Gold/asset transfer from the guest run',()=>{
  const copy=registrationCopy({targetHp:60,sender:'Tom'});
  assert.doesNotMatch(copy.body,/keep your Gold/i);
  assert.doesNotMatch(copy.body,/store your game assets/i);
  assert.match(copy.body,/save this goal/i);
});

test('registration view model only enables CREATE ACCOUNT when the account service is actually available',()=>{
  const handoff={senderName:'Tom',runner:{id:'warrior-l3',name:'Tough Warrior',level:3},goal:{targetHp:60},rewardPreview:{builderGold:20,heroGold:24}};
  const unavailable=buildRegistrationViewModel(handoff,{accountServiceAvailable:false});
  assert.equal(unavailable.accountAction.enabled,false);
  const available=buildRegistrationViewModel(handoff,{accountServiceAvailable:true});
  assert.equal(available.accountAction.enabled,true);
});

test('CREATE ACCOUNT click handler is wired and never attempts to claim the guest run reward',async()=>{
  const mjs=await readMjs();
  assert.match(mjs,/\$\('createAccount'\)\.addEventListener\('click'/);
  assert.doesNotMatch(mjs,/claimGuestRun/);
});

test('RUN AGAIN is paired with forward-compatible, non-cumulative replay copy',async()=>{
  const html=await readHtml();
  assert.match(html,/id="replayNotice"[^>]*>A new run will replace your current challenge result\.</);
  assert.doesNotMatch(html,/server-authoritative/i);
});
