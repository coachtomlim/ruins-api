import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pageIndex,installPagedSelector} from '../public/flare-s8a/paged-selector.mjs';

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
    refresh();assert.equal(action.textContent,kind.startsWith('monster')?'SELECTED':'REMOVE');
    if(!kind.startsWith('monster')){action.click();assert(!card.querySelector('input').checked);assert.equal(changes,2);assert.equal(action.textContent,'SELECT')}
  }finally{globalThis.document=old}
});
test('wrap arithmetic handles first/last pages and empty lists',()=>{assert.equal(pageIndex(0,-1,3),2);assert.equal(pageIndex(2,1,3),0);assert.equal(pageIndex(0,1,0),0)});
test('mobile paging is width-scoped and retains desktop cards and existing calculation authority',()=>{
  const css=readFileSync('public/flare-s8a/style.css','utf8'),source=readFileSync('public/flare-s8a/challenge.mjs','utf8');
  assert.match(css,/@media\(max-width:540px\)/);assert.match(css,/\.paged-card-row\{[^}]*overflow:visible/);assert.match(css,/\.paged-card-row \.card\.is-current-page\{display:grid/);assert.match(css,/\.selector-navigation button,\.selector-action\{min-height:44px/);
  assert.match(source,/control.addEventListener\('change',\(\)=>\{session=setEncounter\(session,encounter\(\)\);show\(\);\}\)/);
  assert.match(source,/estimatedHpPercent:estimateEncounter/);assert.match(source,/usedBudget:e|usedBudget\(e\)/);
  assert.match(source,/installPagedSelector\(row,kind==='traps'\?'trap':'support'\)/);
});
