begin transaction isolation level repeatable read read only;
with s as (
  select oid,nspname::text from pg_namespace where nspname=any(string_to_array(:'scope',','))
), x as (
  select 'schema'::text k,s.nspname obj,
    pg_get_userbyid(n.nspowner)||' acl='||coalesce(n.nspacl::text,'<default>') detail
    from s join pg_namespace n using(oid)
  union all select 'relation',s.nspname||'.'||c.relname||' ['||c.relkind::text||']',
    pg_get_userbyid(c.relowner)||' acl='||coalesce(c.relacl::text,'<default>')||' rls='||c.relrowsecurity||' force='||c.relforcerowsecurity
    from pg_class c join s on s.oid=c.relnamespace where c.relkind in ('r','v','m','S','p','f')
  union all select 'column',s.nspname||'.'||c.relname||'.'||a.attname,
    format_type(a.atttypid,a.atttypmod)||' notnull='||a.attnotnull||' gen='||a.attgenerated::text||' ident='||a.attidentity::text||' acl='||coalesce(a.attacl::text,'<default>')
    from pg_attribute a join pg_class c on c.oid=a.attrelid join s on s.oid=c.relnamespace
    where c.relkind in ('r','p','v','m','f') and a.attnum>0 and not a.attisdropped
  union all select 'constraint',co.conrelid::regclass::text||'.'||co.conname,pg_get_constraintdef(co.oid,true)
    from pg_constraint co join s on s.oid=co.connamespace where co.conrelid<>0
  union all select 'index',s.nspname||'.'||c.relname,pg_get_indexdef(c.oid)
    from pg_class c join s on s.oid=c.relnamespace where c.relkind in ('i','I')
  union all select 'policy',schemaname||'.'||tablename||'.'||policyname,
    permissive||' '||cmd||' roles='||array_to_string(roles,',')||' using='||coalesce(qual,'')||' check='||coalesce(with_check,'')
    from pg_policies where schemaname=any(string_to_array(:'scope',','))
  union all select 'function',p.oid::regprocedure::text,
    pg_get_userbyid(p.proowner)||' acl='||coalesce(p.proacl::text,'<default>')||' definer='||p.prosecdef||' cfg='||coalesce(p.proconfig::text,'')||' vol='||p.provolatile::text||' src='||md5(replace(p.prosrc,chr(13),''))
    from pg_proc p join s on s.oid=p.pronamespace where not exists(select 1 from pg_depend d where d.objid=p.oid and d.deptype='e')
  union all select 'trigger',tgrelid::regclass::text||'.'||tgname,tgenabled::text||' '||pg_get_triggerdef(t.oid,true)
    from pg_trigger t join pg_class c on c.oid=t.tgrelid join s on s.oid=c.relnamespace where not tgisinternal
  union all select 'view',c.oid::regclass::text,md5(pg_get_viewdef(c.oid,true))
    from pg_class c join s on s.oid=c.relnamespace where c.relkind in ('v','m')
  union all select 'sequence',c.oid::regclass::text,format_type(q.seqtypid,null)||' inc='||q.seqincrement||' min='||q.seqmin||' max='||q.seqmax||' start='||q.seqstart||' cache='||q.seqcache||' cycle='||q.seqcycle
    from pg_sequence q join pg_class c on c.oid=q.seqrelid join s on s.oid=c.relnamespace
  union all select 'type',s.nspname||'.'||t.typname,
    t.typtype::text||' category='||t.typcategory::text||' owner='||pg_get_userbyid(t.typowner)||' acl='||coalesce(t.typacl::text,'<default>')||' enum='||coalesce((select string_agg(e.enumlabel,',' order by e.enumsortorder) from pg_enum e where e.enumtypid=t.oid),'')
    from pg_type t join s on s.oid=t.typnamespace where t.typtype in ('e','d','c') and not exists(select 1 from pg_depend d where d.objid=t.oid and d.deptype='e')
  union all select 'defacl',pg_get_userbyid(d.defaclrole)||' '||case when d.defaclnamespace=0 then '-' else d.defaclnamespace::regnamespace::text end||' '||d.defaclobjtype::text,d.defaclacl::text
    from pg_default_acl d where d.defaclnamespace=0 or d.defaclnamespace in(select oid from s)
  union all select 'effective',r.rolname||' '||s.nspname||'.'||c.relname,
    has_table_privilege(r.oid,c.oid,'SELECT')::int::text||has_table_privilege(r.oid,c.oid,'INSERT')::int::text||
    has_table_privilege(r.oid,c.oid,'UPDATE')::int::text||has_table_privilege(r.oid,c.oid,'DELETE')::int::text||
    has_table_privilege(r.oid,c.oid,'TRUNCATE')::int::text||has_table_privilege(r.oid,c.oid,'REFERENCES')::int::text||has_table_privilege(r.oid,c.oid,'TRIGGER')::int::text
    from pg_roles r cross join pg_class c join s on s.oid=c.relnamespace
    where r.rolname in ('anon','authenticated','service_role','postgres') and c.relkind in ('r','p','v','m')
  union all select 'effective',r.rolname||' seq '||s.nspname||'.'||c.relname,
    has_sequence_privilege(r.oid,c.oid,'USAGE')::int::text||has_sequence_privilege(r.oid,c.oid,'SELECT')::int::text||has_sequence_privilege(r.oid,c.oid,'UPDATE')::int::text
    from pg_roles r cross join pg_class c join s on s.oid=c.relnamespace
    where r.rolname in ('anon','authenticated','service_role','postgres') and c.relkind='S'
  union all select 'effective',r.rolname||' schema '||s.nspname,
    has_schema_privilege(r.oid,s.oid,'USAGE')::int::text||has_schema_privilege(r.oid,s.oid,'CREATE')::int::text
    from pg_roles r cross join s where r.rolname in ('anon','authenticated','service_role','postgres')
  union all select 'effective',r.rolname||' fn '||p.oid::regprocedure::text,has_function_privilege(r.oid,p.oid,'EXECUTE')::int::text
    from pg_roles r cross join pg_proc p join s on s.oid=p.pronamespace where r.rolname in ('anon','authenticated','service_role','postgres')
)
select coalesce(json_agg(row_to_json(x) order by x.k,x.obj),'[]'::json) from x;
rollback;
