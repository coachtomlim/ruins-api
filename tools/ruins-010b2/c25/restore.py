#!/usr/bin/env python3
"""Fresh fake-only restore. Uses explicit bootstrap admin, NOT live authority."""
import sys,io,tarfile,json,hashlib,importlib.util,pathlib
spec=importlib.util.spec_from_file_location('c25stream','/tmp/c25-stream.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
blob=pathlib.Path(sys.argv[1]).read_bytes();m.need(hashlib.sha256(blob).hexdigest()==sys.argv[3],'relay hash mismatch')
plain=m.run(['age','-d','-i',sys.argv[2]],blob).stdout
with tarfile.open(fileobj=io.BytesIO(plain),mode='r:gz') as tf:
 m.need(sorted(tf.getnames())==['data.bin','history.bin','manifest.json','roles.bin','schema.bin'],'member set')
 files={n:tf.extractfile(n).read() for n in tf.getnames()}
expected=json.loads(files['manifest.json'])['inventory']
m.start(m.DST)
try:
 m.fixture(m.DST,False)
 # Managed baseline supplied by disposable fixture; custom schema definitions come from dump.
 for s in m.APPS[1:]+['supabase_migrations']:m.sql(m.DST,'DROP SCHEMA '+s+' CASCADE;')
 m.sql(m.DST,'DROP TABLE public.records CASCADE;')
 for label in ['schema','history','data']:
  # Bootstrap restore is deliberately labeled; platform-compatible restore is still gated.
  m.pg(m.DST,['pg_restore','-U','bootstrap','-d','postgres','--exit-on-error','--single-transaction'],files[label+'.bin'])
 m.need(m.inv(m.DST)==expected,'restored inventory mismatch')
 m.need(m.sql(m.DST,"SET ROLE authenticated; SET app.principal='alice'; SELECT count(*) FROM public.records",user='bootstrap').stdout.strip()==b'1','RLS')
 m.need(m.sql(m.DST,'SET ROLE anon; SELECT * FROM public.records',user='bootstrap',ok=False).returncode!=0,'anon exposed')
 m.need(m.sql(m.DST,"SET ROLE authenticated; SELECT * FROM auth.records",user='bootstrap',ok=False).returncode!=0,'auth exposed')
 # Negative artifacts: wrong identity and authenticated corruption must fail closed.
 m.run(['age-keygen','-o','/dev/shm/c25-wrong.key'])
 m.need(m.run(['age','-d','-i','/dev/shm/c25-wrong.key'],blob,ok=False).returncode!=0,'wrong key accepted')
 corrupt=blob[:-1]+bytes([blob[-1]^1])
 m.need(m.run(['age','-d','-i',sys.argv[2]],corrupt,ok=False).returncode!=0,'corruption accepted')
 print(json.dumps({'status':'FRESH_SYNTHETIC_RESTORE_PASS_BOOTSTRAP_ONLY','tables':7,'rows':14,'per_table_hashes':True,'sequences':True,'roles_and_memberships':'baseline reconciled, not reconstructed from captured roles.bin','rls':True,'negative_cases':['anon','auth-access','wrong-key','ciphertext-corruption'],'live_pack':'REVISE','live':False},sort_keys=True))
finally:
 m.run(['docker','rm','-fv',m.DST],ok=False)
 pathlib.Path('/dev/shm/c25-wrong.key').unlink(missing_ok=True)
