import {customizePanelState,normalizeCustomizePanel} from './customize-panels.mjs';
import {buildBudgetViewModel} from './budget-view-model.mjs';

const freezeList=value=>Object.freeze((Array.isArray(value)?value:[]).map(x=>String(x)));

export function buildCustomizeViewModel({activePanel='monsters',usedBudget=0,totalBudget=100,monsters=[],traps=[],supports=[]}={}){
  const panel=normalizeCustomizePanel(activePanel),state=customizePanelState(panel),budget=buildBudgetViewModel({used:usedBudget,total:totalBudget});
  return Object.freeze({
    title:'CUSTOMIZE — OPTIONAL',
    instruction:'Tune one category at a time, then tap DONE.',
    activePanel:panel,
    tabs:state.tabs,
    budget,
    selections:Object.freeze({monsters:freezeList(monsters),traps:freezeList(traps),supports:freezeList(supports)}),
    primaryAction:'DONE',
    canFinish:budget.legal,
    mobileRule:'Show one category panel at a time. Keep the dungeon budget visible.'
  });
}
