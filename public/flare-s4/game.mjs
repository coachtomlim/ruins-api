import {buildChallenge,deriveSlots,gridPath} from '../flare-s2/core.mjs';

export const S4_VERSION='web-flare-s4-0.1.0';
export const DEFAULTS=Object.freeze({enemyTypes:['goblin','skeleton','none'],potion:true,trap:false,targetHp:50,budget:100,roomId:'iron-labyrinth-01'});

const clone=value=>structuredClone(value);
const fnv1a=text=>{let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0}return h.toString(36).padStart(7,'0')};

export function applyGameModel(baseCatalog,model){
  if(!baseCatalog?.heroes?.warrior||!model?.runner||!model?.monsters||!model?.items)throw Error('S4 game model unavailable');
  const catalog=clone(baseCatalog),runner=model.runner,weapon=runner.weapon||{attack:0,defense:0};
  catalog.heroes.warrior.maxHp=runner.baseHp;
  catalog.heroes.warrior.damage=runner.baseAttack+(weapon.attack||0);
  catalog.heroes.warrior.armor=runner.baseDefense+(weapon.defense||0);
  for(const [id,spec] of Object.entries(model.monsters)){
    if(!catalog.enemies[id])throw Error(`Missing base monster: ${id}`);
    catalog.enemies[id].name=spec.name;catalog.enemies[id].maxHp=spec.hp;catalog.enemies[id].damage=spec.attack;catalog.enemies[id].armor=spec.defense;catalog.enemies[id].cost=spec.cost;
  }
  const potion=model.items['small-potion'];if(potion){catalog.items['small-potion']={...(catalog.items['small-potion']||{}),name:potion.name,kind:'heal',heal:potion.heal,cost:potion.cost}}
  const trap=model.items['spike-trap'];if(trap)catalog.items['spike-trap']={name:trap.name,kind:'trap',damage:trap.damage,cost:trap.cost,oneShot:trap.oneShot!==false};
  return catalog;
}

export function runnerSummary(model,catalog){
  const r=model.runner,h=catalog.heroes[r.hero],w=r.weapon||{};
  return Object.freeze({id:r.id,name:r.name,className:r.className,level:r.level,hero:r.hero,weapon:w.name||'Unarmed',baseAttack:r.baseAttack,weaponAttack:w.attack||0,baseDefense:r.baseDefense,weaponDefense:w.defense||0,hp:h.maxHp,attack:h.damage,defense:h.armor});
}
export function monsterSummary(id,model,catalog,runner){
  const m=model.monsters[id],c=catalog.enemies[id];if(!m||!c)throw Error(`Unknown monster: ${id}`);
  return Object.freeze({id,name:m.name,rating:m.rating,hp:c.maxHp,attack:c.damage,defense:c.armor,cost:c.cost,damageToRunner:Math.max(1,c.damage-runner.defense),runnerDamage:Math.max(1,runner.attack-c.armor)});
}
export function trapSummary(model){const t=model.items['spike-trap'];return Object.freeze({id:'spike-trap',name:t.name,damage:t.damage,cost:t.cost,oneShot:t.oneShot!==false})}

function nearestFree(path,index,used){
  for(let d=0;d<path.length;d++)for(const i of [index-d,index+d])if(i>0&&i<path.length-1){const p=path[i],k=p.join(',');if(!used.has(k)){used.add(k);return p}}
  return null;
}

export function buildS4Challenge({roomId,roomTitle,map,catalog,targetHp=DEFAULTS.targetHp,enemyTypes=DEFAULTS.enemyTypes,potion=DEFAULTS.potion,trap=DEFAULTS.trap,budget=DEFAULTS.budget}){
  const base=buildChallenge({roomId,roomTitle,map,catalog,targetHp:Number(targetHp),enemyTypes,potion,budget});
  const challenge=clone(base.challenge);let spent=base.spent;
  if(trap){
    const spec=catalog.items['spike-trap'];if(!spec)throw Error('Spike trap unavailable');
    const path=gridPath(map,challenge.spawn,challenge.exit);if(!path)throw Error('Trap route unavailable');
    const used=new Set([challenge.spawn.join(','),challenge.exit.join(','),...challenge.enemies.map(e=>e.at.join(',')),...challenge.items.map(i=>i.at.join(','))]);
    const at=nearestFree(path,Math.round((path.length-1)*.60),used);if(!at)throw Error('No legal spike-trap slot');
    spent+=spec.cost;if(spent>budget)throw Error(`Budget exceeded: ${spent}/${budget}`);
    challenge.items.push({id:'trap-1',type:'spike-trap',at});
  }
  challenge.id=`quick-${fnv1a(JSON.stringify({...challenge,id:undefined}))}`;
  const slots=deriveSlots(map,Math.max(1,enemyTypes.filter(x=>x&&x!=='none').length));
  return{challenge,spent,remaining:budget-spent,slots};
}
