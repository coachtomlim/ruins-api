export const TERMINAL_RUN_STATUSES=Object.freeze(['cleared','dead','blocked','timeout']);

export function isTerminalRunStatus(status){return TERMINAL_RUN_STATUSES.includes(String(status||''));}

export function validateTerminalResult(result){
  if(!result||typeof result!=='object'||!isTerminalRunStatus(result.status))throw new Error('Recognized terminal run result is required');
  return result;
}

export function runOutcomeKind(result){
  validateTerminalResult(result);
  return result.status==='cleared'?'success':'failed';
}
