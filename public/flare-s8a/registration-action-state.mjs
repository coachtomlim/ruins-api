export function registrationActionState({accountServiceAvailable=false}={}){
  const available=Boolean(accountServiceAvailable);
  return Object.freeze({
    label:'CREATE ACCOUNT',
    enabled:available,
    status:available?'READY':'ACCOUNT CREATION NOT CONNECTED YET',
    note:available?'Continue to managed account creation.':'This S8A screen proves the registration handoff only. No account or assets are saved yet.',
    fallbackAction:'BACK TO REWARDS'
  });
}
