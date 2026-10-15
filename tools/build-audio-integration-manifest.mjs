import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const repo=join(dirname(fileURLToPath(import.meta.url)),'..');
const intake=process.env.FLARE_AUDIO_INTAKE||'G:\\My Drive\\Quick Dungeon\\Audio\\FLARE_V1_15_AUDIO_INTAKE_001';
const census=JSON.parse(await readFile(join(intake,'FLARE_V1_15_AUDIO_CENSUS.json'),'utf8'));
const pack=JSON.parse(await readFile(join(intake,'INITIAL_RECOMMENDED_NEXT_BUILD_PACK.json'),'utf8'));
const destinations={
  'shoot.ogg':'sfx/combat/shoot.ogg','arrow_wall.ogg':'sfx/combat/arrow_wall.ogg','block.ogg':'sfx/combat/block.ogg','male_hit.ogg':'sfx/player/male_hit.ogg','male_die.ogg':'sfx/player/male_die.ogg',
  'goblin_hit.ogg':'sfx/enemies/goblin_hit.ogg','goblin_die.ogg':'sfx/enemies/goblin_die.ogg','skeleton_hit.ogg':'sfx/enemies/skeleton_hit.ogg','skeleton_die.ogg':'sfx/enemies/skeleton_die.ogg',
  'zombie_hit.ogg':'sfx/enemies/zombie_hit.ogg','zombie_die.ogg':'sfx/enemies/zombie_die.ogg','antlion_hit.ogg':'sfx/enemies/antlion_hit.ogg','antlion_die.ogg':'sfx/enemies/antlion_die.ogg',
  'flying_loot.ogg':'sfx/loot/flying_loot.ogg','inventory_coins.ogg':'sfx/loot/inventory_coins.ogg','inventory_object.ogg':'sfx/loot/inventory_object.ogg','inventory_potion.ogg':'sfx/loot/inventory_potion.ogg','level_up.ogg':'sfx/loot/level_up.ogg','door_open.ogg':'sfx/interaction/door_open.ogg',
  'dungeon_theme.ogg':'music/dungeon_theme.ogg','battle_theme.ogg':'music/battle_theme.ogg','unrest_theme.ogg':'music/unrest_theme.ogg','safe_room_theme.ogg':'music/safe_room_theme.ogg','boss_theme.ogg':'music/boss_theme.ogg'
};
const byName=new Map(census.files.map(file=>[file.filename,file])),roles=Object.entries(pack).flatMap(([category,values])=>Object.entries(values).map(([role,value])=>({category,role,...value})));
const shipped=[];
for(const role of roles.filter(x=>x.licence_status==='RESOLVED')){
  const source=byName.get(role.filename),relative=destinations[role.filename];if(!source||!relative)throw Error(`Missing governed mapping for ${role.filename}`);
  const destination=`public/flare-s8a/audio/${relative}`,bytes=await readFile(join(repo,destination)),sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!==source.sha256)throw Error(`SHA mismatch for ${role.filename}`);
  shipped.push({semantic_role:role.role,category:role.category,filename:role.filename,canonical_source_path:`G:/My Drive/Flare-v1.15/${source.original_relative_path}`,intake_copy_path:`G:/My Drive/Quick Dungeon/Audio/FLARE_V1_15_AUDIO_INTAKE_001/${source.review_copy_relative_path}`,repository_destination:destination,bytes:bytes.length,sha256,licence_status:source.licence_status,licence:source.licence,creator:source.creator,attribution_required:source.attribution_required,attribution_text:source.attribution_text,source_credit_url:source.source_credit_url});
}
const blocked=roles.filter(x=>x.licence_status==='LICENCE_UNRESOLVED').map(x=>({semantic_role:x.role,category:x.category,filename:x.filename,status:'AUDIO_PENDING_LICENSE'}));
shipped.sort((a,b)=>a.repository_destination.localeCompare(b.repository_destination));blocked.sort((a,b)=>a.filename.localeCompare(b.filename));
const manifest={work_order:'FLARE_AUDIO_INTEGRATION_002',starting_sha:'7a436176a13cde60ab7a1a900511ff711aaf7e4e',canonical_flare_commit:census.summary.canonical_flare_commit||'2ef474f5f5f368628bc526f9e56f936dac743e49',generated_at:new Date().toISOString(),shipped_count:shipped.length,total_integrated_audio_bytes:shipped.reduce((sum,x)=>sum+x.bytes,0),licence_cleared_count:shipped.length,blocked_licence_unresolved_count:blocked.length,shipped,blocked};
await mkdir(join(repo,'docs/audio'),{recursive:true});await writeFile(join(repo,'docs/audio/FLARE_AUDIO_INTEGRATION_002_MANIFEST.json'),`${JSON.stringify(manifest,null,2)}\n`);
const lines=['# Flare Audio Runtime Attribution','','Shipped by `FLARE_AUDIO_INTEGRATION_002`. Canonical byte source: Flare v1.15 at commit `2ef474f5f5f368628bc526f9e56f936dac743e49`.','Credit reference: https://github.com/flareteam/flare-game/wiki/Credits','','Only shipped, licence-cleared files are listed. Licence-unresolved candidates are not included in runtime assets.','','| File | Creator | Licence | Required attribution |','|---|---|---|---|',...shipped.map(x=>`| \`${x.filename}\` | ${x.creator.replaceAll('|','\\|')} | ${x.licence.replaceAll('|','\\|')} | ${x.attribution_text.replaceAll('|','\\|')} |`),''];
await writeFile(join(repo,'public/flare-s8a/audio/ATTRIBUTION.md'),lines.join('\n'));
console.log(JSON.stringify({shipped:shipped.length,blocked:blocked.length,bytes:manifest.total_integrated_audio_bytes},null,2));
