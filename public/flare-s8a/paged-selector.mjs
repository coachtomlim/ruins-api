// Presentation only: the existing input remains the sole selection authority.
export function pageIndex(index,delta,count){return count>0?((index+delta)%count+count)%count:0;}
export function installPagedSelector(row,kind){
  const cards=[...row.children];let index=0;
  row.classList.add('paged-card-row');
  const nav=document.createElement('div');nav.className='selector-navigation';
  const previous=document.createElement('button'),next=document.createElement('button'),position=document.createElement('span');
  for(const [button,label,text,delta] of [[previous,`Previous ${kind}`,'LEFT',-1],[next,`Next ${kind}`,'RIGHT',1]]){
    button.type='button';button.textContent=text;button.setAttribute('aria-label',label);
    button.addEventListener('click',()=>{index=pageIndex(index,delta,cards.length);render();});
  }
  position.setAttribute('aria-live','polite');nav.append(previous,position,next);
  const actions=cards.map(card=>{
    const input=card.querySelector('input'),action=document.createElement('button');
    action.type='button';action.className='selector-action';
    action.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();
      input.checked=input.type==='radio'?true:!input.checked;
      input.dispatchEvent(new Event('change',{bubbles:true}));
    });card.append(action);return action;
  });
  function render(){
    cards.forEach((card,i)=>{
      card.classList.toggle('is-current-page',i===index);
      const input=card.querySelector('input');
      actions[i].textContent=input.checked?(input.type==='checkbox'?'REMOVE':'SELECTED'):'SELECT';
      actions[i].setAttribute('aria-label',`${actions[i].textContent} ${card.querySelector('strong').textContent}`);
    });position.textContent=`${index+1} / ${cards.length}`;
  }
  row.parentElement.append(nav);row.addEventListener('change',render);render();
  return render;
}
