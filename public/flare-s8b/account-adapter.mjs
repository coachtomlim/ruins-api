export const ACCOUNT_CAPABILITIES=Object.freeze(['register','signIn','signOut','getMe','claimGuestRun']);

export function unavailableAccountAdapter(){
  const unavailable=async()=>{throw new Error('ACCOUNT_SERVICE_NOT_CONFIGURED')};
  return Object.freeze({
    available:false,
    provider:'unconfigured',
    register:unavailable,
    signIn:unavailable,
    signOut:unavailable,
    getMe:unavailable,
    claimGuestRun:unavailable
  });
}

export function validateAccountAdapter(adapter){
  if(!adapter||typeof adapter!=='object')throw new Error('Account adapter is required');
  for(const capability of ACCOUNT_CAPABILITIES)if(typeof adapter[capability]!=='function')throw new Error(`Account adapter missing ${capability}`);
  return true;
}
