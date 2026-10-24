#!/usr/bin/env python3
"""FAKE ONLY, no database endpoints or live credentials accepted.
PG17.6 synchronized dumps, encryption, rich inventory and disposable admin restore.
"""
import os,sys,json,pathlib,subprocess as sp,time,hashlib,io,tarfile,gzip,re,shlex,selectors
from protocol import Journal,require,sha,digest,Rejected
os.umask(0o077)
IMAGE='postgres@sha256:00bc86618629af00d2937fdc5a5d63db3ff8450acf52f0636ec813c7f4902929'
APPS=['public','sl_sim','sl_sim_basic1_hosted_poc','sl_sim_basic1_postpilot']
SCHEMAS=APPS+['auth','storage','supabase_migrations']
SRC='ruins-c25r-source';DST='ruins-c25r-restore';ROOT=pathlib.Path('/dev/shm/ruins-c25r')
BASE=pathlib.Path(__file__).resolve().parent
MAX=8*1024*1024
checks=[]
def check(label,ok):require(ok,label);checks.append(label)
def run(args,data=None,ok=True,timeout=90):
 # No accidental inherited terminal reads or background SIGTTIN. Explicit data uses a pipe.
 incoming={'input':data} if data is not None else {'stdin':sp.DEVNULL}
 try:p=sp.run(args,stdout=sp.PIPE,stderr=sp.PIPE,timeout=timeout,**incoming)
 except sp.TimeoutExpired:raise Rejected('subprocess timeout (details redacted)')
 require(len(p.stdout)<=MAX and len(p.stderr)<=MAX,'synthetic output limit')
 if ok and p.returncode:raise Rejected('FAKE_ONLY command failed rc='+str(p.returncode)+' '+p.stderr.decode(errors='replace')[:500])
 return p
def pg(n,args,data=None,ok=True):return run(['docker','exec','-i',n]+args,data,ok)
def sql(n,q,user='postgres',ok=True):return pg(n,['psql','-XqAt','-U',user,'-d','postgres','-v','ON_ERROR_STOP=1','-c',q],ok=ok)
def script(n,b):return pg(n,['psql','-Xq','-U','bootstrap','-d','postgres','-v','ON_ERROR_STOP=1'],b)
def qi(x):return '"'+x.replace('"','""')+'"'
def start(n):
 require(run(['docker','inspect',n],ok=False).returncode!=0,'container name already exists')
 require(run(['docker','image','inspect',IMAGE],ok=False).returncode==0,'pinned image not cached; finish separate provisioning before starting a database')
 run(['docker','run','--pull=never','-d','--name',n,'--network','none','--memory','512m','--tmpfs','/var/lib/postgresql/data:rw,nosuid,size=268435456','-e','POSTGRES_USER=bootstrap','-e','POSTGRES_HOST_AUTH_METHOD=trust',IMAGE])
 for _ in range(150):
  if b'PostgreSQL init process complete' in run(['docker','logs',n]).stdout and pg(n,['pg_isready','-U','bootstrap'],ok=False).returncode==0:return
  time.sleep(.2)
 raise Rejected('startup timeout')
def remove(n):run(['docker','rm','-fv',n],ok=False)
def seed(n):
 for f in ['roles.sql','managed-baseline.sql','application-fixture.sql','seed.sql']:script(n,(BASE/f).read_bytes())
def keeper(n):
 p=sp.Popen(['docker','exec','-i',n,'psql','-XqAt','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1'],stdin=sp.PIPE,stdout=sp.PIPE,stderr=sp.PIPE)
 p.stdin.write(b'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY; SELECT pg_export_snapshot();\n');p.stdin.flush()
 sel=selectors.DefaultSelector();sel.register(p.stdout,selectors.EVENT_READ)
 require(bool(sel.select(10)),'keeper snapshot timeout');snap=p.stdout.readline().decode().strip();sel.close()
 require(re.fullmatch(r'[0-9A-Fa-f-]+',snap) is not None,'snapshot id invalid')
 return p,snap
def close_keeper(p):
 if p.poll() is None:
  try:p.stdin.write(b'ROLLBACK;\n\\q\n');p.stdin.flush();p.communicate(timeout=10)
  except (BrokenPipeError,sp.TimeoutExpired):p.kill();p.communicate()
def inventory(n,metadata_only=False):
 ns=','.join("'%s'"%s for s in SCHEMAS)
 qs={
 'schemas':f'select nspname,pg_get_userbyid(nspowner),nspacl::text from pg_namespace where nspname in ({ns}) order by 1',
 'relations':f'select n.nspname,c.relname,c.relkind,pg_get_userbyid(c.relowner),c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,c.reloptions::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ({ns}) order by 1,2',
 'columns':f'select n.nspname,c.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,pg_get_expr(d.adbin,d.adrelid) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where n.nspname in ({ns}) and a.attnum>0 and not a.attisdropped order by 1,2,a.attnum',
 'constraints':f'select n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ({ns}) order by 1,2,3',
 'indexes':f'select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname in ({ns}) order by 1,2,3',
 'policies':f'select schemaname,tablename,policyname,permissive,roles::text,cmd,qual,with_check from pg_policies where schemaname in ({ns}) order by 1,2,3',
 'views':f'select n.nspname,c.relname,pg_get_viewdef(c.oid,true) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind=\'v\' and n.nspname in ({ns}) order by 1,2',
 'functions':f'select n.nspname,p.proname,pg_get_functiondef(p.oid),pg_get_userbyid(p.proowner),p.proacl::text,p.proconfig::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ({ns}) order by 1,2',
 'enums':f'select n.nspname,t.typname,e.enumsortorder,e.enumlabel,pg_get_userbyid(t.typowner) from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid where n.nspname in ({ns}) order by 1,2,3',
 'defaults':f'select pg_get_userbyid(d.defaclrole),n.nspname,d.defaclobjtype,d.defaclacl::text from pg_default_acl d join pg_namespace n on n.oid=d.defaclnamespace where n.nspname in ({ns}) order by 1,2,3',
 'roles':"select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit,rolconfig::text from pg_roles where rolname !~ '^pg_' order by 1",
 'memberships':'select r.rolname,m.rolname,g.rolname,a.admin_option,a.inherit_option,a.set_option from pg_auth_members a join pg_roles r on r.oid=a.roleid join pg_roles m on m.oid=a.member join pg_roles g on g.oid=a.grantor order by 1,2,3'}
 out={k:sha(sql(n,q).stdout) for k,q in qs.items()}
 if metadata_only:return out
 tables=sql(n,f"select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ({ns}) order by 1,2").stdout.decode().splitlines()
 out['rows']={}
 for t in tables:
  s,r=t.split('|');name=qi(s)+'.'+qi(r);b=sql(n,'select row_to_json(t)::text from '+name+' t order by row_to_json(t)::text').stdout
  out['rows'][s+'.'+r]={'rows':len(b.splitlines()),'sha256':sha(b)}
 seqs=sql(n,f"select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='S' and n.nspname in ({ns}) order by 1,2").stdout.decode().splitlines()
 out['sequences']={}
 for t in seqs:
  s,r=t.split('|');out['sequences'][s+'.'+r]=sql(n,'select last_value,is_called from '+qi(s)+'.'+qi(r)).stdout.decode().strip()
 out['history_rows']=int(sql(n,'select count(*) from supabase_migrations.schema_migrations').stdout)
 require(len(tables)==32,'unexpected fixture table count')
 return out
def privileges(n):
 a='10000000-0000-0000-0000-000000000001';b='10000000-0000-0000-0000-000000000002';labels=[]
 for table,counts in [('public.profiles',[1,1]),('public.friendships',[1,0]),('sl_sim.games',[1,0]),('sl_sim_basic1_postpilot.sessions',[1,0]),('storage.objects',[1,0]),('public.accepted_friendships',[1,0])]:
  for user,want in zip([a,b],counts):
   q="set role authenticated; set request.jwt.claim.sub='"+user+"'; select count(*) from "+table
   require(sql(n,q,user='bootstrap').stdout.strip()==str(want).encode(),'RLS '+table);labels.append(table+':'+user[-1])
 for role,table in [('anon','public.profiles'),('authenticated','auth.users'),('authenticated','auth.sessions')]:
  require(sql(n,'set role '+role+'; select * from '+table,user='bootstrap',ok=False).returncode!=0,'effective denial '+table);labels.append('denied:'+role+':'+table)
 require(sql(n,'set role anon; select count(*) from public.daily_trials',user='bootstrap').stdout.strip()==b'1','anon trial read');labels.append('anon:trials')
 require(sql(n,'set role service_role; select count(*) from public.profiles',user='bootstrap').stdout.strip()==b'2','service RLS bypass');labels.append('service:bypass')
 require(sql(n,"select has_table_privilege('postgres','sl_sim_basic1_postpilot.sessions','SELECT') and not has_table_privilege('postgres','sl_sim_basic1_postpilot.sessions','UPDATE,DELETE,TRUNCATE,MAINTAIN')").stdout.strip()==b't','SELECT-only source');labels.append('source:SELECT-only')
 require(sql(n,"insert into public.daily_trials(id,trial_date,seed,reward_xp) overriding system value values(99,'2099-01-01',1,-1)",user='bootstrap',ok=False).returncode!=0,'CHECK invariant');labels.append('negative:check')
 return labels
def verify_schema_acl_semantics(n,expected,manifest):
 # ACL arrays can serialize grants in a different order without changing rights.
 # Rebuild ONLY the known fake baseline, prove its raw schema pin equals the
 # captured raw pin, then compare owner+exploded ACL semantics with the target.
 files=['roles.sql','managed-baseline.sql','application-fixture.sql','seed.sql']
 require(digest({f:sha((BASE/f).read_bytes()) for f in files})==manifest['identity']['fixture_pin'],'fixture pin differs')
 ns=','.join("'%s'"%s for s in SCHEMAS)
 raw=f'select nspname,pg_get_userbyid(nspowner),nspacl::text from pg_namespace where nspname in ({ns}) order by 1'
 semantic=f"select n.nspname,pg_get_userbyid(n.nspowner),coalesce((select string_agg(pg_get_userbyid(a.grantor)||':'||case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end||':'||a.privilege_type||':'||a.is_grantable::text,'|' order by pg_get_userbyid(a.grantor),case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type,a.is_grantable) from aclexplode(coalesce(n.nspacl,acldefault('n',n.nspowner))) a),'') from pg_namespace n where n.nspname in ({ns}) order by 1"
 start(SRC)
 try:
  seed(SRC)
  require(sha(sql(SRC,raw).stdout)==expected['schemas'],'rebuilt fake baseline does not match original raw schema pin')
  source=sql(SRC,semantic).stdout;target=sql(n,semantic).stdout
  (ROOT/'schema-acl-diagnostic.json').write_text(json.dumps({'raw_source':sql(SRC,raw).stdout.decode(),'raw_target':sql(n,raw).stdout.decode(),'semantic_source':source.decode(),'semantic_target':target.decode()},sort_keys=True))
  repaired=False
  if source!=target:
   wanted={r.split('|',2)[0]:r.split('|',2) for r in source.decode().splitlines()}
   got={r.split('|',2)[0]:r.split('|',2) for r in target.decode().splitlines()}
   different=[s for s in wanted if wanted[s]!=got.get(s)]
   require(different==['public'] and wanted['public'][1]==got['public'][1]=='postgres','schema ownership/effective ACL differs')
   a=set(wanted['public'][2].split('|'));b=set(got['public'][2].split('|'))
   require(a-b=={'postgres:PUBLIC:USAGE:false'} and not b-a,'unexpected schema privilege difference')
   # pg_restore --clean recreates public and loses initdb's implicit PUBLIC USAGE.
   # Recreate ONLY that proven original baseline grant in the disposable target.
   script(n,b'SET ROLE postgres; GRANT USAGE ON SCHEMA public TO PUBLIC; RESET ROLE;')
   target=sql(n,semantic).stdout;repaired=True
  require(source==target,'schema ownership/effective ACL differs')
  return {'raw_source_schema_pin_matched':True,'owner_and_exploded_acl_match':True,'restored_original_public_usage_baseline':repaired,'comparison':'semantic ACLs; original raw pin retained'}
 finally:remove(SRC)
def dump(n,args,snap=None):
 cmd=['pg_dump','-U','postgres','-d','postgres','-Fc']+(['--snapshot='+snap] if snap else [])+args
 p=pg(n,cmd);require(p.stdout.startswith(b'PGDMP') and len(p.stdout)>100,'empty/partial custom dump')
 pg(n,['pg_restore','--list'],p.stdout);return p.stdout
def diagnostics():
 start(SRC)
 try:
  seed(SRC);check('non_superuser',sql(SRC,'select rolsuper from pg_roles where rolname=current_user').stdout.strip()==b'f')
  check('all_32_tables_selectable',len(inventory(SRC)['rows'])==32)
  check('source_select_only_postpilot',sql(SRC,"select has_table_privilege('postgres','sl_sim_basic1_postpilot.sessions','SELECT') and not has_table_privilege('postgres','sl_sim_basic1_postpilot.sessions','UPDATE,DELETE,TRUNCATE,MAINTAIN')").stdout.strip()==b't')
  p,snap=keeper(SRC)
  try:
   sql(SRC,"update public.profiles set display_name='CONCURRENT_FAKE_EDIT' where display_name='Alice Fake'",user='bootstrap')
   data=dump(SRC,['--data-only','-n','public'],snap)
   rendered=pg(SRC,['pg_restore','--file=-'],data).stdout
   check('concurrent_DML_commits_without_SHARE_lock',sql(SRC,"select count(*) from public.profiles where display_name='CONCURRENT_FAKE_EDIT'").stdout.strip()==b'1')
   check('snapshot_dump_excludes_later_DML',b'Alice Fake' in rendered and b'CONCURRENT_FAKE_EDIT' not in rendered)
   before=inventory(SRC)
   sql(SRC,'create table public.concurrent_relation(x int)',user='bootstrap')
   # Inspect schema using the original snapshot: outcome is old catalog or a safe error.
   added=pg(SRC,['pg_dump','-U','postgres','-d','postgres','-Fc','--schema-only','-n','public','--snapshot='+snap],ok=False)
   visible=b'' if added.returncode else pg(SRC,['pg_restore','--list'],added.stdout).stdout
   check('added_relation_not_assumed_consistent',added.returncode!=0 or b'concurrent_relation' not in visible)
   check('added_relation_requires_external_DDL_freeze',sql(SRC,"select to_regclass('public.concurrent_relation') is not null").stdout.strip()==b't')
   sql(SRC,'drop table public.concurrent_relation',user='bootstrap')
   seq=sql(SRC,'select last_value from public.daily_trials_id_seq').stdout
   sql(SRC,"select nextval('public.daily_trials_id_seq')")
   check('nextval_not_snapshot_protected',sql(SRC,'select last_value from public.daily_trials_id_seq').stdout!=seq)
   roles=inventory(SRC)['memberships']
   sql(SRC,'grant app_operator to authenticated',user='bootstrap')
   check('membership_drift_detected',inventory(SRC)['memberships']!=roles)
   sql(SRC,'revoke app_operator from authenticated',user='bootstrap')
   check('membership_ABA_not_detectable_by_prepost',inventory(SRC)['memberships']==roles)
   sql(SRC,'alter role app_operator createdb',user='bootstrap')
   check('role_attribute_drift_detected',inventory(SRC)['roles']!=before['roles'])
   sql(SRC,'alter role app_operator nocreatedb',user='bootstrap')
   sql(SRC,'alter table public.profiles add column concurrent_column text',user='bootstrap')
   check('DDL_drift_detected',inventory(SRC)['columns']!=before['columns'])
   sql(SRC,'alter table public.profiles drop column concurrent_column',user='bootstrap')
  finally:close_keeper(p)
  check('expired_snapshot_rejected',pg(SRC,['pg_dump','-U','postgres','-d','postgres','-Fc','--snapshot='+snap],ok=False).returncode!=0)
  k,dead=keeper(SRC);k.kill();k.communicate()
  # Kill the database backend too: docker-exec death alone is not proof of backend death.
  sql(SRC,"select pg_terminate_backend(pid) from pg_stat_activity where usename='postgres' and state='idle in transaction'",user='bootstrap')
  check('keeper_death_rejected',pg(SRC,['pg_dump','-U','postgres','-d','postgres','-Fc','--snapshot='+dead],ok=False).returncode!=0)
  sql(SRC,'create role ruins_owner nologin; create schema ruins_private authorization ruins_owner; set role ruins_owner; create table ruins_private.signing_keys(v text);',user='bootstrap')
  check('r2_preflight_rejects',sql(SRC,"select to_regnamespace('ruins_private') is null").stdout.strip()==b'f')
  bad=pg(SRC,['pg_dump','-U','postgres','-d','postgres','-Fc'],ok=False)
  check('post_r2_whole_dump_fails_without_grants',bad.returncode!=0 and b'ruins_private' in bad.stderr)
  print(json.dumps({'status':'C25R_SNAPSHOT_DIAGNOSTICS_PASS','checks':checks,'manual_freeze_required':True,'decision':'NEEDS_OWNER_MAINTENANCE_WINDOW_AUTH','no_new_grants':True},sort_keys=True))
 finally:remove(SRC)
def encrypt_member(b,path,recipient):
 require(0<len(b)<=MAX,'member size')
 # Explicit gzip/age pipeline: plaintext only in bounded process memory and pipes.
 g=sp.Popen(['gzip','-n','-c'],stdin=sp.PIPE,stdout=sp.PIPE,stderr=sp.PIPE)
 with path.open('xb') as f:
  a=sp.Popen(['age','-r',recipient],stdin=g.stdout,stdout=f,stderr=sp.PIPE);g.stdout.close()
  _,ge=g.communicate(b,timeout=60);ae=a.communicate(timeout=60)[1]
 if g.returncode or a.returncode:path.unlink(missing_ok=True);raise Rejected('compression/encryption stage failed')
 return {'bytes':len(b),'sha256':sha(b),'rc':0}
def capture(recipient,source_pin,run_id):
 require(recipient.startswith('age1') and len(recipient)==62,'public age recipient only')
 require(re.fullmatch('[a-f0-9]{40}',source_pin) is not None,'source pin')
 ROOT.mkdir(mode=0o700);start(SRC);k=None
 try:
  seed(SRC);labels=privileges(SRC);expected=inventory(SRC)
  require(sql(SRC,"select to_regnamespace('ruins_private') is null").stdout.strip()==b't','pre-r2 guard')
  require(b'17.6' in pg(SRC,['pg_dump','--version']).stdout,'PG17.6 pin')
  files=['roles.sql','managed-baseline.sql','application-fixture.sql','seed.sql']
  fixture_pin=digest({f:sha((BASE/f).read_bytes()) for f in files})
  identity={'run_id':run_id,'source_pin':source_pin,'recipient':recipient,'fixture_pin':fixture_pin,'scope':','.join(SCHEMAS),'freeze':'SYNTHETIC_HARNESS_OWNS_ALL_WRITERS_AND_DDL_AND_ROLES'}
  j=Journal(ROOT/'state.json',identity);j.advance('STARTED',{'pre_r2':True,'freeze_attestation':identity['freeze']})
  k,snap=keeper(SRC)
  roles=pg(SRC,['pg_dumpall','-U','postgres','--roles-only','--no-role-passwords']).stdout
  require(b'CREATE ROLE authenticator;' in roles and b'PASSWORD ' not in roles,'roles export nonempty/passwordless')
  payload={'roles':roles,'managed_baseline':(BASE/'managed-baseline.sql').read_bytes(),'inventory':json.dumps(expected,sort_keys=True).encode()}
  payload['schema']=dump(SRC,['--schema-only']+sum((['-n',s] for s in APPS),[]),snap)
  payload['data']=dump(SRC,['--data-only']+sum((['-n',s] for s in SCHEMAS if s!='supabase_migrations'),[]),snap)
  payload['history']=dump(SRC,['-n','supabase_migrations'],snap)
  require(inventory(SRC)==expected,'source drift during capture')
  members={n:{'bytes':len(b),'sha256':sha(b),'rc':0} for n,b in payload.items()}
  j.advance('DUMPS_OK',{'members':members,'history_rows':expected['history_rows'],'table_count':len(expected['rows']),'source_drift':False})
  for n,b in payload.items():encrypt_member(b,ROOT/(n+'.age'),recipient)
  manifest={'identity':identity,'members':members,'snapshot':snap,'table_count':len(expected['rows']),'effective_tests':labels,'logical_scope_only':True}
  run(['age','-r',recipient,'-o',str(ROOT/'manifest.age')],json.dumps(manifest,sort_keys=True).encode())
  out=ROOT/(run_id+'.tar.gz')
  with tarfile.open(out,'w:gz') as t:
   for p in sorted(ROOT.glob('*.age')):t.add(p,arcname=p.name)
  blob=out.read_bytes();pin={'sha256':sha(blob),'bytes':len(blob),'recipient':recipient,'manifest_authenticated':True}
  j.advance('ENCRYPTED',pin)
  receipt={'status':'C25R_CAPTURE_ENCRYPTED','identity':identity,'artifact':pin,'name':out.name,'state':'ENCRYPTED','tables':len(expected['rows']),'rows':sum(x['rows'] for x in expected['rows'].values()),'inventory_sha256':members['inventory']['sha256'],'source_effective_checks':len(labels),'manual_freeze_required_for_live':True}
  (ROOT/'capture-receipt.json').write_text(json.dumps(receipt,sort_keys=True))
  print(json.dumps(receipt,sort_keys=True))
 finally:
  if k:close_keeper(k)
  remove(SRC)
def unpack_relay(blob,key):
 plain=run(['age','-d','-i',key],blob).stdout
 with tarfile.open(fileobj=io.BytesIO(plain),mode='r:gz') as tf:
  require(sorted(tf.getnames())==['data','history','inventory','managed_baseline','manifest','roles','schema'],'relay member set')
  data={n:tf.extractfile(n).read() for n in tf.getnames()}
 manifest=json.loads(data['manifest'])
 for n,m in manifest['members'].items():require(len(data[n])==m['bytes'] and sha(data[n])==m['sha256'],'manifest/member mismatch')
 return data,manifest
def restore(blobpath,key,relayhash):
 blob=pathlib.Path(blobpath).read_bytes();require(sha(blob)==relayhash,'relay pin')
 data,manifest=unpack_relay(blob,key);expected=json.loads(data['inventory']);start(DST)
 try:
  # A new administrative bootstrap recreates the provider baseline. It is not source credential elevation.
  roles=re.sub(br'^CREATE ROLE bootstrap;\r?\n',b'',data['roles'],flags=re.M)
  print('C25R_STAGE: target ready; replaying roles',file=sys.stderr,flush=True)
  script(DST,roles)
  print('C25R_STAGE: roles replayed; creating managed baseline',file=sys.stderr,flush=True)
  script(DST,data['managed_baseline'])
  for label,section in [('schema','pre-data'),('history','pre-data'),('data','data'),('history','data'),('schema','post-data'),('history','post-data')]:
   print('C25R_STAGE: restore '+label+'/'+section,file=sys.stderr,flush=True)
   args=['pg_restore','-U','bootstrap','-d','postgres','--exit-on-error','--single-transaction','--section='+section]
   if label=='schema' and section=='pre-data':args+=['--clean','--if-exists']
   pg(DST,args,data[label])
  print('C25R_STAGE: logical restore loaded; checking full inventory',file=sys.stderr,flush=True)
  actual=inventory(DST);different=[k for k in expected if actual.get(k)!=expected[k]]
  semantic_schema=None
  if different==['schemas']:
   semantic_schema=verify_schema_acl_semantics(DST,expected,manifest);different=[]
  require(not different,'fresh restore inventory mismatch '+','.join(different))
  print('C25R_STAGE: full inventory matched; checking effective privileges',file=sys.stderr,flush=True)
  labels=privileges(DST);require(labels==manifest['effective_tests'],'effective behavior differs')
  # Negative cases independently check values/catalog and actual access, not only return codes.
  negatives=[]
  wrong=ROOT/'wrong.key';run(['age-keygen','-o',str(wrong)])
  require(run(['age','-d','-i',str(wrong)],blob,ok=False).returncode!=0,'wrong identity accepted');wrong.unlink();negatives.append('wrong_key')
  corrupt=blob[:-1]+bytes([blob[-1]^1]);require(run(['age','-d','-i',key],corrupt,ok=False).returncode!=0,'corruption accepted');negatives.append('authenticated_ciphertext_corruption')
  sql(DST,'grant select on auth.sessions to authenticated',user='bootstrap')
  require(inventory(DST,metadata_only=True)['relations']!=expected['relations'],'ACL drift invisible')
  require(sql(DST,'set role authenticated; select count(*) from auth.sessions',user='bootstrap').stdout.strip()==b'1','effective ACL drift not exposed');negatives.append('effective_ACL_drift_detected')
  sql(DST,'revoke select on auth.sessions from authenticated',user='bootstrap')
  sql(DST,'alter role app_operator createdb',user='bootstrap');require(inventory(DST,metadata_only=True)['roles']!=expected['roles'],'role drift invisible');negatives.append('role_drift_detected')
  sql(DST,'alter role app_operator nocreatedb',user='bootstrap')
  sql(DST,"delete from supabase_migrations.schema_migrations where version='20261024000000'",user='bootstrap');require(int(sql(DST,'select count(*) from supabase_migrations.schema_migrations').stdout)!=expected['history_rows'],'history incomplete invisible');negatives.append('incomplete_history_detected')
  receipt={'status':'C25R_FRESH_ADMIN_RESTORE_PASS','tables':len(expected['rows']),'rows':sum(x['rows'] for x in expected['rows'].values()),'inventory_categories':len(expected)-2,'inventory_sha256':sha(data['inventory']),'effective_checks':len(labels),'negative_checks':negatives,'schema_acl_semantics':semantic_schema,'relay_sha256':sha(blob),'original_artifact_sha256':manifest['original_artifact_sha256'],'managed_supabase_restore':'UNOBSERVED_SEPARATE_GATE','live_export':False}
  (ROOT/'restore-receipt.json').write_text(json.dumps(receipt,sort_keys=True));print(json.dumps(receipt,sort_keys=True))
 finally:remove(DST)
if __name__=='__main__':
 require(not sys.flags.optimize,'run without Python optimization')
 mode=sys.argv[1]
 if mode=='diagnostics':diagnostics()
 elif mode=='capture' and len(sys.argv)==5:capture(*sys.argv[2:])
 elif mode=='restore' and len(sys.argv)==5:ROOT.mkdir(mode=0o700,exist_ok=True);restore(*sys.argv[2:])
 else:raise SystemExit('fake-only diagnostics | capture PUBLIC_RECIPIENT SOURCE_PIN RUN_ID | restore RELAY KEY HASH')
