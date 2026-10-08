import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pageIndex,installPagedSelector} from '../public/flare-s8a/paged-selector.mjs';
import {applyRunnerModel,runnerSummary,encounterCost} from '../public/flare-s71/game.mjs';
import {estimateEncounter} from '../public/flare-s71/calibration.mjs';
import {buildCustomizationCatalog} from '../public/flare-s8a/catalog-view-model.mjs';

class Element{
  children=[];listeners={};attributes={};checked=false;textContent='';
  classList={values:new Set(),add:(v)=>this.classList.values.add(v),toggle:(v,on)=>on?this.classList.values.add(v):this.classList.values.delete(v)};
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node)}}
  querySelector(selector){return this.children.find(node=>node.tag===selector)}
  setAttribute(key,value){this.attributes[key]=value}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn)}
  dispatchEvent(event){for(const fn of this.listeners[event.type]||[])fn(event);if(event.bubbles)this.parentElement?.dispatchEvent(event)}
  click(){this.dispatchEvent({type:'click',preventDefault(){},stopPropagation(){}})}
}
for(const [kind,count] of [['trap',2],['support',3],['monster for guard 1',5]])test(`${kind}: all pages reachable; paging never selects; explicit selection updates existing inputs`,()=>{
  const old=globalThis.document;globalThis.document={createElement:tag=>Object.assign(new Element(),{tag})};
  try{
    const parent=new Element(),row=new Element();parent.append(row);
    for(let i=0;i<count;i++){const card=new Element(),input=Object.assign(new Element(),{tag:'input',type:kind.startsWith('monster')?'radio':'checkbox'});card.append(input,Object.assign(new Element(),{tag:'strong',textContent:`Option ${i}`}));row.append(card)}
    let changes=0;row.addEventListener('change',()=>changes++);const refresh=installPagedSelector(row,kind),nav=parent.children[1];
    assert.equal(nav.children[0].attributes['aria-label'],`Previous ${kind}`);
    assert.equal(nav.children[2].attributes['aria-label'],`Next ${kind}`);
    for(let i=0;i<count;i++){assert(row.children[i].classList.values.has('is-current-page'));assert.equal(nav.children[1].textContent,`${i+1} / ${count}`);nav.children[2].click()}
    assert(row.children[0].classList.values.has('is-current-page'));nav.children[0].click();assert(row.children[count-1].classList.values.has('is-current-page'));
    assert.equal(changes,0);assert(row.children.every(card=>!card.querySelector('input').checked));
    const card=row.children[count-1],action=card.children.at(-1);action.click();assert(card.querySelector('input').checked);assert.equal(changes,1);
    // 002E7 Part K: a selected monster slot now shows REMOVE too (not a duplicate "SELECTED"
    // badge) — clicking REMOVE on a real guard row falls back to that row's own EMPTY/none card,
    // asserted below in a dedicated test since this synthetic harness has no EMPTY card of its own.
    refresh();assert.equal(action.textContent,'REMOVE');
    if(!kind.startsWith('monster')){action.click();assert(!card.querySelector('input').checked);assert.equal(changes,2);assert.equal(action.textContent,'SELECT')}
  }finally{globalThis.document=old}
});
test('002E7 Part K: REMOVE on a selected monster guard slot safely falls back to that guard\'s own EMPTY/none card, never leaving the group unset',()=>{
  const old=globalThis.document;globalThis.document={createElement:tag=>Object.assign(new Element(),{tag})};
  try{
    const parent=new Element(),row=new Element();parent.append(row);
    const emptyInput=Object.assign(new Element(),{tag:'input',type:'radio',name:'guard-0',value:'none',checked:true});
    const emptyCard=new Element();emptyCard.append(emptyInput,Object.assign(new Element(),{tag:'strong',textContent:'EMPTY'}));row.append(emptyCard);
    const goblinInput=Object.assign(new Element(),{tag:'input',type:'radio',name:'guard-0',value:'goblin'});
    const goblinCard=new Element();goblinCard.append(goblinInput,Object.assign(new Element(),{tag:'strong',textContent:'Goblin'}));row.append(goblinCard);
    row.querySelector=selector=>row.children.flatMap(c=>c.children).find(node=>{
      if(node.tag!=='input')return false;
      const m=/input\[name="([^"]+)"\]\[value="([^"]+)"\]/.exec(selector);
      return m?node.attributes.name===m[1]&&node.attributes.value===m[2]:false;
    });
    emptyInput.attributes.name='guard-0';emptyInput.attributes.value='none';goblinInput.attributes.name='guard-0';goblinInput.attributes.value='goblin';
    let changes=0;row.addEventListener('change',()=>changes++);installPagedSelector(row,'monster for guard 1');
    const goblinAction=goblinCard.children.at(-1);goblinAction.click();
    assert.equal(goblinInput.checked,true);assert.equal(changes,1);
    goblinAction.click();
    assert.equal(emptyInput.checked,true,'REMOVE must select the EMPTY/none card for this guard, never leave the slot unset');
    assert.equal(changes,2);
  }finally{globalThis.document=old}
});
test('wrap arithmetic handles first/last pages and empty lists',()=>{assert.equal(pageIndex(0,-1,3),2);assert.equal(pageIndex(2,1,3),0);assert.equal(pageIndex(0,1,0),0)});
for(const kind of ['traps','supports'])test(`${kind}: actual catalog selection/removal immediately updates governed budget and estimate`,()=>{
  const model=JSON.parse(readFileSync('public/flare-s7/data/game.json','utf8'));
  const catalog=applyRunnerModel(JSON.parse(readFileSync('public/flare-p0/data/catalog.json','utf8')),model,'warrior-l1'),runner=runnerSummary(model,'warrior-l1',catalog);
  const vm=buildCustomizationCatalog({model,catalog,runnerId:'warrior-l1',runner});
  const old=globalThis.document;globalThis.document={createElement:tag=>Object.assign(new Element(),{tag})};
  try{
    const parent=new Element(),row=new Element();parent.append(row);
    for(const item of vm[kind]){const card=new Element();card.append(Object.assign(new Element(),{tag:'input',type:'checkbox',value:item.id}),Object.assign(new Element(),{tag:'strong',textContent:item.label}));row.append(card)}
    const state=()=>({enemyTypes:['goblin','skeleton','none'],trapTypes:kind==='traps'?row.children.filter(c=>c.querySelector('input').checked).map(c=>c.querySelector('input').value):[],supportTypes:kind==='supports'?row.children.filter(c=>c.querySelector('input').checked).map(c=>c.querySelector('input').value):[]});
    const calculate=()=>({budget:encounterCost(catalog,state()),estimate:estimateEncounter({catalog,model,runnerId:'warrior-l1',runner,encounter:state()}).estimatedHpPercent});
    let displayed=calculate();row.addEventListener('change',()=>{displayed=calculate()});installPagedSelector(row,kind==='traps'?'trap':'support');
    const baseline=calculate();for(const card of row.children){const action=card.children.at(-1);action.click();assert(displayed.budget>baseline.budget);assert.notEqual(displayed.estimate,baseline.estimate);action.click();assert.deepEqual(displayed,baseline)}
  }finally{globalThis.document=old}
});
test('mobile paging is width-scoped and retains desktop cards and existing calculation authority',()=>{
  const css=readFileSync('public/flare-s8a/style.css','utf8'),source=readFileSync('public/flare-s8a/challenge.mjs','utf8');
  assert.match(css,/@media\(max-width:540px\)/);assert.match(css,/\.paged-card-row\{[^}]*overflow:visible/);assert.match(css,/\.paged-card-row \.card\.is-current-page\{display:grid/);
  // 002E7 Part L: nav buttons are now compact round [‹]/[›] controls (not full-width 44px bars),
  // but touch targets stay practical (min 40px) and the SELECT/REMOVE action is still full-width.
  assert.match(css,/\.selector-nav-btn\{min-height:40px;min-width:40px/);assert.match(css,/\.selector-action\{display:block;width:100%;min-height:40px\}/);
  assert.match(source,/control.addEventListener\('change',\(\)=>\{activePreset=null;session=setEncounter\(session,encounter\(\)\);show\(\);\}\)/);
  assert.match(source,/estimatedHpPercent:estimateGoverned/);assert.match(source,/usedBudget:e|usedBudget\(e\)/);
  assert.match(source,/installPagedSelector\(row,kind==='traps'\?'trap':'support'\)/);
});
