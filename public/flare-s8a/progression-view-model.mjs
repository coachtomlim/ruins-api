import {quoteProgressionPurchase} from './progression-purchase.mjs';
import {RUNNER_EQUIPMENT_SLOTS,RUNNER_ARMOR_SLOTS} from './runner-progression.mjs';

const clean=value=>String(value??'').trim();
const nonNegative=value=>Math.max(0,Number(value)||0);

export function buildProgressionViewModel({runnerSnapshot,goldBalance=0,catalog}={}){
  if(!runnerSnapshot?.runnerId||!runnerSnapshot?.stats)throw new Error('runnerSnapshot is required');
  const balance=nonNegative(goldBalance);
  const stats=Object.freeze({hp:nonNegative(runnerSnapshot.stats.hp),attack:nonNegative(runnerSnapshot.stats.attack),defense:nonNegative(runnerSnapshot.stats.defense)});
  const statOffers=Object.freeze((catalog?.statUpgrades||[]).map(offer=>Object.freeze({...offer,quote:quoteProgressionPurchase({catalog,offerId:offer.id,goldBalance:balance})})));
  const allEquipment=Object.freeze((catalog?.equipment||[]).map(offer=>Object.freeze({...offer,quote:quoteProgressionPurchase({catalog,offerId:offer.id,goldBalance:balance})})));
  const loadout=Object.freeze(Object.fromEntries(RUNNER_EQUIPMENT_SLOTS.map(slot=>[slot,runnerSnapshot.equipment?.[slot]?.id||null])));
  return Object.freeze({
    title:'UPGRADE YOUR RUNNER',
    runner:Object.freeze({id:runnerSnapshot.runnerId,name:clean(runnerSnapshot.runnerName)||runnerSnapshot.runnerId,level:nonNegative(runnerSnapshot.runnerLevel),stats}),
    goldBalance:balance,
    loadout,
    categories:Object.freeze(['STATS','EQUIPMENT','ARMOR']),
    statOffers,
    equipmentOffers:Object.freeze(allEquipment.filter(offer=>!RUNNER_ARMOR_SLOTS.includes(offer.slot))),
    armorOffers:Object.freeze(allEquipment.filter(offer=>RUNNER_ARMOR_SLOTS.includes(offer.slot))),
    emptyArmorSlots:Object.freeze(RUNNER_ARMOR_SLOTS.filter(slot=>!loadout[slot]))
  });
}
