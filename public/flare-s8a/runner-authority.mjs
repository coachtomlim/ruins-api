// Friend Feedback 002B1 — the authority contract 002C's correlated Friend runtime must use.
// Mirrors submit_builder_challenge_result_v2's own transitional max-HP authority so the client
// can never submit a result the server will reject, and so the Runner inspector never shows a
// value the runtime doesn't actually use: for a correlated (c=) challenge with a valid snapshot,
// snapshot HP/ATK/DEF/equipment ARE the Runner, not merely a display label over template stats.
// Legacy links without c=, and historical correlated challenges with no captured snapshot, fall
// back to the same local/template Runner model as before — never invented, never guessed.
const boundedInt=(value,min,max)=>{const n=Number(value);return Number.isInteger(n)&&n>=min&&n<=max?n:null};

export function resolveRunnerAuthority({snapshot,templateMaxHp,templateAttack,templateDefense}={}){
  const stats=snapshot?.runner?.stats;
  const hp=boundedInt(stats?.hp,1,10000);
  if(hp===null){
    return Object.freeze({
      source:'legacy',
      maxHp:boundedInt(templateMaxHp,1,10000),
      attack:boundedInt(templateAttack,0,10000),
      defense:boundedInt(templateDefense,0,10000),
      equipment:null
    });
  }
  const attack=boundedInt(stats?.attack,0,10000);
  const defense=boundedInt(stats?.defense,0,10000);
  const equipment=Array.isArray(snapshot.equipment)?Object.freeze(snapshot.equipment.map(slot=>Object.freeze({...slot}))):Object.freeze([]);
  return Object.freeze({source:'snapshot',maxHp:hp,attack,defense,equipment});
}
