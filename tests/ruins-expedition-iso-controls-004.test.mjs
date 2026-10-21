import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDay1State,applyDay1Command} from '../public/ruins-expedition/day1-state.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(resolve(root,'public/ruins-expedition/index.html'),'utf8');
const css=readFileSync(resolve(root,'public/ruins-expedition/day1-iso-controls.css'),'utf8');
const projection=({x,y})=>({screenX:x-y,screenY:x+y});

test('every displayed diagonal rune is bound to the correct unchanged source MOVE command',()=>{
  const controls=[['nw','left',-1,-1],['ne','up',1,-1],['sw','down',-1,1],['se','right',1,1]];
  for(const [iso,dir,dx,dy] of controls){
    const pattern=new RegExp('<button[^>]+data-direction="'+dir+'"[^>]+data-iso="'+iso+'"[^>]+aria-label="Move [^"]+ on screen"');
    assert.match(html,pattern);
    const state=createDay1State();state.hero.x=3;state.hero.y=3;
    const rooms={1:{width:8,height:8,collision:Array(64).fill(0)}};
    const next=applyDay1Command(state,{id:'iso-'+dir,expectedRevision:0,type:'MOVE',direction:dir},rooms).state;
    const before=projection(state.hero),after=projection(next.hero);
    assert.equal(after.screenX-before.screenX,dx);
    assert.equal(after.screenY-before.screenY,dy);
  }
});
test('one four-key rune cluster replaces the flat cardinal control',()=>{
  assert.match(html,/class="dpad iso-pad"/);
  assert.equal((html.match(/class="iso-key"/g)||[]).length,4);
  assert.doesNotMatch(html,/<div class="vertical">/);
  assert.match(html,/day1-iso-controls\.css/);
});
test('touch targets remain at least 44px while decorative SVG is never an interactive subtarget',()=>{
  assert.match(css,/width:48px;height:48px;min-width:44px;min-height:44px/);
  assert.match(css,/width:46px;height:46px/);
  assert.equal((html.match(/aria-hidden="true" focusable="false"/g)||[]).length,4);
  assert.match(css,/\.iso-key:focus-visible/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
test('rune artwork follows screen projection without changing keyboard or gameplay semantics',()=>{
  for(const iso of ['nw','ne','sw','se'])assert.match(css,new RegExp('data-iso="'+iso+'"'));
  const app=readFileSync(resolve(root,'public/ruins-expedition/day1-app.mjs'),'utf8');
  assert.match(app,/void execute\('MOVE',btn\.dataset\.direction\)/);
  assert.match(app,/ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'/);
  const state=readFileSync(resolve(root,'public/ruins-expedition/day1-state.mjs'),'utf8');
  assert.match(state,/const DIRECTIONS=Object\.freeze/);
});
