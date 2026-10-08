// Presentation only: the existing input remains the sole selection authority.
export function pageIndex(index,delta,count){return count>0?((index+delta)%count+count)%count:0;}
export function installPagedSelector(row,kind){
  const cards=[...row.children];let index=0;
  row.classList.add('paged-card-row');
  const nav=document.createElement('div');nav.className='selector-navigation';
  const previous=document.createElement('button'),next=document.createElement('button'),position=document.createElement('span');
  previous.className='selector-nav-btn';next.className='selector-nav-btn';position.className='selector-position';
  for(const [button,label,text,delta] of [[previous,`Previous ${kind}`,'‹',-1],[next,`Next ${kind}`,'›',1]]){
    button.type='button';button.textContent=text;button.setAttribute('aria-label',label);
    button.addEventListener('click',()=>{index=pageIndex(index,delta,cards.length);render();});
  }
  position.setAttribute('aria-live','polite');nav.append(previous,position,next);
  const actions=cards.map(card=>{
    const input=card.querySelector('input'),action=document.createElement('button');
    action.type='button';action.className='selector-action';
    action.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      let changed=input;
      if(input.type==='checkbox'){
        input.checked=!input.checked;
      }else if(input.checked&&input.value!=='none'){
        // REMOVE on an already-selected monster slot — safely falls back to the group's own
        // EMPTY/none radio rather than leaving the slot in an invalid/unset state.
        const emptyInput=row.querySelector(`input[name="${input.name}"][value="none"]`);
        if(emptyInput){emptyInput.checked=true;changed=emptyInput;}
      }else{
        input.checked=true;
      }
      changed.dispatchEvent(new Event('change',{bubbles:true}));
    });card.append(action);return action;
  });
  function render(){
    cards.forEach((card,i)=>{
      card.classList.toggle('is-current-page',i===index);
      const input=card.querySelector('input');
      const label=input.checked?(input.type==='checkbox'?'REMOVE':(input.value==='none'?'SELECTED':'REMOVE')):'SELECT';
      actions[i].textContent=label;
      actions[i].classList.toggle('is-remove',label==='REMOVE');
      actions[i].setAttribute('aria-label',`${label} ${card.querySelector('strong').textContent}`);
    });position.textContent=`${index+1} / ${cards.length}`;
  }
  // Jump the visible page to the card that is actually selected (initial load, presets, level-up
  // rebuilds) so the single mobile card on screen reflects the real selection, not always page 1.
  render.syncToSelection=()=>{const at=cards.findIndex(card=>card.querySelector('input')?.checked&&card.querySelector('input').value!=='none');if(at>=0)index=at;render();};
  row.parentElement.append(nav);row.addEventListener('change',render);render.syncToSelection();
  return render;
}
