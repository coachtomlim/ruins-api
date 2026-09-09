/** One real-art mobile browser walkthrough, a pause/rotate check, and a brief replay reset.
 * Runs in the preview build, not GitHub Actions. Any failure blocks the deployment.
 */
import fs from 'node:fs/promises';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {chromium as playwright} from 'playwright-core';import chromium from '@sparticuz/chromium';import sharp from 'sharp';
import {Simulation} from '../public/flare-p0/src/core/simulation.mjs';
const root=path.resolve('public'),evidence=path.join(root,'flare-p0/evidence');await fs.mkdir(evidence,{recursive:true});
const json=async f=>JSON.parse(await fs.readFile(path.join(root,'flare-p0/data/'+f),'utf8'));
const map=await json('room.json'),challenge=await json('challenge.json'),catalog=await json('catalog.json');
const expected=new Simulation(map,challenge,catalog);expected.start();while(expected.status==='running')expected.step();assert.equal(expected.status,'cleared');
const mime={'.html':'text/html','.css':'text/css','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),p=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}const b=await fs.readFile(p);res.writeHead(200,{'Content-Type':mime[path.extname(p)]||'text/plain'});res.end(b);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(4319,'127.0.0.1',resolve));let browser;
const checks=[],errors=[],external=[];
try{
 browser=await playwright.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4319/'))external.push(r.url());});
 await page.goto('http://127.0.0.1:4319/flare-p0/index.html?debug=1',{waitUntil:'networkidle',timeout:30000});
 await page.waitForFunction(()=>window.__flare?.snapshot().status==='ready',null,{timeout:15000});checks.push('real stock atlas load and ready state');
 await page.screenshot({path:path.join(evidence,'overview.png')});
 await page.click('#start');await page.waitForFunction(()=>window.__flare.snapshot().ticks>=110,null,{timeout:7000});
 const active=await page.evaluate(()=>window.__flare.snapshot());assert.ok(active.camera.s>.25);assert.equal(active.metrics.blockedMoves,0);checks.push('closer camera and legal movement');
 await page.screenshot({path:path.join(evidence,'mobile-run.png')});
 await page.click('#pause');const pausedTick=await page.evaluate(()=>window.__flare.snapshot().ticks);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>window.__flare.snapshot().ticks),pausedTick);await page.click('#pause');checks.push('pause preserves simulation state');
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(80);await page.setViewportSize({width:390,height:844});checks.push('rotate/resize during run without reset');
 await page.waitForFunction(()=>window.__flare.snapshot().ticks>=395,null,{timeout:8000});await page.screenshot({path:path.join(evidence,'mobile-combat.png')});
 await page.waitForFunction(()=>window.__flare.snapshot().status==='cleared',null,{timeout:6000});await page.waitForTimeout(850);
 const result=await page.evaluate(()=>window.__flare.snapshot());assert.equal(result.ticks,expected.tick);assert.equal(result.hp,expected.hero.hp);assert.equal(result.gold,15);assert.equal(result.kills,2);assert.equal(result.metrics.blockedMoves,0);checks.push('real combat, healing, drops and exit agree with pure simulation');
 await page.screenshot({path:path.join(evidence,'result.png')});
 const events=await page.evaluate(()=>window.__flare.events());assert.deepEqual(events,expected.events);checks.push('render rate, pause and orientation do not alter event trace');
 await page.click('#start');await page.waitForFunction(()=>{const s=window.__flare.snapshot();return s.status==='running'&&s.ticks>=20&&s.ticks<70;},null,{timeout:4000});
 const reset=await page.evaluate(()=>window.__flare.snapshot());assert.equal(reset.gold,0);assert.equal(reset.hp,100);assert.equal(reset.kills,0);checks.push('replay resets health, gold, kills and route');
 await page.setViewportSize({width:1200,height:800});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);await page.screenshot({path:path.join(evidence,'desktop-run.png')});checks.push('desktop layout and reduced-motion camera');
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);checks.push('no JavaScript errors or third-party runtime requests');
 const report={status:'BROWSER_PASS',version:'web-flare-0.2.0',browser:'Chromium mobile emulation (not a physical iPhone)',checks,result:expected.result(),traceSha256:crypto.createHash('sha256').update(JSON.stringify(events)).digest('hex'),errors,externalRequests:external};
 await fs.writeFile(path.join(evidence,'browser-smoke.json'),JSON.stringify(report,null,2));
 const preview=await sharp(path.join(evidence,'mobile-run.png')).resize({width:260}).jpeg({quality:50}).toBuffer();await fs.writeFile(path.join(evidence,'preview-base64.json'),JSON.stringify({type:'image/jpeg',base64:preview.toString('base64')}));
 console.log('BROWSER_PASS',JSON.stringify(report));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
