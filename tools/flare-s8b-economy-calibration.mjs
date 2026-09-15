import fs from 'node:fs';
import {applyRunnerModel,encounterCost,MONSTER_IDS,SUPPORT_IDS,TRAP_IDS} from '../public/flare-s7/game.mjs';
import {estimateEncounter} from '../public/flare-s7/calibration.mjs';

const base=JSON.parse(fs.readFileSync(new URL('../public/flare-p0/data/catalog.json',import.meta.url),'utf8'));
const model=JSON.parse(fs.readFileSync(new URL('../public/flare-s7/data/game.json',import.meta.url),'utf8'));
const catalog=applyRunnerModel(base,model,'warrior-l1');
const targets=Object.freeze([20,40,60,80]);
const budget=100;

function combinationsWithReplacement(values,length,start=0,prefix=[],out=[]){
  if(prefix.length===length){out.push([...prefix]);return out;}
  for(let i=start;i<values.length;i++)combinationsWithReplacement(values,length,i,[...prefix,values[i]],out);
  return out;
}

function subsets(values){
  const out=[];
  for(let mask=0;mask<(1<<values.length);mask++)out.push(values.filter((_,i)=>(mask&(1<<i))!==0));
  return out;
}

function enemySets(){
  const out=[[]];
  for(let count=1;count<=3;count++)out.push(...combinationsWithReplacement(MONSTER_IDS,count));
  return out;
}

function encounterFrom(enemyTypes,supportTypes,trapTypes){
  return Object.freeze({
    enemyTypes:Object.freeze([...enemyTypes,...Array(Math.max(0,3-enemyTypes.length)).fill('none')].slice(0,3)),
    supportTypes:Object.freeze([...supportTypes]),
    trapTypes:Object.freeze([...trapTypes])
  });
}

const encounters=[];
for(const enemies of enemySets())for(const supports of subsets(SUPPORT_IDS))for(const traps of subsets(TRAP_IDS)){
  const encounter=encounterFrom(enemies,supports,traps);
  const cost=encounterCost(catalog,encounter);
  if(cost<=budget)encounters.push(Object.freeze({encounter,cost}));
}

function runner({hpBonus=0,attackBonus=0,defenseBonus=0}={}){
  return Object.freeze({id:'warrior-l1',hp:100+hpBonus,attack:12+attackBonus,defense:1+defenseBonus});
}

function bestForTarget(spec,target){
  const r=runner(spec);
  let best=null;
  for(const row of encounters){
    const estimate=estimateEncounter({catalog,model,runnerId:r.id,runner:r,encounter:row.encounter});
    const delta=Math.abs(estimate.estimatedHpPercent-target);
    const candidate={target,estimatedHpPercent:estimate.estimatedHpPercent,delta:Number(delta.toFixed(1)),cost:row.cost,encounter:row.encounter};
    if(!best||candidate.delta<best.delta||(candidate.delta===best.delta&&candidate.cost<best.cost))best=candidate;
  }
  return Object.freeze(best);
}

function assess(spec){
  const results=targets.map(target=>bestForTarget(spec,target));
  const maxDelta=Math.max(...results.map(row=>row.delta));
  const band=maxDelta<=10?'PREFERRED':maxDelta<=15?'EDGE':'OUTSIDE';
  return Object.freeze({
    bonuses:Object.freeze({...spec}),
    effective:Object.freeze({hp:100+spec.hpBonus,attack:12+spec.attackBonus,defense:1+spec.defenseBonus}),
    maxDelta:Number(maxDelta.toFixed(1)),
    band,
    targets:Object.freeze(results)
  });
}

const matrix=[];
for(let hpBonus=0;hpBonus<=30;hpBonus+=5)for(let attackBonus=0;attackBonus<=3;attackBonus++)for(let defenseBonus=0;defenseBonus<=2;defenseBonus++)matrix.push(assess({hpBonus,attackBonus,defenseBonus}));

const focus=[
  {hpBonus:0,attackBonus:0,defenseBonus:0},
  {hpBonus:5,attackBonus:0,defenseBonus:0},
  {hpBonus:10,attackBonus:0,defenseBonus:0},
  {hpBonus:20,attackBonus:0,defenseBonus:0},
  {hpBonus:0,attackBonus:1,defenseBonus:0},
  {hpBonus:0,attackBonus:2,defenseBonus:0},
  {hpBonus:0,attackBonus:0,defenseBonus:1},
  {hpBonus:0,attackBonus:0,defenseBonus:2},
  {hpBonus:5,attackBonus:0,defenseBonus:1},
  {hpBonus:10,attackBonus:1,defenseBonus:0},
  {hpBonus:0,attackBonus:1,defenseBonus:1},
  {hpBonus:20,attackBonus:1,defenseBonus:0},
  {hpBonus:10,attackBonus:1,defenseBonus:1}
].map(assess);

const output={
  version:'s8b-economy-calibration-001',
  modelVersion:model.version,
  calibrationVersion:'web-flare-s7-calibration-0.1.0',
  budget,
  targets,
  legalEncounterCount:encounters.length,
  classification:Object.freeze({preferred:'max target delta <= 10',edge:'10 < max target delta <= 15',outside:'max target delta > 15'}),
  baseline:Object.freeze({hp:100,attack:12,defense:1}),
  focus,
  matrix
};

console.log(JSON.stringify(output,null,2));
