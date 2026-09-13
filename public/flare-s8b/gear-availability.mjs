const clean=value=>String(value??'').trim();
export const GEAR_CHANNELS=Object.freeze(['PURCHASE','RUN_AWARD','FUTURE_TRANSFER']);

export function normalizeGearAvailability(record={}){
  const itemId=clean(record.itemId);if(!itemId)throw new Error('itemId is required');
  const channels=Object.freeze((record.channels||[]).map(clean).filter(Boolean));
  for(const channel of channels)if(!GEAR_CHANNELS.includes(channel))throw new Error(`Unsupported gear channel: ${channel}`);
  if(new Set(channels).size!==channels.length)throw new Error('Duplicate gear channel');
  return Object.freeze({itemId,channels});
}

export function gearAvailableFrom(record,channel){
  const availability=normalizeGearAvailability(record),target=clean(channel);
  if(!GEAR_CHANNELS.includes(target))throw new Error(`Unsupported gear channel: ${target}`);
  return availability.channels.includes(target);
}
