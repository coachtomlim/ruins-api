import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {builderProgressionView,challengeJournalRows,BUILDER_TARGET_OPTIONS} from '../public/flare-s8b/builder-progression-view.mjs';
import {buildPersistedFriendShareLink} from '../public/flare-s8b/friend-share.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const model=JSON.parse(await read('public/flare-s7/data/game.json'));

test('Builder target selector exposes every governed 5..95 precision target',()=>{
  assert.deepEqual(BUILDER_TARGET_OPTIONS,Array.from({length:19},(_,index)=>(index+1)*5));
});

test('Builder progression uses the governed cosmetic XP thresholds',()=>{
  const vm=builderProgressionView({
    total_builder_xp:30,builder_level:2,level_threshold:20,next_level_threshold:50,
    xp_remaining:20,max_level:false,published_challenges:3
  });
  assert.equal(vm.levelLabel,'BUILDER LEVEL 2');
  assert.equal(vm.xpLabel,'30 / 50 BUILDER XP');
  assert.equal(vm.publishedLabel,'3 CHALLENGES PUBLISHED');
  assert.equal(vm.progressPercent,Math.round((10/30)*100));
});

test('Builder max level is display-only and shows a full bar',()=>{
  const vm=builderProgressionView({
    total_builder_xp:220,builder_level:5,level_threshold:180,next_level_threshold:180,
    xp_remaining:0,max_level:true,published_challenges:22
  });
  assert.equal(vm.levelLabel,'BUILDER LEVEL 5 · MAX');
  assert.equal(vm.progressPercent,100);
});

test('Challenge journal rejects malformed public challenge records',()=>{
  assert.throws(()=>challengeJournalRows([{challenge_id:'x',runner_id:'warrior-l1',target_hp:60,invite_code:'too-long',sender_name:'Ada',created_at:'2026-09-24T00:00:00Z'}]),/INVALID_BUILDER_CHALLENGE_ROW/);
  assert.throws(()=>challengeJournalRows([{challenge_id:'x',runner_id:'warrior-l1',target_hp:61,invite_code:'Qs2Z',sender_name:'Ada',created_at:'2026-09-24T00:00:00Z'}]),/INVALID_BUILDER_CHALLENGE_TARGET/);
});

test('Persisted challenge link must reproduce the server invite code exactly',()=>{
  const challenge={challenge_id:'c1',runner_id:'warrior-l1',target_hp:60,invite_code:'Qs2Z',sender_name:'Ada'};
  const link=buildPersistedFriendShareLink({baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8b/',challenge,model});
  assert.equal(link.code,'Qs2Z');
  assert.equal(link.url,'https://think-2-thrive.com/m/Qs2Z?from=Ada');
  assert.throws(
    ()=>buildPersistedFriendShareLink({baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8b/',challenge:{...challenge,invite_code:'UvVY'},model}),
    /BUILDER_CHALLENGE_CODE_MISMATCH/
  );
});

test('Migration creates append-only Builder challenge and XP authority with no client writes',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_builder_progression_challenge_journal.sql');
  assert.match(sql,/create table if not exists public\.builder_challenge/i);
  assert.match(sql,/create table if not exists public\.builder_xp_event/i);
  assert.match(sql,/amount integer not null check \(amount = 10\)/i);
  assert.match(sql,/reason text not null check \(reason = 'challenge_publish'\)/i);
  assert.match(sql,/revoke all on table public\.builder_challenge from anon, authenticated/i);
  assert.match(sql,/grant select on table public\.builder_challenge to authenticated/i);
  assert.match(sql,/revoke all on table public\.builder_xp_event from anon, authenticated/i);
  assert.match(sql,/grant select on table public\.builder_xp_event to authenticated/i);
  assert.doesNotMatch(sql,/grant (?:insert|update|delete) on table public\.(?:builder_challenge|builder_xp_event)/i);
});

test('Builder level curve is exactly 0/20/50/100/180',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_builder_progression_challenge_journal.sql');
  assert.match(sql,/when coalesce\(p_xp,0\) >= 180 then 5/);
  assert.match(sql,/when coalesce\(p_xp,0\) >= 100 then 4/);
  assert.match(sql,/when coalesce\(p_xp,0\) >= 50 then 3/);
  assert.match(sql,/when coalesce\(p_xp,0\) >= 20 then 2/);
});

test('SQL invite-code twin is pinned to frozen S8A version-2 encoding constants',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_builder_progression_challenge_journal.sql');
  assert.match(sql,/v_payload := \(2 << 7\) \| \(v_runner << 5\) \| v_target_index/);
  assert.match(sql,/v_x := v_payload # 858/);
  assert.match(sql,/v_x := v_x \* 107 \+ 41/);
  assert.match(sql,/v_x := v_x \* 59 \+ 13/);
  assert.match(sql,/v_check := \(v_x & 16383\)/);
});

test('Create challenge derives owner/Runner/sender and awards +10 Builder XP only on first unique design',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_builder_progression_challenge_journal.sql');
  const body=sql.slice(sql.indexOf('create or replace function public.create_builder_challenge'),sql.indexOf('revoke all on function public.create_builder_challenge'));
  assert.match(body,/v_player uuid := auth\.uid\(\)/);
  assert.match(body,/get_account_runner_state\(null::uuid\)/);
  assert.match(body,/v_profile\.display_name/);
  assert.match(body,/where c\.owner_player_id = v_player[\s\S]*c\.runner_id = v_invite_runner[\s\S]*c\.target_hp = p_target_hp/);
  assert.match(body,/builder_xp_event/);
  assert.match(body,/10,'challenge_publish'/);
  assert.match(body,/security definer[\s\S]*set search_path = ''/i);
});

test('Known frozen S8A sample warrior-l3 @ 60% remains UvVY in source contract',async()=>{
  const flow=await read('public/flare-s8a/flow.mjs');
  assert.match(flow,/const version=\(payload>>>7\)&7;if\(version!==2\)/);
  const link=buildPersistedFriendShareLink({
    baseUrl:'https://think-2-thrive.com/quick-dungeon/flare-s8b/',
    challenge:{challenge_id:'c2',runner_id:'warrior-l3',target_hp:60,invite_code:'UvVY',sender_name:'Tom'},
    model
  });
  assert.equal(link.url,'https://think-2-thrive.com/m/UvVY?from=Tom');
});

test('Builder progression is cosmetic: migration never mutates Gold, Runner XP, stats or loadout',async()=>{
  const sql=await read('supabase/migrations/20260924_s9_builder_progression_challenge_journal.sql');
  assert.doesNotMatch(sql,/wallet_ledger|runner_xp_event|runner_stat_upgrade_event|runner_loadout\s+set|equip_runner_item/i);
});

test('Browser adapter uses governed Builder RPCs and no direct Builder table writes',async()=>{
  const adapter=await read('public/flare-s8b/account-adapter.mjs');
  assert.match(adapter,/rpc\('get_builder_progression'/);
  assert.match(adapter,/rpc\('get_builder_challenges'/);
  assert.match(adapter,/rpc\('create_builder_challenge'/);
  assert.doesNotMatch(adapter,/from\('builder_(?:challenge|xp_event)'\)/);
});

test('Hub includes target selection, Builder progression and persistent Challenge Journal',async()=>{
  const html=await read('public/flare-s8b/index.html');
  for(const id of ['builderLevel','builderXp','builderProgressionFill','builderPublished','friendShareTarget','challengeJournalList'])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/PUBLISH FRIEND CHALLENGE/);
  for(const value of BUILDER_TARGET_OPTIONS)assert.match(html,new RegExp(`value="${value}"`));
});

test('Builder progression does not claim friend completion tracking',async()=>{
  const [html,sql]=await Promise.all([
    read('public/flare-s8b/index.html'),
    read('supabase/migrations/20260924_s9_builder_progression_challenge_journal.sql')
  ]);
  assert.doesNotMatch(html,/friend completed|completion verified|completed by friend/i);
  assert.doesNotMatch(sql,/friend_completion|challenge_complete|completion_reward/i);
});


test('Builder Level 5 is reachable through normal UI without hidden target values',()=>{
  const maxUniqueDesignXp=BUILDER_TARGET_OPTIONS.length*10;
  assert.equal(maxUniqueDesignXp,190);
  assert.ok(maxUniqueDesignXp>=180,'the visible target range must permit Level 5 on one governed Runner tier');
});
