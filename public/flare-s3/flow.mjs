import {buildChallenge,encodeChallenge} from '../flare-s2/core.mjs';

export const S3_VERSION='web-flare-s3-0.1.0';
export const DEMO_LOGIN=Object.freeze({username:'Buddy',password:'Test'});
export const DEFAULTS=Object.freeze({enemyTypes:['goblin','skeleton','none'],potion:true,targetHp:50,budget:100});

export function validateDemoLogin(username,password){
  return String(username).trim()===DEMO_LOGIN.username && String(password)===DEMO_LOGIN.password;
}

export function runnerSummary(profile,catalog){
  const hero=catalog?.heroes?.[profile?.hero];
  if(!hero)throw Error('Runner catalogue entry unavailable');
  return Object.freeze({
    id:profile.id,
    name:profile.name,
    className:profile.className,
    level:profile.level,
    weapon:profile.weapon,
    hero:profile.hero,
    hp:hero.maxHp,
    attack:hero.damage,
    defense:hero.armor||0
  });
}

export function buildDefaultChallenge({roomId,roomTitle,map,catalog,targetHp=DEFAULTS.targetHp,enemyTypes=DEFAULTS.enemyTypes,potion=DEFAULTS.potion}){
  return buildChallenge({roomId,roomTitle,map,catalog,targetHp:Number(targetHp),enemyTypes,potion,budget:DEFAULTS.budget});
}

export function makePlayerUrl(baseUrl,challenge,{autostart=true}={}){
  const url=new URL('play.html',baseUrl);
  if(autostart)url.searchParams.set('autostart','1');
  url.hash='c='+encodeChallenge(challenge);
  return url;
}

export function inviteSender(search){
  const from=new URLSearchParams(search||'').get('from');
  const cleaned=(from||'A friend').replace(/[<>]/g,'').trim().slice(0,32);
  return cleaned||'A friend';
}
