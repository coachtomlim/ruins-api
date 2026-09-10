import {buildChallenge} from '../flare-s2/core.mjs';

export const S3_VERSION='web-flare-s3-0.3.0';
export const DEMO_LOGIN=Object.freeze({username:'Buddy',password:'Test'});
export const DEFAULTS=Object.freeze({enemyTypes:['goblin','skeleton','none'],potion:true,targetHp:50,budget:100,roomId:'iron-labyrinth-01'});
export const ROOM_IDS=Object.freeze(['iron-labyrinth-01','iron-labyrinth-07','iron-labyrinth-15']);
const TYPES=Object.freeze(['none','goblin','skeleton']);
const ALPHABET='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function validateDemoLogin(username,password){return String(username).trim()===DEMO_LOGIN.username&&String(password)===DEMO_LOGIN.password}
export function runnerSummary(profile,catalog){const hero=catalog?.heroes?.[profile?.hero];if(!hero)throw Error('Runner catalogue entry unavailable');return Object.freeze({id:profile.id,name:profile.name,className:profile.className,level:profile.level,weapon:profile.weapon,hero:profile.hero,hp:hero.maxHp,attack:hero.damage,defense:hero.armor||0})}
export function buildDefaultChallenge({roomId,roomTitle,map,catalog,targetHp=DEFAULTS.targetHp,enemyTypes=DEFAULTS.enemyTypes,potion=DEFAULTS.potion}){return buildChallenge({roomId,roomTitle,map,catalog,targetHp:Number(targetHp),enemyTypes,potion,budget:DEFAULTS.budget})}
export function safeSender(value){const cleaned=String(value||'Buddy').replace(/[<>]/g,'').trim().slice(0,32);return cleaned||'Buddy'}
export function inviteSender(search){return safeSender(new URLSearchParams(search||'').get('from')||'Buddy')}

function checksum16(payload){const seed=(payload>>>8)^(payload&255)^0xA7;return(seed+((payload*13)&255))&255}
function encode24(value){let out='';for(let shift=18;shift>=0;shift-=6)out+=ALPHABET[(value>>>shift)&63];return out}
function decode24(code){if(!/^[A-Za-z0-9_-]{4}$/.test(code))throw Error('Invalid gauntlet code');let value=0;for(const char of code)value=(value<<6)|ALPHABET.indexOf(char);return value>>>0}

export function encodeGauntletCode({roomId,enemyTypes=DEFAULTS.enemyTypes,potion=DEFAULTS.potion,targetHp=DEFAULTS.targetHp}){
  const room=ROOM_IDS.indexOf(roomId);if(room<0)throw Error('Unknown room for short link');const enemies=[0,1,2].map(i=>TYPES.indexOf(enemyTypes[i]||'none'));if(enemies.some(v=>v<0))throw Error('Unknown enemy for short link');const target=Number(targetHp);if(!Number.isInteger(target)||target<5||target>95||target%5!==0)throw Error('Target HP must be 5..95 in steps of 5');const targetIndex=target/5-1;const payload=((1&3)<<14)|(room<<12)|(enemies[0]<<10)|(enemies[1]<<8)|(enemies[2]<<6)|((potion?1:0)<<5)|targetIndex;return encode24((payload<<8)|checksum16(payload));
}
export function decodeGauntletCode(code){const packed=decode24(code),payload=packed>>>8,check=packed&255;if(check!==checksum16(payload))throw Error('Gauntlet code checksum failed');const version=(payload>>>14)&3;if(version!==1)throw Error('Unsupported gauntlet code version');const room=(payload>>>12)&3;if(room>=ROOM_IDS.length)throw Error('Unknown room in gauntlet code');const enemyTypes=[(payload>>>10)&3,(payload>>>8)&3,(payload>>>6)&3].map(v=>{if(v>=TYPES.length)throw Error('Unknown enemy in gauntlet code');return TYPES[v]});const potion=Boolean((payload>>>5)&1),targetIndex=payload&31;if(targetIndex>18)throw Error('Invalid target in gauntlet code');return Object.freeze({roomId:ROOM_IDS[room],enemyTypes,potion,targetHp:(targetIndex+1)*5})}
export function makePlayerUrl(baseUrl,options,{sender='Buddy'}={}){const code=encodeGauntletCode(options),base=new URL(baseUrl),name=safeSender(sender);if(base.hostname==='think-2-thrive.com'||base.hostname.endsWith('.think-2-thrive.com')){const url=new URL(`/q/${code}`,base.origin);if(name!=='Buddy')url.searchParams.set('from',name);return url}const url=new URL('play.html',base);url.searchParams.set('g',code);if(name!=='Buddy')url.searchParams.set('from',name);return url}
export function gauntletCodeFromLocation(locationLike){const pathname=String(locationLike?.pathname||''),m=pathname.match(/\/q\/([A-Za-z0-9_-]{4})\/?$/);if(m)return m[1];return new URLSearchParams(String(locationLike?.search||'')).get('g')||''}
