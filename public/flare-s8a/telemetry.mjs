const SAFE_EVENTS=new Set(['invite_viewed','challenge_accepted','dungeon_selected','customize_opened','customize_panel_viewed','customize_done','run_started','camera_mode_changed','run_completed','run_again_selected','edit_dungeon_selected','registration_gate_viewed','registration_gate_back']);

function cleanPayload(payload={}){
  const out={};
  for(const [k,v] of Object.entries(payload||{})){
    if(/name|email|password|token|secret/i.test(k))continue;
    if(['string','number','boolean'].includes(typeof v)||v===null)out[k]=v;
  }
  return Object.freeze(out);
}

export function createTelemetry({sink=()=>{}}={}){
  return Object.freeze({
    emit(name,payload={}){
      if(!SAFE_EVENTS.has(name))throw new Error(`Unknown Dungeon Runner event: ${name}`);
      const event=Object.freeze({name,payload:cleanPayload(payload)});
      sink(event);
      return event;
    }
  });
}

export function createMemoryTelemetry(){
  const events=[];
  const telemetry=createTelemetry({sink:event=>events.push(event)});
  return Object.freeze({emit:telemetry.emit,events});
}
