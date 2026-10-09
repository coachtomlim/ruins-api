// 002E9D: CONTINUE AS GUEST on the Runner Hub. Shown only when a Friend arrived from a challenge page as a Guest
// (a session-only return target exists); it returns them to that challenge page, which reopens their unlocked
// Gizmos for this session. No account, no Supabase.
import {readGuestReturn,guestReturnHref} from '../flare-s8a/guest-return.mjs';
(function init(){
  const button=document.getElementById('continueAsGuest'),note=document.getElementById('guestNote');
  if(!button)return;
  let entry=null;try{entry=readGuestReturn(sessionStorage);}catch{entry=null;}
  if(!entry)return;
  button.hidden=false;if(note)note.hidden=false;
  button.addEventListener('click',()=>{location.href=guestReturnHref(entry);});
})();
