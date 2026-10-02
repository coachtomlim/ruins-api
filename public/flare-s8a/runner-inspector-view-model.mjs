// Friend Feedback 002D — pure view-model for the Runner Inspector modal. Reads the exact same
// authoritative values the runtime/calibration/receipt already use (runner.hp/attack/defense,
// which 002C's snapshot wiring already overrides from the challenge-time snapshot when one
// exists), so the inspector can never show a number the runtime doesn't actually use.
const SLOTS=['weapon','shield','head','chest','hands','legs','feet'];
const SLOT_LABELS=Object.freeze({weapon:'WEAPON',shield:'SHIELD',head:'HEAD',chest:'CHEST',hands:'HANDS',legs:'LEGS',feet:'FEET'});

function modifierLabel(modifiers){
  if(!modifiers)return'';
  const parts=[];
  if(modifiers.attack)parts.push(`+${modifiers.attack} ATK`);
  if(modifiers.defense)parts.push(`+${modifiers.defense} DEF`);
  if(modifiers.hp)parts.push(`+${modifiers.hp} HP`);
  return parts.join(' · ');
}

// The template (non-snapshot) path only ever fields the fixed starter loadout — club in weapon,
// shield in shield, everything else empty — and the combat engine only tracks the FUSED total
// ATK/DEF, not a per-item breakdown, so there is no itemized modifier to show for this path.
const TEMPLATE_EQUIPMENT=Object.freeze(SLOTS.map(slot=>Object.freeze(
  slot==='weapon'?{slot,label:SLOT_LABELS.weapon,empty:false,itemName:'WOODEN CLUB',modifierLabel:''}:
  slot==='shield'?{slot,label:SLOT_LABELS.shield,empty:false,itemName:'WOODEN SHIELD',modifierLabel:''}:
  {slot,label:SLOT_LABELS[slot],empty:true,itemName:'EMPTY',modifierLabel:''}
)));

export function buildRunnerInspectorViewModel({displayName,hp,attack,defense,authoritySource,snapshotEquipment}={}){
  const equipment=authoritySource==='snapshot'&&Array.isArray(snapshotEquipment)
    ?SLOTS.map(slot=>{
      const found=snapshotEquipment.find(item=>item?.slot===slot);
      const equipped=Boolean(found?.equipped);
      return Object.freeze({
        slot,
        label:SLOT_LABELS[slot],
        empty:!equipped,
        itemName:equipped?String(found.name||'EQUIPPED').toUpperCase():'EMPTY',
        modifierLabel:equipped?modifierLabel(found.modifiers):''
      });
    })
    :TEMPLATE_EQUIPMENT;
  return Object.freeze({
    displayName:String(displayName||'Hero-Runner'),
    hp:Number.isFinite(Number(hp))?Math.round(Number(hp)):0,
    attack:Number.isFinite(Number(attack))?Math.round(Number(attack)):0,
    defense:Number.isFinite(Number(defense))?Math.round(Number(defense)):0,
    equipment:Object.freeze(equipment)
  });
}
