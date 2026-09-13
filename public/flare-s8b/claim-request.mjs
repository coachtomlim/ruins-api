const clean=value=>String(value||'').trim();

export function buildGuestClaimRequest({claimToken='',idempotencyKey=''}={}){
  const claim_token=clean(claimToken),idempotency_key=clean(idempotencyKey);
  if(!claim_token||!idempotency_key)throw new Error('claimToken and idempotencyKey are required');
  return Object.freeze({claim_token,idempotency_key});
}
