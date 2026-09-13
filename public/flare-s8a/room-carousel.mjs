const cleanRooms=rooms=>(Array.isArray(rooms)?rooms:[]).map((room,index)=>Object.freeze({id:String(room?.id||index),name:String(room?.name||`Dungeon ${index+1}`),...room}));

export function buildRoomCarousel({rooms=[],index=0,unavailableIds=[]}={}){
  const list=cleanRooms(rooms);if(!list.length)throw new Error('At least one dungeon room is required');
  const i=((Number(index)||0)%list.length+list.length)%list.length,unavailable=new Set((Array.isArray(unavailableIds)?unavailableIds:[]).map(String)),current=list[i];
  return Object.freeze({
    rooms:Object.freeze(list),
    index:i,
    count:list.length,
    counter:`${i+1} / ${list.length}`,
    current,
    available:!unavailable.has(String(current.id)),
    previousIndex:(i-1+list.length)%list.length,
    nextIndex:(i+1)%list.length,
    controls:Object.freeze({previous:'PREVIOUS DUNGEON',next:'NEXT DUNGEON',use:'USE THIS DUNGEON'})
  });
}
