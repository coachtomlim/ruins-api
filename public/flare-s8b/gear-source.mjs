export const GEAR_SOURCES=Object.freeze(['STARTER','PURCHASE','DROP','FUTURE_TRANSFER']);

const clean=value=>String(value??'').trim();

export function normalizeGearSource(record={}){
  const itemId=clean(record.itemId),slot=clean(record.slot),source=clean(record.source),sourceId=clean(record.sourceId);
  if(!itemId||!slot||!sourceId)throw new Error('Incomplete gear source record');
  if(!GEAR_SOURCES.includes(source))throw new Error(`Unsupported gear source: ${source}`);
  return Object.freeze({itemId,slot,source,sourceId});
}

export function gearSourceLabel(source){
  const labels={STARTER:'STARTER GEAR',PURCHASE:'ACQUIRED WITH GOLD',DROP:'DUNGEON DROP',FUTURE_TRANSFER:'TRANSFERRED'};
  const key=clean(source);if(!labels[key])throw new Error(`Unsupported gear source: ${key}`);return labels[key];
}
