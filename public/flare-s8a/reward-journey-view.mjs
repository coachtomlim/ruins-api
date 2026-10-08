// 002E9 / 002E9C — DOM renderer for the post-run reward journey (the one and only unlock presentation).
// Pure content lives in reward-journey.mjs, packaged thumbnails in loot-assets.mjs, and every navigation side
// effect (customize / account / guest) is injected by challenge.mjs so this file owns presentation only.
import {JOURNEY_STAGE_BY_SCENE} from './reward-journey.mjs';
import {LOOT_ASSETS,CATEGORY_ASSET} from './loot-assets.mjs';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
const CONFETTI_COLORS=['#f2c45d','#75dbc9','#e27379','#ffffff','#bb83d0'];

export function createRewardJourney({root,coinSrc,startHero,reducedMotion=()=>false,onCustomize,onCreateAccount,onGuest}={}){
  let journey=null,index=0,timers=[],stopHero=null,muted=false,audio=null,open=false,lootIndex={monsters:0,traps:0};
  const later=(fn,ms)=>{timers.push(setTimeout(fn,ms));};
  function clear(){for(const t of timers)clearTimeout(t);timers=[];if(stopHero){try{stopHero()}catch{}stopHero=null;}}

  function chime(){
    if(muted||reducedMotion())return;
    try{
      const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
      audio=audio||new Ctx();const a=audio,now=a.currentTime;
      for(const [freq,offset] of [[523,0],[659,.12],[784,.24],[1046,.38]]){
        const osc=a.createOscillator(),gain=a.createGain();osc.type='triangle';osc.frequency.value=freq;
        gain.gain.setValueAtTime(.0001,now+offset);gain.gain.exponentialRampToValueAtTime(.11,now+offset+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+offset+.18);
        osc.connect(gain);gain.connect(a.destination);osc.start(now+offset);osc.stop(now+offset+.2);
      }
    }catch{}
  }
  function confetti(layer,count=52){
    if(reducedMotion())return;
    for(let i=0;i<count;i++){
      const piece=el('i','j-confetti');piece.style.left=`${Math.random()*100}%`;piece.style.background=CONFETTI_COLORS[i%CONFETTI_COLORS.length];
      piece.style.setProperty('--dx',`${(Math.random()-.5)*220}px`);piece.style.setProperty('--rot',`${Math.random()*800-400}deg`);piece.style.animationDelay=`${Math.random()*.18}s`;layer.append(piece);
    }
  }
  const button=(cls,text,handler)=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',handler);return b;};
  const next=()=>go(index+1);
  function go(i){index=Math.max(0,Math.min(journey.scenes.length-1,i));render();}
  const goId=id=>{const i=journey.scenes.findIndex(x=>x.id===id);if(i>=0)go(i);};

  function chrome(){
    const bar=el('div','j-bar');
    const dots=el('div','j-dots');dots.setAttribute('aria-hidden','true');
    const stage=JOURNEY_STAGE_BY_SCENE[journey.scenes[index].id]??0;
    for(let i=0;i<=6;i++)dots.append(el('span',`j-dot${i===stage?' is-current':i<stage?' is-done':''}`));
    const sound=button('j-sound',muted?'SOUND OFF':'SOUND ON',()=>{muted=!muted;sound.textContent=muted?'SOUND OFF':'SOUND ON';sound.setAttribute('aria-pressed',String(!muted));});
    sound.setAttribute('aria-pressed',String(!muted));
    bar.append(dots,sound);return bar;
  }

  const backButton=s=>button('j-back',s.back,()=>goId('gizmos'));
  // Browse-only carousel: LEFT / RIGHT arrows and a counter. No sliders, no horizontal scroll, no editing.
  function lootBrowser(s,box,kind){
    box.classList.add('is-scroll');
    const items=s.items,n=items.length;let i=lootIndex[kind]%Math.max(1,n);
    const nav=el('div','j-arrows'),left=button('j-arrow','‹',()=>{lootIndex[kind]=(i+n-1)%n;render();}),right=button('j-arrow','›',()=>{lootIndex[kind]=(i+1)%n;render();});
    left.setAttribute('aria-label',`Previous ${kind==='traps'?'trap':'monster'}`);right.setAttribute('aria-label',`Next ${kind==='traps'?'trap':'monster'}`);
    const it=items[i],card=el('div',`j-loot-card${kind==='traps'?' is-trap':''}`),img=el('img');img.src=LOOT_ASSETS[it.asset];img.alt=`${it.name} - Flare art`;img.decoding='async';
    card.append(img,el('strong','',it.name),el('p','',it.copy),el('div','j-counter',`${i+1} / ${n}`));
    nav.append(left,card,right);
    box.append(backButton(s),el('p','j-eyebrow',s.eyebrow),el('h2','j-big',s.title),nav,button('j-next',s.next,()=>goId(s.nextScene)));
  }
  const scenes={
    success(s,box){
      const layer=el('div','j-burst');layer.setAttribute('aria-hidden','true');if(s.celebrate)confetti(layer);box.append(layer);
      if(s.celebrate)box.append(el('div','j-medal','★'));
      box.append(el('h2','j-success-word',s.title),el('p','j-sub',s.subtitle),button('j-next',s.next,next));
      if(s.celebrate)chime();
    },
    performance(s,box){
      box.append(el('p','j-eyebrow',s.eyebrow),el('h2','j-big',s.title));
      const stack=el('div','j-stack');
      const lines=[...s.rows.map(r=>{const d=el('div','j-line j-metric');d.append(el('span','',r.label),el('strong','',r.value));return d;}),(()=>{const d=el('div','j-line j-metric j-distance',s.distance);return d;})()];
      lines.forEach((d,i)=>{stack.append(d);if(reducedMotion())d.classList.add('is-shown');else later(()=>d.classList.add('is-shown'),250+i*650);});
      box.append(stack,button('j-next',s.next,next));
    },
    reward(s,box){
      const coin=el('img','j-coin');coin.src=coinSrc;coin.alt='Tactics coins';coin.decoding='async';
      const amount=el('div','j-reward-num',reducedMotion()?s.goldLabel:'0 GOLD');amount.setAttribute('aria-live','polite');
      box.append(el('p','j-eyebrow',s.eyebrow),coin,el('div','j-reward-label',s.gainedLabel),amount,el('p','j-sub',s.support),button('j-next',s.next,next));
      if(!reducedMotion()&&s.gold>0){let n=0;const step=()=>{n=Math.min(s.gold,n+Math.max(1,Math.ceil(s.gold/10)));amount.textContent=`${n} GOLD`;if(n<s.gold)later(step,55);};later(step,350);}
    },
    friend(s,box){
      const hero=el('canvas','j-hero');hero.setAttribute('role','img');hero.setAttribute('aria-label',`${s.heroLabel} — Flare Hero-Runner`);
      box.append(el('p','j-eyebrow',s.eyebrow),el('h2','j-big',s.title),hero,el('div','j-reward-label',s.heroLabel),el('div','j-reward-num',s.goldLabel),el('p','j-sub',s.support),button('j-next',s.next,next));
      requestAnimationFrame(()=>{try{stopHero=startHero?.(hero)||null;}catch(error){console.error(error);}});
    },
    achievement(s,box){
      const badge=el('div','j-badge'),inner=el('div');inner.append(el('span','',s.levelLabel),el('strong','',String(s.level)));badge.append(inner);
      const lines=el('h2','j-levelup');for(const line of s.lines)lines.append(el('span','j-levelup-line',line));
      box.append(el('p','j-eyebrow',s.eyebrow),badge,lines,el('p','j-sub',s.support),el('p','j-note',s.sessionNote),button('j-next',s.next,next));
      chime();
    },
    // New Gizmos overview (V12): four equally-weighted, selectable category cards. Titles and counts sit on
    // fixed grid rows so they align across all four cards. The CTA starts the loot review; it never edits.
    gizmos(s,box){
      box.classList.add('is-scroll');
      const grid=el('div','j-category-grid');
      for(const cat of s.categories){
        const b=el('button',`j-cat${cat.key==='supports'?' is-support':''}`);b.type='button';b.dataset.tool=cat.key;
        const art=el('div','j-cat-art');
        const asset=CATEGORY_ASSET[cat.key];
        if(asset){const im=el('img');im.src=LOOT_ASSETS[asset];im.alt='';im.decoding='async';art.append(im);}else{const icon=el('div','support-icon');icon.setAttribute('aria-hidden','true');art.append(icon);}
        b.append(art,el('strong','',cat.label),el('small',cat.items.length?'':'is-none',cat.count));
        b.addEventListener('click',()=>goId(cat.scene));
        grid.append(b);
      }
      box.append(el('p','j-eyebrow',s.eyebrow),el('h2','j-big j-kit-title',s.title),grid,button('j-next',s.try,()=>goId(s.next)));
    },
    'loot-monsters'(s,box){lootBrowser(s,box,'monsters');},
    'loot-traps'(s,box){lootBrowser(s,box,'traps');},
    'loot-support'(s,s2){
      const box=s2;box.classList.add('is-scroll');
      const card=el('div','j-final-box j-support-box');const icon=el('div','support-icon');icon.setAttribute('aria-hidden','true');card.append(icon,el('p','j-support-copy',s.body));
      box.append(backButton(s),el('p','j-eyebrow',s.eyebrow),el('h2','j-big',s.title),card,button('j-next',s.next,()=>goId(s.nextScene)));
    },
    'loot-dungeon'(s,box){
      box.classList.add('is-scroll');
      const layer=el('div','j-burst');layer.setAttribute('aria-hidden','true');confetti(layer,36);box.append(layer);
      const img=el('img','j-dungeon-img');img.src=LOOT_ASSETS[s.item?.asset||'broken-gallery'];img.alt=`${s.title} — real Flare room preview`;
      box.append(backButton(s),el('div','j-new-badge',s.badge),el('h2','j-big',s.title),img,el('p','j-sub',s.subtitle),button('j-next',s.next,()=>goId(s.nextScene)));
      chime();
    },
    'loot-complete'(s,box){
      box.classList.add('is-scroll');
      const card=el('div','j-final-box');card.append(el('strong','',s.headline),el('p','',s.body));
      box.append(el('p','j-eyebrow',s.eyebrow),el('h2','j-big',s.title),card,button('j-next',s.next,next));
    },
    momentum(s,box){
      box.classList.add('is-scroll');
      const values=el('div','j-values');for(const v of s.values){const row=el('div','j-value');row.append(document.createTextNode('✓ '),el('span','',v));values.append(row);}
      const stack=el('div','j-cta');
      stack.append(button('j-next',s.customize,()=>onCustomize?.()),button('j-next',s.create,()=>onCreateAccount?.()),button('j-ghost',s.guest,()=>onGuest?.()));
      box.append(el('p','j-eyebrow',s.eyebrow),el('h2','j-big',s.title),values,el('p','j-note',s.truthNote),stack);
    }
  };

  function render(){
    clear();
    const scene=journey.scenes[index];
    root.replaceChildren();root.dataset.scene=scene.id;
    const box=el('section',`j-scene j-scene--${scene.id}`);
    root.append(chrome(),box);
    scenes[scene.id](scene,box);
    const focusTarget=box.querySelector('button.j-next')||box.querySelector('button');
    requestAnimationFrame(()=>focusTarget?.focus({preventScroll:true}));
  }

  return{
    start(nextJourney){journey=nextJourney;index=0;open=true;root.hidden=false;render();},
    dismiss(){open=false;clear();root.hidden=true;root.replaceChildren();delete root.dataset.scene;},
    isOpen:()=>open,
    get sceneId(){return journey?.scenes[index]?.id||null;}
  };
}
