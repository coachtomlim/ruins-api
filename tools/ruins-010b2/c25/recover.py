#!/usr/bin/env python3
"""Fake-only recovery relay. Private key stays outside capture/browser/code/chat.
Decrypts authenticated Drive-retrieved members in bounded memory, reencrypts a
single envelope to the NEW restore VM's public recipient. No plaintext files.
Requires pyrage==1.3.0. Synthetic custody B is not a production custody design.
"""
import pathlib,tarfile,io,gzip,json,hashlib,sys,os,pyrage
os.umask(0o077)
blob=pathlib.Path(sys.argv[1]).read_bytes()
assert len(blob)<1024*1024 and hashlib.sha256(blob).hexdigest()==sys.argv[4]
key=pyrage.x25519.Identity.from_str(pathlib.Path(sys.argv[2]).read_text())
recipient=pyrage.x25519.Recipient.from_str(sys.argv[3])
with tarfile.open(fileobj=io.BytesIO(blob),mode='r:gz') as tf:
 assert sorted(tf.getnames())==['data.age','history.age','manifest.age','roles.age','schema.age']
 data={n:tf.extractfile(n).read() for n in tf.getnames()}
manifest_bytes=pyrage.decrypt(data['manifest.age'],[key])
manifest=json.loads(manifest_bytes)
payload={'manifest.json':manifest_bytes}
for name,info in manifest['files'].items():
 b=data[name]
 assert len(b)==info['bytes'] and hashlib.sha256(b).hexdigest()==info['sha256']
 plain=gzip.decompress(pyrage.decrypt(b,[key]));assert len(plain)<1024*1024
 payload[name.replace('.age','.bin')]=plain
out=io.BytesIO()
with tarfile.open(fileobj=out,mode='w:gz') as tf:
 for n,b in payload.items():
  ti=tarfile.TarInfo(n);ti.size=len(b);tf.addfile(ti,io.BytesIO(b))
encrypted=pyrage.encrypt(out.getvalue(),[recipient])
pathlib.Path('c25-recovery-relay.age').write_bytes(encrypted)
print(json.dumps({'status':'RECOVERY_KEY_B_REENCRYPTED_FROM_DRIVE','bytes':len(encrypted),'sha256':hashlib.sha256(encrypted).hexdigest(),'plaintext_files':False,'original_capture_key_present':False}))
