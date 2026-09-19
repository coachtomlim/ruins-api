import {chromium} from 'playwright-core';

const origin=process.env.S8B_ORIGIN||'http://127.0.0.1:4178';
const projectUrl=process.env.S8B_SUPABASE_URL;
const publishableKey=process.env.S8B_SUPABASE_PUBLISHABLE_KEY;
const email=process.env.S8B_PROOF_EMAIL;
const password=process.env.S8B_PROOF_PASSWORD;
const phase=process.env.S8B_PROOF_PHASE||'journey';
const viewports=[{width:360,height:800},{width:390,height:844},{width:430,height:932}];
const accountUrl=`${origin}/quick-dungeon/flare-s8b/`;
const executablePath=process.env.S8B_BROWSER||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function assert(condition,message){if(!condition)throw new Error(message)}
for(const [name,value] of Object.entries({projectUrl,publishableKey,email,password}))assert(value,`${name} is required`);
assert(publishableKey.startsWith('sb_publishable_'),'Only an sb_publishable key may enter the browser gate');

const browser=await chromium.launch({executablePath,headless:true});

async function pageWithPublicConfig(viewport){
  const page=await browser.newPage({viewport});
  await page.addInitScript(({url,key})=>{globalThis.__FLARE_S8B_PUBLIC_CONFIG__={url,publishableKey:key}}, {url:projectUrl,key:publishableKey});
  const errors=[],notFound=[],requests=[];
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()===404)notFound.push(response.url())});
  page.on('request',request=>requests.push({method:request.method(),url:request.url()}));
  return {page,errors,notFound,requests};
}

async function layout(page,selector){
  return page.locator(selector).evaluate(element=>({
    scrollWidth:document.documentElement.scrollWidth,
    viewportWidth:innerWidth,
    height:element.getBoundingClientRect().height,
    visible:!element.hidden
  }));
}

async function runSignup(){
  const state=await pageWithPublicConfig({width:390,height:844});
  const {page,errors,notFound,requests}=state;
  await page.goto(accountUrl,{waitUntil:'networkidle'});
  await page.locator('#createForm [name=displayName]').fill('S8B Client Proof');
  await page.locator('#createForm [name=email]').fill(email);
  await page.locator('#createForm [name=password]').fill(password);
  await page.locator('#createForm button[type=submit]').click();
  await page.locator('#pendingView').waitFor({state:'visible',timeout:30000});
  const responsive=[];
  for(const viewport of viewports){
    await page.setViewportSize(viewport);
    const pending=await layout(page,'#pendingView');
    const actionHeight=await page.locator('#pendingSignIn').evaluate(element=>element.getBoundingClientRect().height);
    assert(pending.scrollWidth<=pending.viewportWidth,`Pending view overflow at ${viewport.width}x${viewport.height}`);
    assert(actionHeight>=44,`Pending action below 44px at ${viewport.width}x${viewport.height}`);
    responsive.push({viewport:`${viewport.width}x${viewport.height}`,actionHeight,noHorizontalScroll:true});
  }
  assert((await page.locator('#pendingTitle').textContent()).includes('CHECK YOUR EMAIL'),'Pending confirmation title missing');
  assert((await page.locator('#pendingView').textContent()).includes('Confirm your email address, then sign in'),'Pending instruction missing');
  assert(requests.some(row=>row.url.includes('/auth/v1/signup')&&row.method==='POST'),'Managed public signup was not called');
  assert(!requests.some(row=>row.url.includes('ensure_starter_account')),'Starter account ran before confirmation');
  assert(!requests.some(row=>/claim_proof_builder_reward|claimGuestRun/i.test(row.url)),'Reward claim unexpectedly activated');
  assert(errors.length===0,`Console errors: ${errors.join(' | ')}`);
  assert(notFound.length===0,`404s: ${notFound.join(' | ')}`);
  console.log(JSON.stringify({phase:'signup',status:'PASS',pendingConfirmation:true,responsive,consoleErrors:0,notFound:0},null,2));
  await page.close();
}

async function runJourney(){
  const results=[];
  for(const viewport of viewports){
    const state=await pageWithPublicConfig(viewport);
    const {page,errors,notFound,requests}=state;
    await page.goto(accountUrl,{waitUntil:'networkidle'});
    await page.locator('#showSignIn').click();
    await page.locator('#signInForm [name=email]').fill(email);
    await page.locator('#signInForm [name=password]').fill(password);
    await page.locator('#signInForm button[type=submit]').click();
    await page.locator('#readyView').waitFor({state:'visible',timeout:30000});

    const first=await page.evaluate(()=>({
      displayName:document.querySelector('#displayName').textContent,
      gold:document.querySelector('#goldBalance').textContent,
      runner:document.querySelector('#runnerName').textContent,
      hp:document.querySelector('#runnerHp').textContent,
      attack:document.querySelector('#runnerAttack').textContent,
      defense:document.querySelector('#runnerDefense').textContent,
      baseHp:document.querySelector('#baseHp').textContent,
      baseAttack:document.querySelector('#baseAttack').textContent,
      baseDefense:document.querySelector('#baseDefense').textContent,
      scrollWidth:document.documentElement.scrollWidth,
      viewportWidth:innerWidth
    }));
    assert(first.displayName==='S8B Client Proof','Profile did not come from backend trigger state');
    assert(first.gold==='0','New account Gold was not zero');
    assert(first.runner==='Rookie Warrior','Starter Runner missing');
    assert(first.baseHp==='100'&&first.baseAttack==='8'&&first.baseDefense==='0','Authoritative base stats incorrect');
    assert(first.hp==='100'&&first.attack==='12'&&first.defense==='1','Authoritative effective stats incorrect');
    assert(first.scrollWidth<=first.viewportWidth,`Ready view overflow at ${viewport.width}x${viewport.height}`);
    const dailyLabel=await page.locator('#dailyLoginClaim').textContent();
    assert(/CLAIM (?:5|15) GOLD|CLAIMED TODAY/.test(dailyLabel),'Daily Bonus authoritative state missing');
    assert((await page.locator('.daily-trial-teaser').textContent()).includes('Practice stays unlimited and reward-free'),'Daily Trial boundary copy missing');
    await page.locator('#runnerHeroCanvas').waitFor({state:'visible'});
    const heroBox=await page.locator('#runnerHeroCanvas').boundingBox();
    assert(heroBox&&heroBox.width>80&&heroBox.height>100,`Runner Hero preview is not visibly sized at ${viewport.width}x${viewport.height}`);

    for(const selector of ['#signOut','#dailyLoginClaim','#statsTab','#equipmentTab','#armorTab']){
      const height=await page.locator(selector).evaluate(element=>element.getBoundingClientRect().height);
      assert(height>=44,`${selector} below 44px at ${viewport.width}x${viewport.height}`);
    }

    await page.locator('#equipmentTab').click();
    await page.locator('#equipmentPanel').waitFor({state:'visible'});
    const equipment=await page.locator('#flareLoadout').textContent();
    assert(equipment.includes('Wooden Club')&&equipment.includes('+4 ATK'),'Authoritative Club missing');
    assert(equipment.includes('Wooden Shield')&&equipment.includes('+1 DEF'),'Authoritative Shield missing');

    await page.locator('#armorTab').click();
    await page.locator('#armorPanel').waitFor({state:'visible'});
    assert(await page.locator('#armorGrid .empty').count()===5,'Five authoritative empty armor slots were not shown');
    for(const label of ['HEAD','CHEST','HANDS','LEGS','FEET'])assert((await page.locator('#armorGrid').textContent()).includes(label),`${label} slot missing`);

    await page.locator('#statsTab').click();
    await page.locator('#statsPanel').waitFor({state:'visible'});

    await page.reload({waitUntil:'networkidle'});
    await page.locator('#readyView').waitFor({state:'visible',timeout:30000});
    assert((await page.locator('#runnerName').textContent())==='Rookie Warrior','Runner Hub did not reconstruct after reload');
    await page.goto(`${accountUrl}?navigation=${viewport.width}`,{waitUntil:'networkidle'});
    await page.locator('#readyView').waitFor({state:'visible',timeout:30000});

    const goalCardHidden=await page.locator('#goalCard').isHidden();
    assert(goalCardHidden,'New account should not show an empty challenge-goal card');
    await page.locator('#signOut').click();
    await page.locator('#signInForm').waitFor({state:'visible'});
    assert(await page.locator('#readyView').isHidden(),'Account Ready remained visible after sign-out');
    const applicationErrors=[...errors];
    const applicationNotFound=[...notFound];
    const anon=await page.evaluate(async ({url,key})=>{
      const tables=['player_profile','player_runner','runner_item_ownership','runner_loadout','saved_goal'];
      return Promise.all(tables.map(async table=>{
        const response=await fetch(`${url}/rest/v1/${table}?select=*`,{headers:{apikey:key}});
        const data=await response.json();
        return {table,status:response.status,count:Array.isArray(data)?data.length:null};
      }));
    },{url:projectUrl,key:publishableKey});
    assert(anon.every(row=>(row.status===200&&row.count===0)||[401,403].includes(row.status)),`Unauthenticated data exposed: ${JSON.stringify(anon)}`);
    assert(requests.some(row=>row.url.includes('/auth/v1/token')&&row.method==='POST'),'Managed sign-in was not called');
    assert(requests.some(row=>row.url.includes('/rpc/ensure_starter_account')&&row.method==='POST'),'Starter RPC was not called');
    assert(requests.some(row=>row.url.includes('/rpc/get_account_runner_state')&&row.method==='POST'),'Authoritative Runner state RPC was not called');
    assert(requests.some(row=>row.url.includes('/rpc/get_daily_login_status')&&row.method==='POST'),'Daily Bonus status RPC was not called');
    assert(!requests.some(row=>row.url.includes('/rpc/claim_daily_login_bonus')),'Browser gate must not mutate Daily Bonus state');
    assert(!requests.some(row=>row.url.includes('/rest/v1/saved_goal')&&row.method==='POST'),'Direct saved_goal write detected');
    assert(!requests.some(row=>/claim_proof_builder_reward|claimGuestRun/i.test(row.url)),'Product reward claim unexpectedly activated');
    assert(!requests.some(row=>/runner_template_catalog|runner_item_catalog/.test(row.url)&&row.method!=='GET'),'Catalog mutation unexpectedly activated');
    assert(applicationErrors.length===0,`Console errors at ${viewport.width}x${viewport.height}: ${applicationErrors.join(' | ')}`);
    assert(applicationNotFound.length===0,`404s at ${viewport.width}x${viewport.height}: ${applicationNotFound.join(' | ')}`);
    results.push({viewport:`${viewport.width}x${viewport.height}`,accountReady:true,sessionReload:true,navigation:true,gold:0,dailyBonus:true,baseStats:'100/8/0',effectiveStats:'100/12/1',club:true,shield:true,emptyArmorSlots:5,runnerPanels:true,goalCardHidden,signOut:true,unauthenticatedProtection:true,consoleErrors:0,notFound:0});
    await page.close();
  }
  console.log(JSON.stringify({phase:'journey',status:'PASS',viewports:results},null,2));
}

try{
  if(phase==='signup')await runSignup();
  else if(phase==='journey')await runJourney();
  else throw new Error(`Unknown phase: ${phase}`);
}finally{await browser.close()}
