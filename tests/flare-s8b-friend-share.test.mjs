import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
  buildFriendShareLink,buildPersistedFriendShareLink,friendShareUrlIsSafe,shareFriendLink,copyFriendLink,
  whatsappShareUrl,telegramShareUrl,FRIEND_SHARE_DEFAULT_TARGET_HP
} from '../public/flare-s8b/friend-share.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const model=JSON.parse(await read('public/flare-s7/data/game.json'));
const args=(over={})=>({baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8b/',senderName:'Ada',effectiveHp:108,model,...over});

test('link creation reuses the existing governed S8A builder-invite encode, not a new backend',()=>{
  const link=buildFriendShareLink(args());
  assert.match(link.url,/^https:\/\/think-2-thrive\.com\/m\/[A-Za-z0-9_-]{4}(\?from=.*)?$/);
  assert.equal(link.code.length,4);
  assert.equal(link.runnerId,'warrior-l2');
});

test('link is opaque and public: same inputs produce the same stable code with no randomness/timestamp',()=>{
  const a=buildFriendShareLink(args());
  const b=buildFriendShareLink(args());
  assert.equal(a.url,b.url);
  assert.equal(a.code,b.code);
});

test('default target HP is fixed at 60, matching the product Practice/calibration target',()=>{
  assert.equal(FRIEND_SHARE_DEFAULT_TARGET_HP,60);
  const link=buildFriendShareLink(args());
  assert.match(link.share.text,/60% HP/);
});

test('no private identifiers appear in the generated public URL',()=>{
  const link=buildFriendShareLink(args({senderName:'Ada Owner'}));
  assert.ok(friendShareUrlIsSafe(link.url));
  assert.doesNotMatch(link.url,/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  assert.doesNotMatch(link.url,/@/);
  assert.doesNotMatch(link.url,/service_role|sb_secret_|access_token|refresh_token/i);
});

test('friendShareUrlIsSafe rejects urls carrying an obvious identifier or credential',()=>{
  assert.equal(friendShareUrlIsSafe('https://think-2-thrive.com/m/Qs2Z?uid=11111111-1111-1111-1111-111111111111'),false);
  assert.equal(friendShareUrlIsSafe('https://think-2-thrive.com/m/Qs2Z?email=a@example.test'),false);
  assert.equal(friendShareUrlIsSafe('https://think-2-thrive.com/m/Qs2Z?token=sb_secret_x'),false);
  assert.equal(friendShareUrlIsSafe(''),false);
  assert.equal(friendShareUrlIsSafe('https://think-2-thrive.com/m/Qs2Z?from=Ada'),true);
});

test('required inputs are enforced',()=>{
  assert.throws(()=>buildFriendShareLink({...args(),baseUrl:''}),/FRIEND_SHARE_BASE_URL_REQUIRED/);
  assert.throws(()=>buildFriendShareLink({...args(),model:null}),/FRIEND_SHARE_MODEL_REQUIRED/);
});

test('native share payload carries only title/invitation text/the public URL, nothing private',async()=>{
  const link=buildFriendShareLink(args());
  const calls=[];
  const navigator={share:async payload=>{calls.push(payload)}};
  const result=await shareFriendLink({url:link.url,title:link.share.title,text:link.share.text,navigator});
  assert.equal(result.method,'native');
  assert.equal(result.shared,true);
  assert.deepEqual(Object.keys(calls[0]).sort(),['text','title','url']);
  assert.equal(calls[0].url,link.url);
  assert.doesNotMatch(JSON.stringify(calls[0]),/@|service_role|sb_secret_|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/i);
});

test('share cancellation is preserved as a non-error outcome, not an application error',async()=>{
  const navigator={share:async()=>{const e=new Error('cancelled');e.name='AbortError';throw e}};
  const result=await shareFriendLink({url:'https://think-2-thrive.com/m/Qs2Z',title:'x',text:'y',navigator});
  assert.equal(result.cancelled,true);
  assert.equal(result.shared,false);
});

test('a genuine share error (not cancellation) still propagates',async()=>{
  const navigator={share:async()=>{throw new Error('NotAllowedError')}};
  await assert.rejects(()=>shareFriendLink({url:'https://think-2-thrive.com/m/Qs2Z',title:'x',text:'y',navigator}));
});

test('when navigator.share is unavailable, the link and Copy Link path are preserved',async()=>{
  const result=await shareFriendLink({url:'https://think-2-thrive.com/m/Qs2Z',title:'x',text:'y',navigator:undefined});
  assert.equal(result.method,'unavailable');
  assert.equal(result.shared,false);
});

test('clipboard path uses navigator.clipboard.writeText when available',async()=>{
  const written=[];
  const navigator={clipboard:{writeText:async text=>{written.push(text)}}};
  const result=await copyFriendLink('https://think-2-thrive.com/m/Qs2Z',{navigator});
  assert.equal(result.method,'clipboard');
  assert.equal(result.copied,true);
  assert.deepEqual(written,['https://think-2-thrive.com/m/Qs2Z']);
});

test('clipboard fallback uses a hidden textarea + execCommand when the Clipboard API is unavailable',async()=>{
  const appended=[];
  const doc={
    createElement:()=>({style:{},setAttribute(){},select(){},value:''}),
    execCommand:()=>true,
    body:{appendChild:el=>appended.push(el),removeChild(){}}
  };
  const result=await copyFriendLink('https://think-2-thrive.com/m/Qs2Z',{document:doc});
  assert.equal(result.method,'legacy');
  assert.equal(result.copied,true);
  assert.equal(appended.length,1);
});

test('copy never silently fails: with no clipboard support at all it reports copied:false for a manual fallback',async()=>{
  const result=await copyFriendLink('https://think-2-thrive.com/m/Qs2Z',{document:null});
  assert.equal(result.method,'manual');
  assert.equal(result.copied,false);
});

test('WhatsApp share URL carries only the invitation text and the public link, URL-encoded',()=>{
  const link=buildFriendShareLink(args());
  const wa=whatsappShareUrl(link.url,link.share.text);
  assert.match(wa,/^https:\/\/wa\.me\/\?text=/);
  const decoded=new URL(wa).searchParams.get('text');
  assert.ok(decoded.includes(link.url));
  assert.ok(decoded.startsWith(link.share.text));
  assert.doesNotMatch(wa,/@|service_role|sb_secret_/i);
});

test('Telegram share URL carries the public link as url= and the invitation text as text=',()=>{
  const link=buildFriendShareLink(args());
  const tg=telegramShareUrl(link.url,link.share.text);
  assert.match(tg,/^https:\/\/t\.me\/share\/\?/);
  const parsed=new URL(tg);
  assert.equal(parsed.searchParams.get('url'),link.url);
  assert.equal(parsed.searchParams.get('text'),link.share.text);
});

test('Hub exposes SHARE WITH A FRIEND as its own social action area, separate from the Daily Trial card',async()=>{
  const html=await read('public/flare-s8b/index.html');
  assert.match(html,/id="friendShareCard"/);
  assert.match(html,/SHARE WITH A FRIEND/);
  assert.match(html,/id="friendShareGenerate">PUBLISH FRIEND CHALLENGE/);
  assert.match(html,/id="builderLevel"/);
  assert.match(html,/id="builderXp"/);
  assert.match(html,/id="friendShareTarget"/);
  assert.match(html,/id="challengeJournalList"/);
  for(const id of ['friendShareOpen','friendShareCopy','friendShareWhatsapp','friendShareTelegram','friendShareUrl','friendShareStatus'])
    assert.match(html,new RegExp(`id="${id}"`));
  const dailyTrialIdx=html.indexOf('id="dailyTrialCard"'),friendIdx=html.indexOf('id="friendShareCard"');
  assert.ok(dailyTrialIdx>=0&&friendIdx>dailyTrialIdx,'friend share card is a separate section after the Daily Trial card');
});

test('Hub publishes through server authority then reconstructs the exact frozen public link',async()=>{
  const app=await read('public/flare-s8b/account-app.mjs');
  assert.match(app,/adapter\.createBuilderChallenge\(targetHp\)/);
  assert.match(app,/buildPersistedFriendShareLink\(\{/);
  assert.match(app,/challenge,/);
  assert.match(app,/friendShareUrlIsSafe\(built\.url\)/);
  assert.doesNotMatch(app,/senderName:readyViewModel\.displayName[\s\S]{0,100}effectiveHp:readyViewModel\.runner\.stats\.hp/);
});

test('no new reward mutation: friend-share source never references wallet, ledger, Gold or claim RPCs',async()=>{
  const lib=await read('public/flare-s8b/friend-share.mjs');
  assert.doesNotMatch(lib,/wallet_ledger|reward_gold|claim_guest_run|claimGuestRun|purchase_progression_offer|delta_gold|\.rpc\(/i);
  const app=await read('public/flare-s8b/account-app.mjs');
  const friendSection=app.slice(app.indexOf('function resetFriendShare'),app.indexOf('function closePurchaseConfirmation'));
  assert.doesNotMatch(friendSection,/wallet_ledger|reward_gold|claim_guest_run|purchase_progression_offer|delta_gold/i);
});

test('no direct privileged browser write: friend-share module never touches Supabase tables or RPCs',async()=>{
  const lib=await read('public/flare-s8b/friend-share.mjs');
  assert.doesNotMatch(lib,/supabase|createClient|\.rpc\(|\.from\(|insert\(|update\(|delete\(/i);
});

test('friend-share module imports the frozen S8A builder-invite without redefining the invite/route contract',async()=>{
  const lib=await read('public/flare-s8b/friend-share.mjs');
  assert.match(lib,/from '\.\.\/flare-s8a\/builder-invite\.mjs'/);
  assert.doesNotMatch(lib,/encodeInviteCode|makeInviteUrl|new URL\('\/m\//);
});

test('Daily Trial OVERVIEW control is absent from the S8B Daily Trial page and app',async()=>{
  const html=await read('public/flare-s8b/daily-trial.html');
  const app=await read('public/flare-s8b/daily-trial-app.mjs');
  assert.doesNotMatch(html,/id="overview"|>OVERVIEW</);
  assert.doesNotMatch(app,/\$\('overview'\)/);
});

test('Daily Trial PAUSE control is retained in the S8B Daily Trial page and app',async()=>{
  const html=await read('public/flare-s8b/daily-trial.html');
  const app=await read('public/flare-s8b/daily-trial-app.mjs');
  assert.match(html,/id="pause"/);
  assert.match(app,/\$\('pause'\)\.addEventListener\('click'/);
});

test('removing OVERVIEW does not touch the frozen S7 renderer',async()=>{
  const renderer=await read('public/flare-s7/renderer.mjs');
  assert.ok(renderer.length>0);
  const app=await read('public/flare-s8b/daily-trial-app.mjs');
  assert.doesNotMatch(app,/renderer\.overview\s*=\s*!renderer\.overview/);
});

test('Practice is unchanged by this slice: no friend-share reference and its own OVERVIEW control untouched',async()=>{
  const practiceApp=await read('public/flare-s8b/practice-app.mjs');
  const practiceHtml=await read('public/flare-s8b/practice.html');
  assert.doesNotMatch(practiceApp,/friend-share|friendShare|buildFriendShareLink/i);
  assert.match(practiceHtml,/id="overview"/);
  assert.match(practiceApp,/\$\('overview'\)\.addEventListener/);
});

test('Friend Share touch targets meet the 44px minimum',async()=>{
  const css=await read('public/flare-s8b/account.css');
  assert.match(css,/#friendShareUrl\{[^}]*min-height:44px/);
  assert.match(css,/\.friend-share-actions button\{[^}]*min-height:44px/);
});


test('persisted friend links fail closed if server and frozen S8A invite codes disagree',()=>{
  const challenge={challenge_id:'challenge-a',runner_id:'warrior-l1',target_hp:60,invite_code:'Qs2Z',sender_name:'Ada'};
  const link=buildPersistedFriendShareLink({
    baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8b/',challenge,model
  });
  assert.equal(link.url,'https://think-2-thrive.com/m/Qs2Z?from=Ada');
  assert.throws(()=>buildPersistedFriendShareLink({
    baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8b/',
    challenge:{...challenge,invite_code:'UvVY'},model
  }),/BUILDER_CHALLENGE_CODE_MISMATCH/);
});

test('Builder publishing itself carries no Gold or Runner-power reward client authority',async()=>{
  const [app,adapter]=await Promise.all([
    read('public/flare-s8b/account-app.mjs'),
    read('public/flare-s8b/account-adapter.mjs')
  ]);
  const publish=app.slice(app.indexOf('async function generateFriendLink'),app.indexOf('async function openFriendShare'));
  assert.match(publish,/createBuilderChallenge\(targetHp\)/);
  assert.doesNotMatch(publish,/\bgold\b|wallet_ledger|runner_xp|equip_runner_item|purchase_progression_offer|runner_stat_upgrade_event/i);
  const create=adapter.slice(adapter.indexOf('async function createBuilderChallenge'),adapter.indexOf('async function loadAccountState'));
  assert.deepEqual((create.match(/p_target_hp/g)||[]).length,1);
  assert.doesNotMatch(create,/player_id|runner_id|sender|reward|gold|xp_amount/i);
});
