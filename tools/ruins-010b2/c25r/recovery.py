#!/usr/bin/env python3
"""Synthetic external custody rehearsal; private identities never enter Cloud Shell.
Requires pyrage==1.3.0. Artifact and receipt paths are local cloud scratch, not Owner PC.
"""
import pathlib,sys,json,gzip,tarfile,io,os,pyrage,zlib
from protocol import require,sha
os.umask(0o077)
LIMIT=8*1024*1024
def bounded_gzip(b):
 d=zlib.decompressobj(16+zlib.MAX_WBITS);out=d.decompress(b,LIMIT+1)
 require(len(out)<=LIMIT and d.eof and not d.unused_data and not d.unconsumed_tail,'gzip limit/truncation')
 return out
def load_artifact(path,keypath,receipt):
 blob=pathlib.Path(path).read_bytes();require(len(blob)==receipt['artifact']['bytes'] and sha(blob)==receipt['artifact']['sha256'],'artifact pin mismatch')
 require(not pathlib.Path('/tmp/c25r-capture-custody/fake.key').exists(),'original custody A must be removed')
 key=pyrage.x25519.Identity.from_str(pathlib.Path(keypath).read_text())
 require(str(key.to_public())==receipt['identity']['recipient'],'wrong recovery identity/recipient')
 with tarfile.open(fileobj=io.BytesIO(blob),mode='r:gz') as tf:
  names=['data.age','history.age','inventory.age','managed_baseline.age','manifest.age','roles.age','schema.age']
  require(sorted(tf.getnames())==names,'outer archive members')
  require(all(x.isfile() and x.size<LIMIT for x in tf.getmembers()),'outer member kind/limit')
  encrypted={n:tf.extractfile(n).read() for n in names}
 manifest=json.loads(pyrage.decrypt(encrypted['manifest.age'],[key]));require(manifest['identity']==receipt['identity'],'stale manifest identity')
 plain={}
 for n,pin in manifest['members'].items():
  b=bounded_gzip(pyrage.decrypt(encrypted[n+'.age'],[key]));require(len(b)==pin['bytes'] and sha(b)==pin['sha256'],'member integrity');plain[n]=b
 manifest['original_artifact_sha256']=sha(blob)
 plain['manifest']=json.dumps(manifest,sort_keys=True).encode()
 return plain,encrypted,key
def recover(path,keypath,receiptpath,new_recipient):
 receipt=json.loads(pathlib.Path(receiptpath).read_text());plain,encrypted,key=load_artifact(path,keypath,receipt)
 negatives=[]
 other=pyrage.x25519.Identity.generate()
 for label,b,k in [('wrong_key',encrypted['manifest.age'],other),('wrong_recipient',pyrage.encrypt(b'FAKE_ONLY',[other.to_public()]),key),('corrupted_ciphertext',encrypted['manifest.age'][:-1]+bytes([encrypted['manifest.age'][-1]^1]),key)]:
  try:pyrage.decrypt(b,[k])
  except pyrage.DecryptError:negatives.append(label)
  else:raise RuntimeError('negative cryptographic test accepted')
 data=io.BytesIO()
 with tarfile.open(fileobj=data,mode='w:gz') as t:
  for n,b in plain.items():
   ti=tarfile.TarInfo(n);ti.size=len(b);t.addfile(ti,io.BytesIO(b))
 r=pyrage.x25519.Recipient.from_str(new_recipient)
 relay=pyrage.encrypt(data.getvalue(),[r]);pathlib.Path('c25r/recovery-relay.age').write_bytes(relay)
 out={'status':'C25R_INDEPENDENT_COPY_RECOVERY_PASS','original_artifact_sha256':receipt['artifact']['sha256'],'relay_sha256':sha(relay),'relay_bytes':len(relay),'inventory_sha256':sha(plain['inventory']),'negative_checks':negatives,'plaintext_files':False,'key_custody':'synthetic A deleted; B outside capture VM on Work host; not durable Owner custody'}
 pathlib.Path('c25r/key-recovery-receipt.json').write_text(json.dumps(out,sort_keys=True)+'\n');print(json.dumps(out,sort_keys=True))
if __name__=='__main__':require(not sys.flags.optimize,'Python optimization prohibited');recover(*sys.argv[1:])
