// 002E9D: HOME / Runner Hub / CONTINUE AS GUEST.
// A Friend playing as a Guest who presses HOME (or CREATE ACCOUNT) leaves the challenge page for the Runner Hub.
// So they can get back, the challenge page records a SESSION-ONLY return target in sessionStorage (same tab, same
// browser session — exactly the lifetime of the session-only Builder Level 2). The Runner Hub shows CONTINUE AS
// GUEST when such a target exists and sends the player back to it; the challenge page then reopens the New Gizmos
// overview if Builder Level 2 is active for this session. Nothing is written to an account or Supabase, and no
// durable Level 2 is claimed.
export const GUEST_RETURN_KEY='s8aGuestReturn';
export const GUEST_RETURN_PARAM='guest';
const CHALLENGE_PATH=/^\/(?:quick-dungeon\/flare-s8a\/challenge\.html|m\/[A-Za-z0-9_-]{4}\/?)$/;

export function saveGuestReturn(storage,locationLike){
  try{
    const path=String(locationLike?.pathname||''),params=new URLSearchParams(String(locationLike?.search||''));
    if(!CHALLENGE_PATH.test(path))return false;
    params.delete(GUEST_RETURN_PARAM);
    const search=params.toString();
    storage.setItem(GUEST_RETURN_KEY,JSON.stringify({path,search:search?`?${search}`:''}));
    return true;
  }catch{return false;}
}
export function readGuestReturn(storage){
  try{
    const raw=storage?.getItem(GUEST_RETURN_KEY);if(!raw)return null;
    const entry=JSON.parse(raw);
    if(!CHALLENGE_PATH.test(String(entry?.path||'')))return null;
    const search=String(entry?.search||'');
    if(search&&!/^\?[A-Za-z0-9_=&%.\-~+]*$/.test(search))return null;
    return Object.freeze({path:entry.path,search});
  }catch{return null;}
}
export function guestReturnHref(entry){
  if(!entry)return '';
  const params=new URLSearchParams(entry.search.replace(/^\?/,''));
  params.set(GUEST_RETURN_PARAM,'1');
  return `${entry.path}?${params.toString()}`;
}
export const isGuestReturn=search=>new URLSearchParams(String(search||'')).get(GUEST_RETURN_PARAM)==='1';
export function withoutGuestParam(locationLike){
  const params=new URLSearchParams(String(locationLike?.search||''));params.delete(GUEST_RETURN_PARAM);
  const q=params.toString();return `${locationLike?.pathname||''}${q?`?${q}`:''}${locationLike?.hash||''}`;
}
