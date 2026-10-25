import copy
import datetime as dt
import json
import pathlib
import unittest
from audit import evaluate

HERE=pathlib.Path(__file__).parent
CATALOG=json.loads((HERE/'catalog_20261025.json').read_text())
PENDING=json.loads((HERE/'owner_pending.json').read_text())
NOW=dt.datetime.fromisoformat('2026-10-25T10:00:00+00:00')
# A historical synthetic fixture timestamp allows deterministic tests even after refreshing
# the live read-only catalog file. Never mutate a live catalog observation to pass a test.
CATALOG['observed_at_utc']='2026-10-25T09:58:59Z' 


def complete():
    a=copy.deepcopy(CATALOG)
    b=copy.deepcopy(PENDING)
    b['maintenance'].update(start_utc='2026-10-25T10:05:00Z',end_utc='2026-10-25T10:25:00Z',admin_change_hold_agreed=True,no_autonomous_ddl_paths_unmanaged=True)
    b['maintenance']['operator_acknowledgements']={k:True for k in b['maintenance']['operator_acknowledgements']}
    b['custody'].update(bitwarden_secure_note_attested=True, offline_independent_copy_attested=True,offline_recovery_challenge_pass=True,public_recipient_sha256='a'*64,verified_at_utc='2026-10-25T09:59:00Z')
    return a,b

class Check(unittest.TestCase):
    def test_pending_holds(self):
        out=evaluate(CATALOG,PENDING,now=NOW)
        self.assertEqual(out['status'],'C3_PREFLIGHT_HOLD')
        self.assertIn('offline_recovery_test_not_passed',out['blockers'])
        self.assertFalse(out['live_export_authorized'])
        self.assertFalse(out['011A_authorized'])
    def test_complete_attestations_still_no_authorization(self):
        a,b=complete();out=evaluate(a,b,now=NOW)
        self.assertEqual(out['status'],'READY_FOR_SEPARATE_AUTHORIZATION_REVIEW')
        self.assertFalse(out['live_export_authorized'])
        self.assertFalse(out['011A_authorized'])
    def test_expired_maintenance_window_rejected(self):
        a,b=complete()
        b['maintenance']['start_utc']='2026-10-24T10:05:00Z'
        b['maintenance']['end_utc']='2026-10-24T10:25:00Z'
        out=evaluate(a,b,now=NOW)
        self.assertIn('maintenance_window_expired',out['blockers'])
        self.assertFalse(out['live_export_authorized'])

    def test_future_maintenance_window_too_distant(self):
        a,b=complete()
        b['maintenance']['start_utc']='2026-12-25T10:05:00Z'
        b['maintenance']['end_utc']='2026-12-25T10:25:00Z'
        out=evaluate(a,b,now=NOW)
        self.assertIn('maintenance_window_too_far_ahead',out['blockers'])

    def test_current_in_progress_window_allowed_for_review_only(self):
        a,b=complete()
        b['maintenance']['start_utc']='2026-10-25T09:55:00Z'
        b['maintenance']['end_utc']='2026-10-25T10:20:00Z'
        out=evaluate(a,b,now=NOW)
        self.assertEqual(out['status'],'READY_FOR_SEPARATE_AUTHORIZATION_REVIEW')
        self.assertFalse(out['live_export_authorized'])

    def test_stale_custody_test_not_accepted(self):
        a,b=complete()
        b['custody']['verified_at_utc']='2025-01-01T00:00:00Z'
        out=evaluate(a,b,now=NOW)
        self.assertIn('custody_recovery_test_too_old',out['blockers'])

    def test_wrong_project(self):
        a,b=complete();a['project_ref']='different';self.assertIn('project_identity_mismatch',evaluate(a,b,now=NOW)['blockers'])
    def test_post_r2_blocks(self):
        a,b=complete();a['ruins_private_present']=True;self.assertIn('post_r2_detected',evaluate(a,b,now=NOW)['blockers'])
    def test_missing_schema(self):
        a,b=complete();a['schemas'].pop();self.assertIn('schema_inventory_invalid',evaluate(a,b,now=NOW)['blockers'])
    def test_wrong_table_count(self):
        a,b=complete();a['schemas'][0]['table_count']+=1;self.assertIn('schema_table_count_drift_auth',evaluate(a,b,now=NOW)['blockers'])
    def test_wrong_read_rights(self):
        a,b=complete();a['schemas'][0]['readable_count']-=1;self.assertIn('schema_select_rights_drift_auth',evaluate(a,b,now=NOW)['blockers'])
    def test_not_healthy(self):
        a,b=complete();a['project_status']='PAUSED';self.assertIn('project_not_healthy',evaluate(a,b,now=NOW)['blockers'])
    def test_metadata_expiry(self):
        a,b=complete();out=evaluate(a,b,now=NOW+dt.timedelta(hours=2));self.assertIn('catalog_refresh_required_before_review',out['blockers'])
    def test_missing_operator_ack(self):
        a,b=complete();b['maintenance']['operator_acknowledgements']['sl_sim']=False;self.assertIn('operator_ack_missing_sl_sim',evaluate(a,b,now=NOW)['blockers'])
    def test_wrong_key_recovery(self):
        a,b=complete();b['custody']['offline_recovery_challenge_pass']=False;self.assertIn('offline_recovery_test_not_passed',evaluate(a,b,now=NOW)['blockers'])
    def test_bad_freeze_interval(self):
        a,b=complete();b['maintenance']['end_utc']='2026-10-25T11:05:00Z';self.assertIn('short_freeze_window_not_pinned',evaluate(a,b,now=NOW)['blockers'])
    def test_unknown_key_rejected(self):
        a,b=complete();b['credential']='NOT_REAL';self.assertIn('plan_shape_not_allowlisted',evaluate(a,b,now=NOW)['blockers'])
    def test_secret_marker_rejected(self):
        a,b=complete();b['custody']['public_recipient_sha256']='AGE-SECRET-KEY-SHOULD-NOT-BE-HERE';self.assertIn('possible_secret_in_policy_inputs',evaluate(a,b,now=NOW)['blockers'])
    def test_auto_authorization_cannot_be_granted(self):
        a,b=complete();b['owner_c3_authorization']=True;self.assertIn('live_authorization_cannot_be_conferred_by_audit',evaluate(a,b,now=NOW)['blockers'])
    def test_duplicate_schema(self):
        a,b=complete();a['schemas'][1]['schema_name']='auth';self.assertIn('schema_names_duplicate_or_invalid',evaluate(a,b,now=NOW)['blockers'])
    def test_unidentified_ddl_path(self):
        a,b=complete();b['maintenance']['no_autonomous_ddl_paths_unmanaged']=False;self.assertIn('automatic_schema_writer_unresolved',evaluate(a,b,now=NOW)['blockers'])
    def test_unknown_catalog_field(self):
        a,b=complete();a['rows']=['sensitive'];self.assertIn('catalog_shape_not_allowlisted',evaluate(a,b,now=NOW)['blockers'])

if __name__=='__main__': unittest.main()
