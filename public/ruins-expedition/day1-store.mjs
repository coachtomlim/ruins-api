import {createDay1State,applyDay1Command} from './day1-state.mjs';
// Explicit local-reference implementation only. IndexedDB commits state + ledger + receipts atomically.
export function createDay1IndexedDbStore({indexedDBImpl=globalThis.indexedDB,database='ruins-day1-local-proof-v1'}={}){
  if(!indexedDBImpl)throw new Error('LOCAL_PERSISTENCE_UNAVAILABLE');
  const open=new Promise((resolve,reject)=>{
    const request=indexedDBImpl.open(database,1);
    request.onupgradeneeded=()=>request.result.createObjectStore('expedition');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('DB_OPEN_FAILED'));
    request.onblocked=()=>reject(new Error('DB_OPEN_BLOCKED'));
  });
  function transaction(mode,fn){return open.then(db=>new Promise((resolve,reject)=>{
    const tx=db.transaction('expedition',mode),store=tx.objectStore('expedition');
    let value;let failure=null;
    tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(failure||tx.error||new Error('PERSISTENCE_TRANSACTION_ABORTED'));
    tx.onerror=()=>{failure=tx.error||new Error('PERSISTENCE_TRANSACTION_FAILED')};
    try{fn(store,tx,x=>{value=x},err=>{failure=err;tx.abort()});}catch(error){failure=error;tx.abort()}
  }));}
  async function load(){return transaction('readwrite',(store,tx,done,fail)=>{
    const request=store.get('instance');request.onsuccess=()=>{
      try{const state=request.result??createDay1State();if(!request.result)store.put(state,'instance');done(state)}catch(err){fail(err)}
    };request.onerror=()=>fail(request.error);
  });}
  async function dispatch(command,rooms){return transaction('readwrite',(store,tx,done,fail)=>{
    const request=store.get('instance');request.onsuccess=()=>{
      try{const current=request.result??createDay1State();const out=applyDay1Command(current,command,rooms);
        if(out.state!==current)store.put(out.state,'instance');done(out);
      }catch(error){fail(error)}
    };request.onerror=()=>fail(request.error);
  });}
  return Object.freeze({load,dispatch});
}
// Unit-test adapter with the same commit-on-success contract; never use as browser persistence.
export function createDay1MemoryStore(initial=createDay1State()){
  let state=initial;
  return {async load(){return state},async dispatch(command,rooms){const result=applyDay1Command(state,command,rooms);state=result.state;return result}};
}
