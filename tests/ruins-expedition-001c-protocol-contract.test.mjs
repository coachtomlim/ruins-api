import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const p=JSON.parse(read('docs/ruins/RUINS_DAILY_EXPEDITION_001C_STAGING_PROTOCOL_V1.json'));
const arch=read('docs/ruins/RUINS_DAILY_EXPEDITION_001C_TRUSTED_SERVER_TRANSACTION_CONTRACT_V1.md');
const matrix=read('docs/ruins/RUINS_DAILY_EXPEDITION_001C_STAGING_ACCESS_MATRIX_V1.md');

test('only staging, signed-in and nontransferable rewards are in the first authority slice',()=>{
 assert.equal(p.stagingProjectRef,'qpgwqmduqtqidmhbuclw');
 assert.equal(p.initialServerSlice.identity,'AUTHENTICATED_ONLY');
 assert.equal(p.initialServerSlice.guestServerClaims,false);
 assert.equal(p.initialServerSlice.walletTransferEnabled,false);
 assert.equal(p.initialServerSlice.sharedS8BWalletMutation,false);
 assert.equal(p.initialServerSlice.day,1);
 assert.deepEqual(p.initialServerSlice.rooms,[1,2]);
 assert.equal(p.initialServerSlice.nextDayEnabled,false);
 assert.equal(p.securityGates.ddlApplied,false);
 assert.equal(p.securityGates.productionDeploymentAuthorized,false);
});
test('calendar, retry, rest and missed-day choices are unresolved, not inferred',()=>{
 for(const key of ['calendarPolicy','restPolicy','deathRetryPolicy','missedDayPolicy'])assert.equal(p.initialServerSlice[key],'UNRESOLVED');
 for(const key of ['BEGIN_NEXT_DAY','ENTER_ROOM3','TRANSFER_REWARD','GUEST_ATTACH'])assert.ok(p.api.blockedCommands.includes(key));
});
test('PostgREST exposure and client-direct mutations are forbidden',()=>{
 assert.equal(p.server.dbSchema,'ruins_private');
 assert.equal(p.server.schemaExposedToPostgREST,false);
 assert.equal(p.server.privilegedClientSecretsAllowed,false);
 assert.equal(p.db.allTablesRlsEnabled,true);
 assert.equal(p.db.anonDirectDml,false);
 assert.equal(p.db.authenticatedDirectDml,false);
 assert.equal(p.db.publicExecuteOnInternalRoutines,false);
 assert.equal(p.securityGates.publicTablesAuthorized,false);
 assert.match(matrix,/revoke ALL/i);
});
test('server validates principal and never accepts client reward or time authority',()=>{
 assert.equal(p.server.principalFrom,'VERIFIED_SUPABASE_AUTH_GET_USER');
 assert.equal(p.api.command.requiresUserJwt,true);
 assert.equal(p.api.state.requiresUserJwt,true);
 for(const key of ['gold','xp','hp','playerId','serverTime','policy','claimSourceId'])assert.ok(p.api.forbiddenClientAuthorityFields.includes(key));
 for(const key of ['claim_resolution','day_settlement','revision','combat_outcome'])assert.ok(p.server.serverOwns.includes(key));
});
test('idempotency and stable claims span recreatable instances',()=>{
 assert.deepEqual(p.db.claimUnique,['entitlement_id','reward_source_id']);
 assert.deepEqual(p.db.operationUnique,['entitlement_id','operation_id']);
 assert.deepEqual(p.db.instanceUnique,['entitlement_id']);
 assert.equal(p.db.scopeClaimAcrossInstances,true);
 assert.equal(p.db.receiptLookupBeforeRevision,true);
 assert.equal(p.db.oneTransactionPerCommand,true);
 assert.ok(p.db.transaction.indexOf('repeat_operation_fingerprint_check') < p.db.transaction.indexOf('expected_revision_check'));
 assert.ok(p.db.transaction.indexOf('atomic_claim_inventory_checkpoint_receipt') < p.db.transaction.indexOf('commit_before_success'));
});
test('authoritative reward sources are stable and explicit',()=>{
 assert.equal(new Set(p.db.stableRewardSources).size,2);
 for(const s of p.db.stableRewardSources)assert.match(s,/^ruins-gate-c-015:room02:/);
 assert.deepEqual(p.db.settlementUnique,['entitlement_id','day_number']);
 assert.ok(p.db.internalRoutines.includes('apply_account_expedition_command'));
});
test('no accidental overlap with existing Daily Trial, Friend or SL-SIM',()=>{
 for(const k of ['dailyTrialChangesAuthorized','friendChangesAuthorized','legacySlSimChangesAuthorized']) assert.equal(p.securityGates[k],false);
 assert.match(arch,/public\.daily_trial_run/);
 assert.match(arch,/public\.wallet_ledger/);
 assert.match(matrix,/twelve legacy|12 legacy|legacy SL-SIM/i);
});
test('security advisor and role-grant preflight are mandatory, even on shared staging',()=>{
 assert.equal(p.securityGates.advisorAfterDdl,'NOT_APPLICABLE');
 assert.equal(p.securityGates.newCriticalErrorPermitted,false);
 assert.match(arch,/SECURITY_ADVISOR: PASS \| REVISE/);
 assert.match(matrix,/Data API.*(settings|schema)/i);
 assert.match(arch,/SET search_path = ''/);
});
