import tempfile,pathlib,json,unittest
from protocol import Journal,Rejected,resolve_upload,sha
class CompletionTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.path=pathlib.Path(self.tmp.name)/'state.json'
  self.identity={'run_id':'fake-run-001','source_pin':'a'*40,'recipient':'fake-public-recipient','fixture_pin':'b'*64,'scope':'seven-schemas','freeze':'FAKE_ONLY_SERVICE_AND_ADMIN_FREEZE'}
  self.j=Journal(self.path,self.identity)
  self.started={'pre_r2':True,'freeze_attestation':self.identity['freeze']}
  self.dumps={'members':{n:{'bytes':1000,'sha256':'c'*64,'rc':0} for n in ['roles','schema','data','history','managed_baseline','inventory']},'history_rows':2,'table_count':32,'source_drift':False}
  self.enc={'bytes':1000,'sha256':'d'*64,'recipient':self.identity['recipient'],'manifest_authenticated':True}
  self.obj={'name':'fake-run-001.age','id':'object1','bytes':1000,'sha256':'d'*64,'owner_only':True}
 def tearDown(self):self.tmp.cleanup()
 def encrypted(self):
  for s,e in [('STARTED',self.started),('DUMPS_OK',self.dumps),('ENCRYPTED',self.enc)]:self.j.advance(s,e)
 def reject(self,fn):
  with self.assertRaises(Rejected):fn()
 def test_no_early_pass_or_skips(self):
  self.assertFalse(self.j.passed());self.reject(lambda:self.j.advance('RESTORE_VERIFIED',{}));self.j.advance('STARTED',self.started);self.assertFalse(self.j.passed())
 def test_missing_empty_partial_aborted_exports(self):
  self.j.advance('STARTED',self.started)
  for mode in ['missing','empty','partial','aborted']:
   d=json.loads(json.dumps(self.dumps))
   if mode=='missing':del d['members']['data']
   elif mode=='empty':d['members']['data']['bytes']=0
   elif mode=='partial':d['members']['data']['rc']=1
   else:d['members']['data']['rc']=-15
   self.reject(lambda:self.j.advance('DUMPS_OK',d));self.assertFalse(self.j.passed())
 def test_incomplete_history(self):
  self.j.advance('STARTED',self.started);self.dumps['history_rows']=1;self.reject(lambda:self.j.advance('DUMPS_OK',self.dumps))
 def test_drift_blocks_export_completion(self):
  self.j.advance('STARTED',self.started);self.dumps['source_drift']=True;self.reject(lambda:self.j.advance('DUMPS_OK',self.dumps))
 def test_duplicate_retry_is_idempotent(self):
  self.encrypted();b=self.path.read_bytes();self.j.advance('ENCRYPTED',self.enc);self.assertEqual(b,self.path.read_bytes())
 def test_conflicting_retry(self):
  self.encrypted();self.enc['sha256']='e'*64;self.reject(lambda:self.j.advance('ENCRYPTED',self.enc))
 def test_lost_ack_resolved_by_listing_not_reupload(self):
  self.encrypted();e=resolve_upload([self.obj],self.obj['name'],self.enc);self.j.advance('DRIVE_UPLOADED_VERIFIED',e)
  self.j.advance('DRIVE_UPLOADED_VERIFIED',resolve_upload([self.obj],self.obj['name'],self.enc));self.assertEqual(len(self.j.load()),4)
 def test_missing_ambiguous_ack(self):
  for ls in [[],[self.obj,dict(self.obj,id='other')]]:self.reject(lambda:resolve_upload(ls,self.obj['name'],self.enc))
 def test_stale_ciphertext(self):
  self.encrypted();o=dict(self.obj,sha256='e'*64);self.reject(lambda:resolve_upload([o],o['name'],self.enc))
 def test_wrong_recipient(self):
  self.j.advance('STARTED',self.started);self.j.advance('DUMPS_OK',self.dumps);self.enc['recipient']='other';self.reject(lambda:self.j.advance('ENCRYPTED',self.enc))
 def test_acl_drift(self):
  o=dict(self.obj,owner_only=False);self.reject(lambda:resolve_upload([o],o['name'],self.enc))
 def test_state_tamper_and_identity_reuse(self):
  self.encrypted();doc=json.loads(self.path.read_text());doc['history'][0]['evidence']['pre_r2']=False;self.path.write_text(json.dumps(doc));self.reject(self.j.load)
  self.reject(lambda:Journal(self.path,dict(self.identity,run_id='another-run')).load())
 def test_full_lineage_and_fresh_restore(self):
  self.encrypted();e=resolve_upload([self.obj],self.obj['name'],self.enc);self.j.advance('DRIVE_UPLOADED_VERIFIED',e)
  self.j.advance('DRIVE_REDOWNLOADED_VERIFIED',dict(e,independent_download=True))
  r={'artifact_sha256':'d'*64,'inventory_sha256':'c'*64,'inventory_match':True,'effective_privileges_match':True,'fresh_target':True}
  self.reject(lambda:self.j.advance('RESTORE_VERIFIED',dict(r,effective_privileges_match=False)))
  self.reject(lambda:self.j.advance('RESTORE_VERIFIED',dict(r,artifact_sha256='e'*64)))
  self.j.advance('RESTORE_VERIFIED',r);self.assertTrue(self.j.passed())
if __name__=='__main__':unittest.main(verbosity=2)
