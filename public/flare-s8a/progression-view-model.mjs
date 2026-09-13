import {quoteProgressionPurchase} from './progression-purchase.mjs';

const clean=value=>String(value??'').trim();
const nonNegative=value=>Math.max(0,Number(value)||0);

export function buildProgressionViewModel({runnerSnapshot,goldBalance=0,catalog}={}){
  if(!runnerSnapshot?.runnerId||!runnerSnapshot?.stats)throw new Error('runnerSnapshot is required');
  const balance=nonNegative(goldBalance);
  const stats=Object.freeze({hp:nonNegative(runnerSnapshot.stats.hp),attack:nonNegative(runnerSnapshot.stats.attack),defense:nonNegative(runnerSnapshot.stats.defense)});
  const statOffers=Object.freeze((catalog?.statUpgrades||[]).map(offer=>Object.freeze({...offer,quote:quoteProgressionPurchase({catalog,offerId:offer.id,goldBalance:balance})})));
  const equipment=Object.freeze((catalog?.equipment||[]).map(offer=>Object.freeze({...offer,quote:quoteProgressionPurchase({catalog,offerId:offer.id,goldBalance:balance})})));
  return Object.freeze({
    title:'UPGRADE YOUR RUNNER',
    runner:Object.freeze({id:runnerSnapshot.runnerId,name:clean(runnerSnapshot.runnerName)||runnerSnapshot.runnerId,level:nonNegative(runnerSnapshot.runnerLevel),stats}),
    goldBalance:balance,
    loadout:Object.freeze({weapon:runnerSnapshot.equipment?.weapon?.id||null,armor:runnerSnapshot.equipment?.armor?.id||null}),
    categories:Object.freeze(['STATS','EQUIPMENT','ARMOR']),
    statOffers,
    equipment
  });
}
