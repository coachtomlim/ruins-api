// Reuses the existing, accepted, stateless S8A builder-invite architecture (/m/<code>) for the
// S8B "SHARE WITH A FRIEND" action. No server call, no database row, no migration: the link is a
// pure client-side encode of {runnerId, targetHp} into a 4-character opaque code, decoded again by
// the (frozen, unmodified) flare-s8a receiver when the friend opens it. Generating or sharing this
// link has no reward effect from S8B; the S8A guest-claim reward path it can lead to is a separate,
// already-governed system this module never touches.
import {buildChallengeInvite} from '../flare-s8a/builder-invite.mjs';

const LEVELS=Object.freeze([
  Object.freeze({id:'warrior-l1',hp:100}),
  Object.freeze({id:'warrior-l2',hp:110}),
  Object.freeze({id:'warrior-l3',hp:120})
]);
export const FRIEND_SHARE_DEFAULT_TARGET_HP=60;

function nearestRunnerId(effectiveHp){
  const hp=Number(effectiveHp);
  let best=LEVELS[0];
  for(const level of LEVELS)if(Math.abs(level.hp-hp)<Math.abs(best.hp-hp))best=level;
  return best.id;
}

export function buildFriendShareLink({baseUrl,senderName,effectiveHp,targetHp=FRIEND_SHARE_DEFAULT_TARGET_HP,model}={}){
  if(!baseUrl)throw new Error('FRIEND_SHARE_BASE_URL_REQUIRED');
  if(!model)throw new Error('FRIEND_SHARE_MODEL_REQUIRED');
  const runnerId=nearestRunnerId(effectiveHp);
  const built=buildChallengeInvite({baseUrl,sender:senderName,runnerId,targetHp,model});
  return Object.freeze({url:built.url,code:built.code,runnerId,share:built.share});
}

const PRIVATE_URL_PATTERNS=[
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // uuid (player/runner id)
  /@/, // email
  /service_role|sb_secret_|access_token|refresh_token|session/i
];

export function friendShareUrlIsSafe(url){
  const text=String(url||'');
  if(!text)return false;
  return !PRIVATE_URL_PATTERNS.some(pattern=>pattern.test(text));
}

export async function shareFriendLink({url,title,text,navigator:nav=globalThis.navigator}={}){
  if(!url)throw new Error('FRIEND_SHARE_URL_REQUIRED');
  if(nav&&typeof nav.share==='function'){
    try{
      await nav.share({title,text,url});
      return Object.freeze({method:'native',shared:true,cancelled:false});
    }catch(error){
      if(error?.name==='AbortError'||/abort/i.test(String(error?.message||'')))
        return Object.freeze({method:'native',shared:false,cancelled:true});
      throw error;
    }
  }
  return Object.freeze({method:'unavailable',shared:false,cancelled:false});
}

export async function copyFriendLink(url,{document:doc=globalThis.document,navigator:nav=globalThis.navigator}={}){
  if(!url)throw new Error('FRIEND_SHARE_URL_REQUIRED');
  if(nav?.clipboard&&typeof nav.clipboard.writeText==='function'){
    try{
      await nav.clipboard.writeText(url);
      return Object.freeze({method:'clipboard',copied:true});
    }catch{ /* fall through to legacy fallback */ }
  }
  if(doc?.createElement){
    const field=doc.createElement('textarea');
    field.value=url;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';
    doc.body.appendChild(field);field.select();
    let copied=false;
    try{copied=doc.execCommand&&doc.execCommand('copy')===true}catch{copied=false}
    doc.body.removeChild(field);
    if(copied)return Object.freeze({method:'legacy',copied:true});
  }
  return Object.freeze({method:'manual',copied:false});
}

export function whatsappShareUrl(url,text){
  if(!url)throw new Error('FRIEND_SHARE_URL_REQUIRED');
  return 'https://wa.me/?'+new URLSearchParams({text:`${text||''} ${url}`.trim()}).toString();
}

export function telegramShareUrl(url,text){
  if(!url)throw new Error('FRIEND_SHARE_URL_REQUIRED');
  return 'https://t.me/share/?'+new URLSearchParams({url,text:text||''}).toString();
}
