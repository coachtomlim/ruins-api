export const CUSTOMIZE_PANELS=Object.freeze({MONSTERS:'monsters',TRAPS:'traps',SUPPORTS:'supports'});
const ORDER=Object.freeze(Object.values(CUSTOMIZE_PANELS));

export function normalizeCustomizePanel(value){return ORDER.includes(value)?value:CUSTOMIZE_PANELS.MONSTERS;}
export function selectCustomizePanel(current,next){return normalizeCustomizePanel(next);}
export function customizePanelState(active){
  const value=normalizeCustomizePanel(active);
  return Object.freeze({active:value,tabs:Object.freeze(ORDER.map(id=>Object.freeze({id,active:id===value}))) });
}
