#!/usr/bin/env python3
"""FAKE DATA ONLY. No remote database arguments or credentials accepted."""
import base64, hashlib, io, json, os, pathlib, re, subprocess, sys, tarfile
os.umask(0o077)
ROOT=pathlib.Path("/dev/shm/ruins010b2")
IMAGE="postgres@sha256:00bc86618629af00d2937fdc5a5d63db3ff8450acf52f0636ec813c7f4902929"
SRC="ruins010b2-source"
DST="ruins010b2-restore"
def run(args,data=None,ok=True):
    p=subprocess.run(args,input=data,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    if ok and p.returncode:
        raise RuntimeError("command failed: "+args[0]+" "+p.stderr.decode(errors="replace")[:500])
    return p
def pg(name,args,data=None,ok=True):
    return run(["docker","exec","-i",name]+args,data,ok)
def sql(name,q,ok=True):
    return pg(name,["psql","-X","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1","-Atc",q],ok=ok)
def start(name):
    run(["docker","run","-d","--name",name,"--network","none",
         "--tmpfs","/var/lib/postgresql/data:rw,noexec,nosuid,size=134217728",
         "-e","POSTGRES_HOST_AUTH_METHOD=trust",IMAGE])
    import time
    for _ in range(40):
        if pg(name,["pg_isready","-U","postgres"],ok=False).returncode==0:return
        time.sleep(.25)
    raise RuntimeError("database not ready")
def digest(b):return hashlib.sha256(b).hexdigest()
SCHEMAS="'public','auth','storage','sl_sim','supabase_migrations','ruins_private'"
def inventory(name):
    queries={
    "schemas":f"select nspname,pg_get_userbyid(nspowner),nspacl::text from pg_namespace where nspname in ({SCHEMAS}) order by 1",
    "relations":f"select n.nspname,c.relname,c.relkind,pg_get_userbyid(c.relowner),c.relrowsecurity,c.relforcerowsecurity,c.relacl::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ({SCHEMAS}) order by 1,2",
    "columns":f"select n.nspname,c.relname,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,a.attidentity,pg_get_expr(d.adbin,d.adrelid) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where n.nspname in ({SCHEMAS}) and a.attnum>0 and not a.attisdropped order by 1,2,a.attnum",
    "constraints":f"select n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid) from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ({SCHEMAS}) order by 1,2,3",
    "policies":f"select schemaname,tablename,policyname,permissive,roles::text,cmd,qual,with_check from pg_policies where schemaname in ({SCHEMAS}) order by 1,2,3",
    "functions":f"select n.nspname,p.proname,pg_get_functiondef(p.oid),p.proacl::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ({SCHEMAS}) order by 1,2",
    "defaults":f"select pg_get_userbyid(d.defaclrole),n.nspname,d.defaclobjtype,d.defaclacl::text from pg_default_acl d join pg_namespace n on n.oid=d.defaclnamespace where n.nspname in ({SCHEMAS}) order by 1,2,3",
    "roles":"select rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit,rolconfig::text from pg_roles where rolname !~ '^pg_' order by 1",
    "memberships":"select r.rolname,m.rolname,g.rolname,a.admin_option,a.inherit_option,a.set_option from pg_auth_members a join pg_roles r on r.oid=a.roleid join pg_roles m on m.oid=a.member join pg_roles g on g.oid=a.grantor order by 1,2,3"
    }
    result={k:digest(sql(name,q).stdout) for k,q in queries.items()}
    tables=sql(name,f"select n.nspname||'.'||c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ({SCHEMAS}) order by 1").stdout.decode().splitlines()
    result["rows"]={}
    for table in tables:
        b=sql(name,f"select row_to_json(t)::text from {table} t order by row_to_json(t)::text").stdout
        result["rows"][table]={"rows":len(b.splitlines()),"sha256":digest(b)}
    result["sequences"]=digest(sql(name,f"select schemaname,sequencename,sequenceowner,data_type,start_value,min_value,max_value,increment_by,cycle,cache_size,last_value from pg_sequences where schemaname in ({SCHEMAS}) order by 1,2").stdout)
    assert len(tables)==24,("unexpected tables",len(tables))
    return result
def access(name):
    # Query results and SQLSTATE failures are independently checked, not merely expected text.
    tests=0
    for role in ["anon","authenticated","service_role","backup_reader"]:
        p=sql(name,f"set role {role}; select * from ruins_private.signing_keys",ok=False)
        assert p.returncode!=0 and b"permission denied" in p.stderr
        tests+=1
    for principal,want in [("00000000-0000-0000-0000-000000000001","1"),("00000000-0000-0000-0000-000000000002","0")]:
        p=sql(name,f"set role ruins_executor; set app.principal='{principal}'; select count(*) from ruins_private.expeditions")
        assert p.stdout.decode().splitlines()[-1]==want
        tests+=1
    assert sql(name,"set role ruins_executor; insert into ruins_private.expeditions values(9,'00000000-0000-0000-0000-000000000001',1)",ok=False).returncode
    assert sql(name,"insert into public.daily_trials(trial_date,seed,reward_xp) values(current_date,1,1)",ok=False).returncode
    assert sql(name,"insert into ruins_private.expeditions values(9,'00000000-0000-0000-0000-000000000001',99)",ok=False).returncode
    return tests+3
def decrypt(blob,key):
    return run(["age","-d","-i",str(key)],blob,ok=False)
def validate(blob,manifest,key):
    assert len(blob)==manifest["bytes"] and digest(blob)==manifest["sha256"],"ciphertext manifest mismatch"
    p=decrypt(blob,key)
    assert p.returncode==0,"authenticated decryption failure"
    with tarfile.open(fileobj=io.BytesIO(p.stdout),mode="r:gz") as tf:
        names=tf.getnames()
        assert sorted(names)==["database.dump","inventory.json","roles.sql"],"incomplete/unexpected members"
        files={n:tf.extractfile(n).read() for n in names}
    assert files["database.dump"].startswith(b"PGDMP") and len(files["database.dump"])>1000
    assert len(files["roles.sql"])>100 and json.loads(files["inventory.json"])
    return files
phase=sys.argv[1]
if phase=="capture":
    ROOT.mkdir(mode=0o700)
    assert run(["age","--version"]).stdout.strip()==b"1.1.1"
    start(SRC)
    for t in ["pg_dump","pg_dumpall","psql","postgres"]:
        assert b"17.6" in pg(SRC,[t,"--version"]).stdout
    fixture=pathlib.Path(sys.argv[2]).read_bytes()
    pg(SRC,["psql","-X","-U","postgres","-v","ON_ERROR_STOP=1"],fixture)
    n=access(SRC)
    before=inventory(SRC)
    # Reproduce the private-schema failure without granting backup_reader extra access.
    stock=pg(SRC,["pg_dump","-U","postgres","--role=backup_reader","-Fc"],ok=False)
    assert stock.returncode!=0 and b"ruins_private" in stock.stderr
    roles=pg(SRC,["pg_dumpall","-U","postgres","--roles-only","--no-role-passwords"]).stdout
    roles=re.sub(br"^CREATE ROLE postgres;\r?\n",b"",roles,flags=re.M)
    # Complete synthetic dump uses bootstrap superuser solely inside the isolated fake DB.
    # This is NOT a validated live/S2FIX owner-scoped capture implementation.
    db=pg(SRC,["pg_dump","-U","postgres","-Fc"]).stdout
    assert before==inventory(SRC)
    data={"roles.sql":roles,"database.dump":db,"inventory.json":json.dumps(before,sort_keys=True).encode()}
    archive=io.BytesIO()
    with tarfile.open(fileobj=archive,mode="w:gz") as tf:
        for name,b in data.items():
            ti=tarfile.TarInfo(name);ti.size=len(b);ti.mode=0o600
            tf.addfile(ti,io.BytesIO(b))
    key=ROOT/"key.txt"
    run(["age-keygen","-o",str(key)]) # public recipient stderr intentionally not logged
    recipient=run(["age-keygen","-y",str(key)]).stdout.decode().strip()
    blob=run(["age","-r",recipient],archive.getvalue()).stdout
    manifest={"kind":"RUINS_FAKE_ONLY_010B2","sha256":digest(blob),"bytes":len(blob),"image":IMAGE,"age":"1.1.1","source_checks":n,"stock_private_dump":"EXPECTED_FAIL","live_export":False}
    validate(blob,manifest,key)
    (ROOT/"proof.age").write_bytes(blob)
    (ROOT/"manifest.json").write_text(json.dumps(manifest,sort_keys=True))
    (ROOT/"source-inventory.json").write_text(json.dumps(before,sort_keys=True))
    print(json.dumps(manifest,sort_keys=True))
    print("CAPTURE_READY_FOR_CIPHERTEXT_ONLY_TRANSFER")
elif phase=="restore":
    blob=pathlib.Path(sys.argv[2]).read_bytes()
    manifest=json.loads(pathlib.Path(sys.argv[3]).read_text())
    # The trusted hash is supplied out of band from the pre-upload capture receipt.
    assert digest(blob)==sys.argv[4],"out-of-band pin mismatch"
    key=ROOT/"key.txt"
    data=validate(blob,manifest,key)
    tests=[]
    def reject(label,fn):
        try:fn()
        except (AssertionError,RuntimeError,FileNotFoundError,tarfile.TarError):tests.append(label);return
        raise AssertionError("negative test accepted: "+label)
    reject("corrupt-ciphertext",lambda:validate(blob[:-1]+bytes([blob[-1]^1]),manifest,key))
    reject("missing-file",lambda:pathlib.Path("/dev/shm/ruins010b2/absent.age").read_bytes())
    wrong=ROOT/"wrong-key.txt";run(["age-keygen","-o",str(wrong)])
    assert decrypt(blob,wrong).returncode!=0;tests.append("wrong-key")
    changed=dict(manifest,sha256="0"*64)
    reject("wrong-manifest",lambda:validate(blob,changed,key))
    # Bypass outer checksum only for adversarial authentication test.
    corrupt=blob[:-1]+bytes([blob[-1]^1])
    assert decrypt(corrupt,key).returncode!=0;tests.append("authenticated-corruption")
    recipient=run(["age-keygen","-y",str(key)]).stdout.decode().strip()
    partial=io.BytesIO()
    with tarfile.open(fileobj=partial,mode="w:gz") as tf:
        ti=tarfile.TarInfo("roles.sql");ti.size=1;tf.addfile(ti,io.BytesIO(b"x"))
    partial_blob=run(["age","-r",recipient],partial.getvalue()).stdout
    reject("partial-dump",lambda:validate(partial_blob,dict(manifest,bytes=len(partial_blob),sha256=digest(partial_blob)),key))
    start(DST)
    pg(DST,["psql","-X","-U","postgres","-v","ON_ERROR_STOP=1"],data["roles.sql"])
    pg(DST,["pg_restore","-U","postgres","-d","postgres","--exit-on-error"],data["database.dump"])
    expected=json.loads(data["inventory.json"])
    assert inventory(DST)==expected,"restored inventory differs"
    checks=access(DST)
    permission_baseline=inventory(DST)
    sql(DST,"grant usage on schema ruins_private to authenticated; grant select on ruins_private.signing_keys to authenticated")
    altered=inventory(DST)
    assert altered["schemas"]!=permission_baseline["schemas"] and altered["relations"]!=permission_baseline["relations"]
    tests.append("changed-permission")
    assert sql(DST,"set role authenticated; select count(*) from ruins_private.signing_keys").stdout.decode().splitlines()[-1]=="1"
    # Deliberately changed disposable target is retained only until immediate cleanup.
    receipt={"status":"C2_DATABASE_RESTORE_PASS","table_count":len(expected["rows"]),"row_total":sum(v["rows"] for v in expected["rows"].values()),"inventory_categories":len(expected)-1,"negative_tests":tests,"access_checks":checks,"ciphertext_sha256":digest(blob),"restore_input":"Drive-retrieved ciphertext required; caller must prove transfer","live_export":False}
    (ROOT/"restore-receipt.json").write_text(json.dumps(receipt,sort_keys=True))
    print(json.dumps(receipt,sort_keys=True))
else:raise SystemExit("unknown phase")
