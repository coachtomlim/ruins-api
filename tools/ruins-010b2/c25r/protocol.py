"""Synthetic completion protocol. State files contain no plaintext database values."""
import json,hashlib,pathlib,os,fcntl,re
STATES=['STARTED','DUMPS_OK','ENCRYPTED','DRIVE_UPLOADED_VERIFIED','DRIVE_REDOWNLOADED_VERIFIED','RESTORE_VERIFIED']
class Rejected(RuntimeError):pass
def require(v,reason):
 if not v:raise Rejected(reason)
def canon(v):return json.dumps(v,sort_keys=True,separators=(',',':')).encode()
def sha(b):return hashlib.sha256(b).hexdigest()
def digest(v):return sha(canon(v))
class Journal:
 def __init__(self,path,identity):
  self.path=pathlib.Path(path);self.identity=identity
  require(set(identity)=={'run_id','source_pin','recipient','fixture_pin','scope','freeze'},'identity fields')
  require(re.fullmatch(r'[a-zA-Z0-9_-]{8,80}',identity['run_id']) is not None,'run id')
 def load(self):
  if not self.path.exists():return []
  doc=json.loads(self.path.read_text());require(doc['identity']==self.identity,'stale/different identity')
  rows=doc['history'];prev=digest(self.identity)
  for i,r in enumerate(rows):
   require(i<len(STATES) and r['state']==STATES[i] and r['previous']==prev,'state order/chain')
   require(r['hash']==digest({k:r[k] for k in ['state','evidence','previous']}),'state tampering')
   prev=r['hash']
  return rows
 def advance(self,state,evidence):
  require(state in STATES,'unknown state')
  self.path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
  with self.path.with_suffix('.lock').open('a') as lock:
   fcntl.flock(lock,fcntl.LOCK_EX)
   rows=self.load();idx=STATES.index(state)
   if idx<len(rows):
    require(rows[idx]['evidence']==evidence,'conflicting duplicate retry');return rows[idx]
   require(idx==len(rows),'skipped/unmet predecessor')
   self.validate(state,evidence,rows)
   prev=rows[-1]['hash'] if rows else digest(self.identity)
   r={'state':state,'evidence':evidence,'previous':prev};r['hash']=digest(r);rows.append(r)
   tmp=self.path.with_suffix('.new')
   with tmp.open('w') as f:
    json.dump({'identity':self.identity,'history':rows},f,sort_keys=True);f.flush();os.fsync(f.fileno())
   os.chmod(tmp,0o600);os.replace(tmp,self.path)
   fd=os.open(self.path.parent,os.O_RDONLY);os.fsync(fd);os.close(fd)
   return r
 def validate(self,s,e,rows):
  if s=='STARTED':require(e=={'pre_r2':True,'freeze_attestation':self.identity['freeze']},'preflight/freeze')
  elif s=='DUMPS_OK':
   require(set(e['members'])=={'roles','schema','data','history','managed_baseline','inventory'},'missing export member')
   require(all(v['bytes']>0 and len(v['sha256'])==64 and v['rc']==0 for v in e['members'].values()),'empty/failed export')
   require(e['history_rows']>=2 and e['table_count']>=24 and e['source_drift']==False,'incomplete history/fixture/drift')
  elif s=='ENCRYPTED':require(e['bytes']>100 and len(e['sha256'])==64 and e['recipient']==self.identity['recipient'] and e['manifest_authenticated']==True,'encrypted artifact')
  elif s in ['DRIVE_UPLOADED_VERIFIED','DRIVE_REDOWNLOADED_VERIFIED']:
   pin=rows[2]['evidence'];require(e['sha256']==pin['sha256'] and e['bytes']==pin['bytes'],'stale/corrupt Drive artifact')
   require(e['object_id'] and e['owner_only'] is True and e['matching_objects']==1,'ambiguous/unverified Drive object')
   if s=='DRIVE_REDOWNLOADED_VERIFIED':require(e['object_id']==rows[3]['evidence']['object_id'] and e['independent_download'] is True,'not independent retrieval')
  elif s=='RESTORE_VERIFIED':
   require(e['artifact_sha256']==rows[2]['evidence']['sha256'] and e['inventory_sha256']==rows[1]['evidence']['members']['inventory']['sha256'],'wrong restore lineage')
   require(e['inventory_match'] is True and e['effective_privileges_match'] is True and e['fresh_target'] is True,'restore unverified')
 def passed(self):return len(self.load())==len(STATES)
def resolve_upload(listing,name,pin):
 matches=[x for x in listing if x['name']==name]
 require(len(matches)==1,'missing or ambiguous upload acknowledgement')
 x=matches[0];require(x['sha256']==pin['sha256'] and x['bytes']==pin['bytes'] and x['owner_only'],'stale/corrupt/unshared object')
 return {'object_id':x['id'],'sha256':x['sha256'],'bytes':x['bytes'],'owner_only':True,'matching_objects':1}
