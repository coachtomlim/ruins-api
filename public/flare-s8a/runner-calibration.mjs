const finite=value=>{const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error('Runner calibration stats must be finite and non-negative');return n};

export function calibrationRunnerFromSnapshot(snapshot={}){
  if(!snapshot.runnerId||!snapshot.stats)throw new Error('Runner snapshot is required');
  return Object.freeze({
    id:String(snapshot.runnerId),
    name:String(snapshot.runnerName||snapshot.runnerId),
    level:finite(snapshot.runnerLevel||0),
    hp:finite(snapshot.stats.hp),
    attack:finite(snapshot.stats.attack),
    defense:finite(snapshot.stats.defense),
    progressionVersion:Number(snapshot.version)||1,
    rulesVersion:String(snapshot.rulesVersion||''),
    contentVersion:String(snapshot.contentVersion||'')
  });
}

export function progressionCalibrationKey(snapshot={}){
  const r=calibrationRunnerFromSnapshot(snapshot);
  return `${r.id}|${r.hp}|${r.attack}|${r.defense}|${r.progressionVersion}|${r.rulesVersion}|${r.contentVersion}`;
}
