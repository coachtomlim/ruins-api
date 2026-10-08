// 002E9 — DOM renderer for the post-run reward journey (replaces the 002E8 lock/unlock ceremony; there
// is exactly one unlock experience). Pure content lives in reward-journey.mjs; art/room drawing and
// every navigation side effect are injected by challenge.mjs so this file owns presentation only.
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
const CONFETTI_COLORS=['#f2c45d','#75dbc9','#e27379','#ffffff','#bb83d0'];

export function createRewardJourney({root,coinSrc,drawArt,drawDungeon,startHero,reducedMotion=()=>false,onTry,onCustomize,onCreateAccount,onGuest}={}){
  let journey=null,index=0,timers=[],stopHero=null,muted=false,audio=null,open=false;
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
  function confetti(layer){
    if(reducedMotion())return;
    for(let i=0;i<52;i++){
      const piece=el('i','j-confetti');piece.style.left=`${Math.random()*100}%`;piece.style.background=CONFETTI_COLORS[i%CONFETTI_COLORS.length];
      piece.style.setProperty('--dx',`${(Math.random()-.5)*220}px`);piece.style.setProperty('--rot',`${Math.random()*800-400}deg`);piece.style.animationDelay=`${Math.random()*.18}s`;layer.append(piece);
    }
  }
  const button=(cls,text,handler)=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',handler);return b;};
  const next=()=>go(index+1);
  function go(i){index=Math.max(0,Math.min(journey.scenes.length-1,i));render();}

  function chrome(){
    const bar=el('div','j-bar');
    const dots=el('div','j-dots');dots.setAttribute('aria-hidden','true');
    journey.scenes.forEach((_,i)=>dots.append(el('span',`j-dot${i===index?' is-current':i<index?' is-done':''}`)));
    const sound=button('j-sound',muted?'SOUND OFF':'SOUND ON',()=>{muted=!muted;sound.textContent=muted?'SOUND OFF':'SOUND ON';sound.setAttribute('aria-pressed',String(!muted));});
    sound.setAttribute('aria-pressed',String(!muted));
    bar.append(dots,sound);return bar;
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
    gizmos(s,box){
      box.classList.add('is-scroll');
      const grid=el('div','j-tools'),detail=el('div','j-detail');let activeKey=s.categories[0].key;
      const showCategory=(cat,btn)=>{
        activeKey=cat.key;for(const b of grid.children)b.classList.toggle('is-active',b===btn);
        detail.replaceChildren(el('p','j-eyebrow',cat.detailLabel),el('h3','',cat.label));
        if(!cat.items.length){detail.append(el('div','j-empty',cat.emptyCopy));return;}
        const row=el('div',`j-assets${cat.key==='dungeons'?' is-dungeon':''}`);
        for(const item of cat.items){
          const card=el('div',item.kind==='dungeon'?'j-asset-plain':'j-asset');
          if(item.kind==='dungeon'){const c=el('canvas','j-dungeon');c.setAttribute('aria-label',`${item.name} — actual Flare room preview`);card.append(c);requestAnimationFrame(()=>drawDungeon?.(c,item.id));}
          else{const c=el('canvas','j-art');c.setAttribute('aria-label',`${item.name} — actual Flare art`);card.append(c);drawArt?.(c,item.art,{width:176,height:156});}
          card.append(el('b','',item.name));row.append(card);
        }
        detail.append(row);
      };
      for(const cat of s.categories){
        const b=el('button','j-tool');b.type='button';b.dataset.tool=cat.key;b.setAttribute('aria-pressed','false');
        const art=el('canvas','j-category-art');art.setAttribute('aria-hidden','true');
        b.append(art,el('strong','',cat.label),el('small','',cat.copy));
        b.addEventListener('click',()=>{showCategory(cat,b);for(const x of grid.children)x.setAttribute('aria-pressed',String(x===b));});
        grid.append(b);
        if(cat.key==='dungeons'){requestAnimationFrame(()=>drawDungeon?.(art,s.categories.find(c=>c.key==='dungeons').items[0]?.id,{category:true}));}
        else drawArt?.(art,cat.key==='monsters'?'goblin':cat.key==='traps'?'spike-trap':'small-potion',{width:144,height:112});
      }
      box.append(el('p','j-eyebrow',s.eyebrow),el('h2','j-big j-kit-title',s.title),grid,detail,button('j-next',s.try,()=>onTry?.(activeKey)),button('j-ghost',s.next,next));
      showCategory(s.categories[0],grid.children[0]);grid.children[0].setAttribute('aria-pressed','true');
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
