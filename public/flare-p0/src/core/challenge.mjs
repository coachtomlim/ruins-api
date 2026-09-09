import {Navigation} from './navigation.mjs';
export const RULES_VERSION = 'web-flare-0.2.0';
const integer = (n,min,max) => Number.isInteger(n) && n>=min && n<=max;
function fields(value, allowed, label) {
  if (!value || typeof value!=='object' || Array.isArray(value)) throw Error(`Invalid ${label}`);
  for(const k of Object.keys(value)) if(!allowed.includes(k)) throw Error(`Unknown ${label} field: ${k}`);
}
/** The catalogue owns costs/stats. A submitted challenge cannot override either. */
export function validateChallenge(ch, map, catalog) {
  fields(ch,['version','rules','id','title','room','hero','spawn','exit','budget','targetHp','enemies','items'], 'challenge');
  if(ch.version!==1 || ch.rules!==RULES_VERSION) throw Error('Unsupported challenge/rules version');
  if(!/^[a-z0-9-]{1,64}$/.test(ch.id)||typeof ch.title!=='string'||ch.title.length>80) throw Error('Invalid challenge identity');
  if(ch.room!==map.id || !Object.hasOwn(catalog.heroes,ch.hero)) throw Error('Unknown room/hero');
  if(!integer(ch.budget,0,100) || !integer(ch.targetHp,1,100)) throw Error('Invalid budget/target');
  if(!Array.isArray(ch.enemies) || ch.enemies.length>12 || !Array.isArray(ch.items) || ch.items.length>8) throw Error('Entity count limit exceeded');
  const nav=new Navigation(map), ids=new Set(), positions=new Set();
  const position=(p,label)=>{
    if(!Array.isArray(p)||p.length!==2||!p.every(Number.isInteger)||!nav.open(p[0],p[1])) throw Error(`${label} is not on walkable ground`);
    const key=p.join(',');if(positions.has(key))throw Error(`Overlapping placement: ${label}`);positions.add(key);
    return {x:p[0]+.5,y:p[1]+.5};
  };
  const spawn=position(ch.spawn,'Hero spawn');position(ch.exit,'Exit');let spent=0;
  for(const [list,registry,kind] of [[ch.enemies,catalog.enemies,'enemy'],[ch.items,catalog.items,'item']])for(const entity of list){
    fields(entity,['id','type','at'],kind);
    if(!/^[a-z0-9-]{1,48}$/.test(entity.id)||ids.has(entity.id)||['hero','exit'].includes(entity.id)||entity.id.startsWith('loot-'))throw Error('Duplicate/invalid entity ID');ids.add(entity.id);
    if(!Object.hasOwn(registry,entity.type))throw Error(`Unknown ${kind}: ${entity.type}`);
    const p=position(entity.at,entity.id);spent+=registry[entity.type].cost;
    if(!nav.path(spawn,p))throw Error(`Unreachable placement: ${entity.id}`);
  }
  if(spent>ch.budget)throw Error(`Budget exceeded: ${spent}/${ch.budget}`);
  if(!nav.path(spawn,{x:ch.exit[0]+.5,y:ch.exit[1]+.5}))throw Error('Unreachable exit');
  return {spent,remaining:ch.budget-spent};
}
export function canonicalChallenge(ch) {
  return JSON.stringify({version:ch.version,rules:ch.rules,id:ch.id,title:ch.title,room:ch.room,hero:ch.hero,
    spawn:ch.spawn,exit:ch.exit,budget:ch.budget,targetHp:ch.targetHp,
    enemies:ch.enemies.map(e=>({id:e.id,type:e.type,at:e.at})),items:ch.items.map(e=>({id:e.id,type:e.type,at:e.at}))});
}
