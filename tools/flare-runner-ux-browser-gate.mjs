import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright-core';

const root=process.cwd();
const origin='https://think-2-thrive.com';
const hubUrl=`${origin}/quick-dungeon/flare-s8b/`;
const viewports=[[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,900]];
const executablePath=process.env.S8B_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const mime=new Map([
  ['.html','text/html; charset=utf-8'],['.mjs','text/javascript; charset=utf-8'],['.js','text/javascript; charset=utf-8'],
  ['.css','text/css; charset=utf-8'],['.json','application/json; charset=utf-8'],['.png','image/png'],['.webp','image/webp']
]);

const mockAdapter=`
const challenge={challenge_id:'challenge-60',runner_id:'warrior-l1',target_hp:60,invite_code:'Qs2Z',sender_name:'Ada',created_at:'2026-09-28T02:00:00Z',builder_xp_awarded:10,duplicate:false};
let published=false;
const gear=[
 {slot:'weapon',equipped:true,ownership_id:'club-own',item_id:'wooden-club',name:'Wooden Club',modifiers:{hp:0,attack:4,defense:0},catalog_version:'s8b-1',gfx:'club'},
 {slot:'shield',equipped:true,ownership_id:'shield-own',item_id:'wooden-shield',name:'Wooden Shield',modifiers:{hp:0,attack:0,defense:1},catalog_version:'s8b-1',gfx:'buckler'},
 ...['head','chest','hands','legs','feet'].map(slot=>({slot,equipped:false,ownership_id:null,item_id:null,name:null,modifiers:{hp:0,attack:0,defense:0}}))
];
function account(){return {
 identity:{id:'player-safe-fixture',email:'ada@example.test'},profile:{id:'player-safe-fixture',display_name:'Ada'},
 runnerState:{player_runner_id:'runner-safe-fixture',runner_template_id:'warrior-l1',runner_name:'Rookie Warrior',progression_version:'s8b-1',catalog_version:'s8b-1',base_stats:{hp:100,attack:8,defense:0},effective_stats:{hp:100,attack:12,defense:1},gear},
 savedGoals:[{source_sender_name:'Tom',source_runner_name:'Tough Warrior',target_hp:60}],goldBalance:45,
 progressionOffers:[{catalog_version:'launch',offer_id:'endurance-i',kind:'STAT',stat_key:'hp',stat_amount:5,gold_cost:20}],progressionPurchases:[],
 dailyLogin:{reward_day:'2026-09-28',claimed_today:false,current_streak_day:0,next_streak_day:1,claimable_gold:5,next_reset_at:'2026-09-29T00:00:00Z'},dailyTrial:null,
 progression:{player_runner_id:'runner-safe-fixture',total_xp:10,runner_level:1,level_threshold:0,next_level_threshold:30,xp_remaining:20,max_level:false,unlocks:[{offerId:'leather-hood',itemId:'leather-hood',minLevel:2,goldCost:35,unlocked:false}]},
 itemCatalog:[{item_id:'leather-hood',slot:'head',display_name:'Leather Hood',hp_modifier:0,attack_modifier:0,defense_modifier:1}],itemOwnership:[],
 progressionHistory:[{kind:'daily_trial',label:'Daily Trial · +10 XP · +5 Gold',gold_delta:5,xp_delta:10,created_at:'2026-09-28T00:00:00Z'}],
 builderProgression:{total_builder_xp:published?10:0,builder_level:1,level_threshold:0,next_level_threshold:20,xp_remaining:published?10:20,max_level:false,published_challenges:published?1:0},
 builderChallenges:published?[challenge]:[]
}}
export function createBrowserAccountAdapter(){return {
 getSession:async()=>({user:{id:'player-safe-fixture'},access_token:'fixture-token'}),ensureStarterAccount:async()=>({player_runner_id:'runner-safe-fixture'}),loadAccountState:async()=>account(),
 createBuilderChallenge:async()=>{published=true;return challenge},subscribeAuthStateChange:()=>({unsubscribe(){}}),signOut:async()=>{},
 register:async()=>({pendingConfirmation:true}),signIn:async()=>({account:account()}),requestPasswordReset:async()=>{},updatePassword:async()=>{},
 purchaseProgressionOffer:async()=>{throw Error('NOT_USED')},claimDailyLoginBonus:async()=>{throw Error('NOT_USED')},startDailyTrial:async()=>{throw Error('NOT_USED')},settleDailyTrial:async()=>{throw Error('NOT_USED')},equipRunnerItem:async()=>{throw Error('NOT_USED')}
}}
`;

function localPath(url){
  const pathname=new URL(url).pathname;
  if(/^\/m\/[A-Za-z0-9_-]{4}\/?$/.test(pathname))return path.join(root,'public','flare-s8a','challenge.html');
  const match=pathname.match(/^\/quick-dungeon\/(flare-[a-z0-9]+)\/(.*)$/i);
  if(match)return path.join(root,'public',match[1],decodeURIComponent(match[2]||'index.html'));
  return null;
}

async function installRoutes(page){
  await page.route(`${origin}/**`,async route=>{
    const url=route.request().url();
    if(url.endsWith('/quick-dungeon/flare-s8b/supabase-browser.mjs'))return route.fulfill({status:200,contentType:'text/javascript; charset=utf-8',body:mockAdapter});
    const file=localPath(url);
    if(!file)return route.fulfill({status:404,body:'not found'});
    try{return route.fulfill({status:200,contentType:mime.get(path.extname(file))||'application/octet-stream',body:await readFile(file)})}
    catch{return route.fulfill({status:404,body:'not found'})}
  });
}

const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox']});
const results=[];
let sampleUrl='';
try{
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],baseURL:origin});
  for(const [width,height] of viewports){
    const page=await context.newPage();
    await page.setViewportSize({width,height});
    await installRoutes(page);
    await page.addInitScript(()=>{try{Object.defineProperty(navigator,'share',{value:undefined,configurable:true})}catch{}});
    const errors=[],notFound=[];
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
    page.on('pageerror',error=>errors.push(error.message));
    page.on('response',response=>{if(response.status()===404&&!response.url().startsWith('https://raw.githubusercontent.com/'))notFound.push(response.url())});
    await page.goto(hubUrl,{waitUntil:'domcontentloaded'});
    try{await page.locator('#readyView').waitFor({state:'visible',timeout:20000})}
    catch(error){
      console.error(JSON.stringify({viewport:`${width}x${height}`,errors,notFound,authStatus:await page.locator('#authStatus').innerText(),body:(await page.locator('body').innerText()).slice(0,1200)},null,2));
      throw error;
    }
    const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth,labels:[...document.querySelectorAll('.runner-tab')].map(node=>node.textContent.trim())}));
    assert(layout.scrollWidth<=layout.innerWidth,`horizontal overflow at ${width}x${height}`);
    assert.deepEqual(layout.labels,['LEVEL & STATS','EQUIPMENT']);
    assert.match(await page.locator('#statsPanel').innerText(),/LEVEL 1[\s\S]*10 \/ 30 XP[\s\S]*CURRENT STATS[\s\S]*100[\s\S]*12[\s\S]*1[\s\S]*RUNNER TRAINING[\s\S]*PROGRESSION HISTORY/);
    assert(!/BASE → CURRENT|GEAR BONUS/.test(await page.locator('#statsPanel').innerText()));
    await page.locator('#equipmentTab').click();
    const equipmentText=await page.locator('#equipmentPanel').innerText();
    assert.match(equipmentText,/EQUIPPED GEAR[\s\S]*ARMOR & WEAPONS[\s\S]*Wooden Club[\s\S]*\+4 ATK[\s\S]*Wooden Shield[\s\S]*\+1 DEF/);
    assert.equal(await page.locator('#flareLoadout .gear-slot').count(),7);
    assert.equal(await page.locator('#flareLoadout .gear-slot-visual svg').count(),7);
    for(const label of ['MAIN HAND','OFF HAND','HEAD','CHEST','HANDS','LEGS','FEET'])assert(equipmentText.includes(label),`${label} missing at ${width}x${height}`);
    await page.locator('#friendShareGenerate').click();
    await page.locator('#friendShareResult').waitFor({state:'visible'});
    const url=await page.locator('#friendShareUrl').evaluate(node=>node.value);
    assert.equal(url,`${origin}/m/Qs2Z?from=Ada`);
    sampleUrl=url;
    for(const selector of ['#friendShareOpen','#friendShareCopy','#friendShareWhatsapp','#friendShareTelegram','#statsTab','#equipmentTab']){
      const box=await page.locator(selector).evaluate(node=>node.getBoundingClientRect().toJSON());
      assert(box.height>=44,`${selector} below 44px at ${width}x${height}`);
    }
    await page.locator('#friendShareCopy').click();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),url);
    await page.locator('#friendShareOpen').click();
    await page.waitForFunction(()=>document.querySelector('#friendShareStatus')?.textContent?.startsWith('FRIEND LINK COPIED'));
    assert.equal(await page.locator('#friendShareStatus').innerText(),'FRIEND LINK COPIED · paste it into WhatsApp, email or any message.');
    const journalButton=page.locator('#challengeJournalList button').first();
    await journalButton.click();
    assert.equal(await page.locator('#friendShareUrl').evaluate(node=>node.value),url);
    assert.equal(errors.length,0,`console errors at ${width}x${height}: ${errors.join(' | ')}`);
    assert.equal(notFound.length,0,`route 404s at ${width}x${height}: ${notFound.join(' | ')}`);
    results.push({viewport:`${width}x${height}`,noHorizontalOverflow:true,tabs:layout.labels,slots:7,touchTargets:true,friendUrl:url,copy:true,sendFallback:true,reshare:true,consoleErrors:0,route404s:0});
    await page.close();
  }
  const receiver=await context.newPage();
  await installRoutes(receiver);
  const receiverErrors=[];receiver.on('pageerror',error=>receiverErrors.push(error.message));
  await receiver.goto(sampleUrl,{waitUntil:'domcontentloaded'});
  await receiver.locator('#acceptChallenge').waitFor({state:'visible',timeout:30000});
  await receiver.waitForFunction(()=>!document.querySelector('#acceptChallenge').disabled,null,{timeout:30000});
  assert.match(await receiver.locator('body').innerText(),/ADA|60%/i);
  assert.equal(receiverErrors.length,0,receiverErrors.join(' | '));
  await receiver.close();
  console.log(JSON.stringify({status:'PASS',samplePublicFriendUrl:sampleUrl,sendToFriendFallback:'PASS',challengeJournalReshare:'PASS',receiverSignedOut:'PASS',viewports:results},null,2));
}finally{await browser.close()}
