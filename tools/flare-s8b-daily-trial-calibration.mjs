import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {parseMap} from '../public/flare-p0/src/core/flare.mjs';
import {Simulation} from '../public/flare-s7/simulation.mjs';
import {applyRunnerModel,buildS7Challenge} from '../public/flare-s7/game.mjs';

const ROOT=new URL('../',import.meta.url);
const roomSpecs=Object.freeze([
  Object.freeze({id:'iron-labyrinth-01',name:'Pillar Court',file:'public/flare-s7/data/rooms/room1.txt'}),
  Object.freeze({id:'iron-labyrinth-03',name:'Crossed Court',file:'public/flare-s7/data/rooms/room3.txt'}),
  Object.freeze({id:'iron-labyrinth-07',name:'Broken Gallery',file:'public/flare-s7/data/rooms/room7.txt'}),
  Object.freeze({id:'iron-labyrinth-08',name:'Scattered Hall',file:'public/flare-s7/data/rooms/room8.txt'}),
  Object.freeze({id:'iron-labyrinth-15',name:'Vaulted Crossing',file:'public/flare-s7/data/rooms/room15.txt'}),
  Object.freeze({id:'iron-labyrinth-18',name:'Twin Lanes',file:'public/flare-s7/data/rooms/room18.txt'})
]);

export const DAILY_TRIAL_VERSION='s8b-daily-trial-001';
export const DAILY_TRIAL_REWARD_GOLD=5;
export const DAILY_TRIAL_ENCOUNTER=Object.freeze({
  enemyTypes:Object.freeze(['goblin','skeleton','none']),
  supportTypes:Object.freeze(['small-potion']),
  trapTypes:Object.freeze([])
});
export const PREFERRED_RUNNER_STATES=Object.freeze([
  Object.freeze({hp:100,attack:12,defense:1}),
  Object.freeze({hp:100,attack:12,defense:2}),
  Object.freeze({hp:100,attack:13,defense:1}),
  Object.freeze({hp:105,attack:12,defense:1}),
  Object.freeze({hp:105,attack:12,defense:2}),
  Object.freeze({hp:105,attack:13,defense:1}),
  Object.freeze({hp:110,attack:12,defense:1}),
  Object.freeze({hp:115,attack:12,defense:1}),
  Object.freeze({hp:120,attack:12,defense:1})
]);

function withRunner(base,state){
  const catalog=structuredClone(base);
  catalog.heroes.warrior.maxHp=state.hp;
  catalog.heroes.warrior.damage=state.attack;
  catalog.heroes.warrior.armor=state.defense;
  return catalog;
}

function runToTerminal(map,challenge,catalog){
  const sim=new Simulation(map,challenge,catalog);
  sim.start();
  for(let i=0;i<=60*60+5&&sim.status==='running';i++)sim.step();
  return sim.result();
}

async function main(){
  const [baseCatalog,gameModel]=await Promise.all([
    readFile(new URL('public/flare-p0/data/catalog.json',ROOT),'utf8').then(JSON.parse),
    readFile(new URL('public/flare-s7/data/game.json',ROOT),'utf8').then(JSON.parse)
  ]);
  const legacy=applyRunnerModel(baseCatalog,gameModel,gameModel.defaultRunner);
  const rows=[];
  for(const roomSpec of roomSpecs){
    const text=await readFile(new URL(roomSpec.file,ROOT),'utf8');
    const map=parseMap(text);map.id=roomSpec.id;map.name=roomSpec.name;
    for(const state of PREFERRED_RUNNER_STATES){
      const catalog=withRunner(legacy,state);
      const built=buildS7Challenge({
        roomId:roomSpec.id,
        roomTitle:roomSpec.name,
        map,catalog,targetHp:60,
        encounter:DAILY_TRIAL_ENCOUNTER,
        budget:100
      });
      const result=runToTerminal(map,built.challenge,catalog);
      rows.push(Object.freeze({
        roomId:roomSpec.id,
        roomName:roomSpec.name,
        hp:state.hp,attack:state.attack,defense:state.defense,
        spent:built.spent,
        status:result.status,
        finishHp:result.hp,
        finishHpPercent:Number((result.hp/result.maxHp*100).toFixed(1)),
        gold:result.gold,
        seconds:result.seconds,
        ticks:result.ticks
      }));
    }
  }
  const failures=rows.filter(row=>row.status!=='cleared');
  const seconds=rows.map(row=>row.seconds);
  const report={
    version:DAILY_TRIAL_VERSION,
    rewardGold:DAILY_TRIAL_REWARD_GOLD,
    encounter:DAILY_TRIAL_ENCOUNTER,
    combinations:rows.length,
    clearCount:rows.length-failures.length,
    failureCount:failures.length,
    minSeconds:Math.min(...seconds),
    maxSeconds:Math.max(...seconds),
    rows
  };
  console.log(JSON.stringify(report,null,2));
  if(failures.length){
    console.error(JSON.stringify({failures},null,2));
    process.exitCode=2;
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
