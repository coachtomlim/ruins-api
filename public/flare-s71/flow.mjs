import {runnerIds} from '../flare-s7/game.mjs';

const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
export const DEMO_LOGIN=Object.freeze({username:'Buddy',password:'Test'});

export function validateDemoLogin(username,password){return String(username).trim()===DEMO_LOGIN.username&&String(password)===DEMO_LOGIN.password}
export function safeSender(value){const cleaned=String(value||'Buddy').replace(/[<>]/g,'').trim().slice(0,32);return cleaned||'Buddy'}
export function inviteSender(search){return safeSender(new URLSearchParams(search||'').get('from')||'Buddy')}
function encode24(value){let out='';for(let shift=18;shift>=0;shift-=6)out+=ALPHABET[(value>>>shift)&63];return out}
function decode24(code){if(!/^[A-Za-z0-9_-]{4}$/.test(code))throw Error('Invalid invitation code');let value=0;for(const ch of code)value=(value<<6)|ALPHABET.indexOf(ch);return value>>>0}
function checksum14(payload){let x=(payload^0x35A)>>>0;x=((x*107)+41)>>>0;x^=x>>>6;x=((x*59)+13)>>>0;return x&0x3fff}

export function encodeInviteCode({runnerId,targetHp},model){
  const ids=runnerIds(model),runner=ids.indexOf(runnerId);if(runner<0||runner>3)throw Error('Runner cannot be encoded');
  const target=Number(targetHp);if(!Number.isInteger(target)||target<5||target>95||target%5!==0)throw Error('Target HP must be 5..95 in steps of 5');
  const targetIndex=target/5-1,payload=(2<<7)|(runner<<5)|targetIndex;
  return encode24((payload<<14)|checksum14(payload));
}
export function decodeInviteCode(code,model){
  const packed=decode24(code),payload=packed>>>14,check=packed&0x3fff;if(check!==checksum14(payload))throw Error('Invitation code checksum failed');
  const version=(payload>>>7)&7;if(version!==2)throw Error('Unsupported invitation code version');
  const index=(payload>>>5)&3,targetIndex=payload&31,ids=runnerIds(model);if(index>=ids.length||targetIndex>18)throw Error('Invalid invitation code');
  return Object.freeze({runnerId:ids[index],targetHp:(targetIndex+1)*5,codeVersion:2});
}
export function makeInviteUrl(baseUrl,invite,model,{sender='Buddy'}={}){
  const code=encodeInviteCode(invite,model),base=new URL(baseUrl),name=safeSender(sender);
  if(base.hostname==='think-2-thrive.com'||base.hostname.endsWith('.think-2-thrive.com')||base.hostname==='localhost'||base.hostname==='127.0.0.1'){const url=new URL(`/k/${code}`,base.origin);if(name!=='Buddy')url.searchParams.set('from',name);return url}
  const url=new URL('challenge.html',base);url.searchParams.set('k',code);if(name!=='Buddy')url.searchParams.set('from',name);return url;
}
export function inviteCodeFromLocation(locationLike){const pathname=String(locationLike?.pathname||''),m=pathname.match(/\/k\/([A-Za-z0-9_-]{4})\/?$/);if(m)return m[1];return new URLSearchParams(String(locationLike?.search||'')).get('k')||''}
