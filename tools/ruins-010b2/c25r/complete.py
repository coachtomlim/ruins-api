#!/usr/bin/env python3
"""Consume a verified transferred restore receipt, preserving original lineage."""
import pathlib,json,sys
from protocol import Journal,require
root=pathlib.Path(sys.argv[1]);c=json.loads((root/'capture-receipt.json').read_text());r=json.loads((root/'restore-receipt.json').read_text())
j=Journal(root/'state.json',c['identity'])
require(r['status']=='C25R_FRESH_ADMIN_RESTORE_PASS' and r['tables']==c['tables']>=24 and r['rows']==c['rows'],'restore scope incomplete')
require(r['original_artifact_sha256']==c['artifact']['sha256'] and r['inventory_sha256']==c['inventory_sha256'],'restore lineage differs')
require(r['effective_checks']==c['source_effective_checks'] and r['inventory_categories']>=13,'effective checks/inventory incomplete')
require(set(r['negative_checks'])=={'wrong_key','authenticated_ciphertext_corruption','effective_ACL_drift_detected','role_drift_detected','incomplete_history_detected'},'negative proof incomplete')
if r['schema_acl_semantics']:require(r['schema_acl_semantics']['raw_source_schema_pin_matched'] and r['schema_acl_semantics']['owner_and_exploded_acl_match'],'schema semantics not proven')
e={'artifact_sha256':r['original_artifact_sha256'],'inventory_sha256':r['inventory_sha256'],'inventory_match':True,'effective_privileges_match':True,'fresh_target':True}
j.advance('RESTORE_VERIFIED',e);before=j.path.read_bytes();j.advance('RESTORE_VERIFIED',e);require(j.path.read_bytes()==before,'completion retry not idempotent');require(j.passed(),'completion gate closed')
out={'status':'010B2_C2_5R_PRELIVE: PASS','scope':'SYNTHETIC_LOGICAL_DATABASE_PACKAGE_ONLY','journal_final_state':'RESTORE_VERIFIED','artifact_sha256':c['artifact']['sha256'],'inventory_sha256':c['inventory_sha256'],'tables':r['tables'],'rows':r['rows'],'effective_checks':r['effective_checks'],'completion_retry_identical':True,'pending_owner_decisions':['NEEDS_OWNER_MAINTENANCE_WINDOW_AUTH','NEEDS_OWNER_KEY_CUSTODY_DECISION'],'managed_supabase_recovery':'UNOBSERVED_SEPARATE_GATE','C3':'HOLD','011A':'HOLD'}
(root/'completion-receipt.json').write_text(json.dumps(out,sort_keys=True)+'\n');print(json.dumps(out,sort_keys=True))
