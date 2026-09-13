import {MONSTER_IDS,TRAP_IDS,SUPPORT_IDS,monsterSummary,itemSummary} from '../flare-s7/game.mjs';

export function buildCustomizationCatalog({model,catalog,runnerId,runner}={}){
  if(!model||!catalog||!runner)throw new Error('model, catalog and runner are required');
  const monsters=MONSTER_IDS.map(id=>{const m=monsterSummary(id,model,runnerId,catalog,runner);return Object.freeze({id,label:m.name,cost:m.cost,role:m.role||m.rating||'',summary:`HP ${m.hp} · ATK ${m.attack} · DEF ${m.defense}`,impact:`Hits Hero for ${m.damageToRunner}`})});
  const traps=TRAP_IDS.map(id=>{const t=itemSummary(id,model);const effect=t.armorPiercing?`${t.damage} damage · ignores DEF`:`${t.damage} raw damage · DEF applies`;return Object.freeze({id,label:t.name,cost:t.cost,summary:`${effect} · one use`})});
  const supports=SUPPORT_IDS.map(id=>{const s=itemSummary(id,model);return Object.freeze({id,label:s.name,cost:s.cost,summary:s.label||s.name})});
  return Object.freeze({monsters:Object.freeze(monsters),traps:Object.freeze(traps),supports:Object.freeze(supports)});
}
