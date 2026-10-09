// 002E9D (V18): a genuine loading state for real asynchronous preparation (room/tiles, actors, Runner).
// It is shown only while a real promise is pending — there is NO artificial delay: `track()` resolves as soon
// as the work does, and `begin()` waits a tiny grace period (default 120 ms) before painting so work that
// finishes immediately never flashes a screen. Reduced-motion users get a static progress bar and no spinner
// animation, and the steps still read clearly.
export const LOADING_STEPS=Object.freeze(['Preparing the room','Placing guards and hazards','Getting the Runner ready']);

export function createLoadingOverlay({root,reducedMotion=()=>false,graceMs=120,setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let timer=null,visible=false,step=0,title='Loading your dungeon…',depth=0;
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;};
  function paint(){
    root.replaceChildren();
    const wrap=el('div','loading-wrap'),orb=el('div','loader-orb');orb.setAttribute('aria-hidden','true');
    const bar=el('div','load-bar'),fill=el('div','load-fill');bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax','100');
    const pct=Math.round(((step+1)/LOADING_STEPS.length)*100);bar.setAttribute('aria-valuenow',String(pct));bar.setAttribute('aria-label',title);
    // static (reduced-motion) progress tracks the real step; animated progress is CSS-driven
    fill.style.setProperty('--static-width',`${pct}%`);bar.append(fill);
    const steps=el('div','load-steps');
    LOADING_STEPS.forEach((s,i)=>{const row=el('span',i<step?'is-done':i===step?'is-current':'',s);steps.append(row);});
    wrap.append(orb,el('h2','load-title',title),bar,steps);root.append(wrap);
    root.dataset.step=String(step);root.classList.toggle('is-static',Boolean(reducedMotion()));
  }
  function show(){visible=true;root.hidden=false;paint();}
  function hideNow(){if(timer){clearTimer(timer);timer=null;}visible=false;root.hidden=true;root.replaceChildren();delete root.dataset.step;}
  return{
    // Begin a loading phase. Nested begin/end calls are counted so overlapping phases cannot hide each other.
    begin(nextTitle,{immediate=false}={}){depth++;title=nextTitle||title;step=0;if(visible){paint();return;}if(immediate||graceMs<=0){show();return;}if(!timer)timer=setTimer(()=>{timer=null;if(depth>0)show();},graceMs);},
    setStep(i){step=Math.max(0,Math.min(LOADING_STEPS.length-1,i));if(visible)paint();},
    end(){depth=Math.max(0,depth-1);if(depth===0)hideNow();},
    async track(promise,nextTitle,options){this.begin(nextTitle,options);try{return await promise;}finally{this.end();}},
    get visible(){return visible;},
    get pending(){return depth>0;}
  };
}
