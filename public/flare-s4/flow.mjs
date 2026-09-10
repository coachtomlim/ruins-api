import {decodeGauntletCode as decodeS3Code} from '../flare-s3/flow.mjs';
import {DEFAULTS} from './game.mjs';

export const ROOM_IDS=Object.freeze(['iron-labyrinth-01','iron-labyrinth-07','iron-labyrinth-15']);
const TYPES=Object.freeze(['none','goblin','skeleton']);
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function safeSender(value){const cleaned=String(value||'Buddy').replace(/[<>]/g,'').trim().slice(0,32);return cleaned||'Buddy'}
export function inviteSender(search){return safeSender(new URLSearchParams(search||'').get('from')||'Buddy')}
function encode24(value){let out='';for(let shift=18;shift>=0;shift-=6)out+=ALPHABET[(value>>>shift)&63];return out}
function decode24(code){if(!/^[A-Za-z0-9_-]{4}$/.test(code))throw Error('Invalid gauntlet code');let value=0;for(const ch of code)value=(value<<6)|ALPHABET.indexOf(ch);return value>>>0}
function checksum7(payload){const mixed=(payload>>>9)^(payload>>>3)^(payload&127)^0x53;return (mixed+((payload*11)&127))&127}

export function encodeGauntletCode({roomId,enemyTypes=DEFAULTS.enemyTypes,potion=DEFAULTS.potion,trap=DEFAULTS.trap,targetHp=DEFAULTS.targetHp}){
  const room=ROOM_IDS.indexOf(roomId);if(room<0)throw Error('Unknown room for short link');
  const enemies=[0,1,2].map(i=>TYPES.indexOf(enemyTypes[i]||'none'));if(enemies.some(v=>v<0))throw Error('Unknown enemy for short link');
  const target=Number(targetHp);if(!Number.isInteger(target)||target<5||target>95||target%5!==0)throw Error('Target HP must be 5..95 in steps of 5');
  const targetIndex=target/5-1;
  const payload=(2<<15)|(room<<13)|(enemies[0]<<11)|(enemies[1]<<9)|(enemies[2]<<7)|((potion?1:0)<<6)|((trap?1:0)<<5)|targetIndex;
  return encode24((payload<<7)|checksum7(payload));
}

export function decodeGauntletCode(code){
  try{const legacy=decodeS3Code(code);return Object.freeze({...legacy,trap:false,codeVersion:1})}catch{}
  const packed=decode24(code),payload=packed>>>7,check=packed&127;if(check!==checksum7(payload))throw Error('Gauntlet code checksum failed');
  const version=(payload>>>15)&3;if(version!==2)throw Error('Unsupported gauntlet code version');
  const room=(payload>>>13)&3;if(room>=ROOM_IDS.length)throw Error('Unknown room in gauntlet code');
  const enemyTypes=[(payload>>>11)&3,(payload>>>9)&3,(payload>>>7)&3].map(v=>{if(v>=TYPES.length)throw Error('Unknown enemy in gauntlet code');return TYPES[v]});
  const potion=Boolean((payload>>>6)&1),trap=Boolean((payload>>>5)&1),targetIndex=payload&31;if(targetIndex>18)throw Error('Invalid target in gauntlet code');
  return Object.freeze({roomId:ROOM_IDS[room],enemyTypes,potion,trap,targetHp:(targetIndex+1)*5,codeVersion:2});
}

export function makePlayerUrl(baseUrl,options,{sender='Buddy'}={}){
  const code=encodeGauntletCode(options),base=new URL(baseUrl),name=safeSender(sender);
  if(base.hostname==='think-2-thrive.com'||base.hostname.endsWith('.think-2-thrive.com')){const url=new URL(`/q/${code}`,base.origin);if(name!=='Buddy')url.searchParams.set('from',name);return url}
  const url=new URL('play.html',base);url.searchParams.set('g',code);if(name!=='Buddy')url.searchParams.set('from',name);return url;
}
export function gauntletCodeFromLocation(locationLike){const pathname=String(locationLike?.pathname||''),m=pathname.match(/\/q\/([A-Za-z0-9_-]{4})\/?$/);if(m)return m[1];return new URLSearchParams(String(locationLike?.search||'')).get('g')||''}
