import {chromium} from 'file:///C:/Users/Thomas/.codex/temp/studio-playwright/node_modules/playwright-core/index.mjs';
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';

const out=process.env.FLARE_AUDIO_PROOF||'G:\\My Drive\\Quick Dungeon\\Owner Review\\AUDIO_INTEGRATION_002';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',args:['--autoplay-policy=no-user-gesture-required']});
const context=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:out,size:{width:390,height:844}}});
const page=await context.newPage(),consoleErrors=[],pageErrors=[],httpErrors=[];
page.on('console',message=>{if(message.type()==='error')consoleErrors.push({message:message.text(),url:message.location().url||''});});page.on('pageerror',error=>pageErrors.push(error.message));page.on('response',response=>{if(response.status()>=400)httpErrors.push({status:response.status(),url:response.url()});});
const startedAt=Date.now();
await page.goto('http://127.0.0.1:4178/m/Q3vx?from=Makidon+Antiva',{waitUntil:'networkidle'});
await page.getByRole('button',{name:'CHOOSE A DUNGEON'}).click();
await page.getByRole('button',{name:'USE THIS DUNGEON'}).click();
await page.getByRole('button',{name:'RUN THE HERO'}).click();
await page.getByRole('heading',{name:'THE RUN'}).waitFor({state:'visible'});
await page.locator('#loadingOverlay').waitFor({state:'hidden',timeout:30000});
await page.waitForTimeout(500);
await page.locator('#runtimeSoundToggle').click();const offAt=Date.now()-startedAt;
await page.waitForTimeout(400);
await page.locator('#runtimeSoundToggle').click();const onAt=Date.now()-startedAt;
await page.locator('#rewardJourney').waitFor({state:'visible',timeout:70000});
for(let i=0;i<5;i++){const next=page.locator('#rewardJourney button.j-next').first();await next.waitFor({state:'visible'});await next.click();await page.waitForTimeout(650);}
const proof=await page.evaluate(()=>({
  viewport:{width:innerWidth,height:innerHeight},soundEnabled:window.__flareAudio.enabled,unlocked:window.__flareAudio.unlocked,musicState:window.__flareAudio.musicState,ambienceState:window.__flareAudio.ambienceState,trace:window.__flareAudio.trace,
  screen:document.querySelector('[data-screen]:not([hidden])')?.getAttribute('data-screen'),journeyScene:document.querySelector('#rewardJourney')?.dataset.scene
}));
await page.screenshot({path:join(out,'AUDIO_INTEGRATION_002_FINAL.png')});
const video=page.video();await context.close();const raw=await video.path();await browser.close();await rename(raw,join(out,'AUDIO_INTEGRATION_002_DEMO_FINAL_CAPTURE.webm'));
const result={work_order:'FLARE_AUDIO_INTEGRATION_002',tested_at:new Date().toISOString(),url:'local /m/Q3vx Friend route',...proof,sound_off_at_ms:offAt,sound_on_at_ms:onAt,console_errors:consoleErrors,page_errors:pageErrors,http_errors:httpErrors,pass:proof.viewport.width===390&&proof.viewport.height===844&&proof.unlocked&&proof.soundEnabled&&proof.trace.some(x=>x.type==='sfx')&&proof.trace.some(x=>x.type==='state'&&x.kind==='music'&&x.state==='COMBAT')&&consoleErrors.length===0&&pageErrors.length===0};
await writeFile(join(out,'AUDIO_INTEGRATION_002_BROWSER_RESULT.json'),`${JSON.stringify(result,null,2)}\n`);
console.log(JSON.stringify({pass:result.pass,viewport:result.viewport,traceEvents:result.trace.length,consoleErrors,pageErrors,httpErrors,rawVideo:join(out,'AUDIO_INTEGRATION_002_DEMO_FINAL_CAPTURE.webm')},null,2));
if(!result.pass)process.exitCode=1;
