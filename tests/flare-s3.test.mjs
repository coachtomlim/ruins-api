import test from 'node:test';import assert from 'node:assert/strict';
import {DEMO_LOGIN,DEFAULTS,validateDemoLogin,runnerSummary,makePlayerUrl,inviteSender} from '../public/flare-s3/flow.mjs';
const catalog={rules:'web-flare-0.2.0',heroes:{warrior:{maxHp:100,damage:12,armor:0}},enemies:{goblin:{cost:20},skeleton:{cost:30}},items:{'small-potion':{cost:15}}};
const profile={id:'warrior-l1',hero:'warrior',name:'The Runner',className:'Warrior',level:1,weapon:'Longsword'};
test('demo login is intentionally bounded',()=>{assert.equal(validateDemoLogin(DEMO_LOGIN.username,DEMO_LOGIN.password),true);assert.equal(validateDemoLogin('buddy','Test'),false);assert.equal(validateDemoLogin('Buddy','wrong'),false)});
test('runner summary derives combat stats from catalogue',()=>{assert.deepEqual({...runnerSummary(profile,catalog)},{id:'warrior-l1',name:'The Runner',className:'Warrior',level:1,weapon:'Longsword',hero:'warrior',hp:100,attack:12,defense:0})});
test('novice defaults are balanced and under budget',()=>{const spent=20+30+15;assert.deepEqual(DEFAULTS.enemyTypes,['goblin','skeleton','none']);assert.equal(DEFAULTS.targetHp,50);assert.ok(spent<=DEFAULTS.budget)});
test('player URL is separate and autostarts',()=>{const u=makePlayerUrl('https://example.com/flare-s3/index.html',{id:'x'},{autostart:true});assert.equal(u.pathname,'/flare-s3/play.html');assert.equal(u.searchParams.get('autostart'),'1');assert.match(u.hash,/^#c=/)});
test('invite sender is bounded and sanitized',()=>{assert.equal(inviteSender('?from=Alex'),'Alex');assert.equal(inviteSender('?from=%3Cb%3EEve%3C%2Fb%3E'),'bEve/b');assert.equal(inviteSender('?from='),'A friend')});
