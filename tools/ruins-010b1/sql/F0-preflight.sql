begin transaction isolation level repeatable read read only;
select json_build_object(
  'capturedAtUtc', to_char(clock_timestamp() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  'serverVersion', current_setting('server_version'),
  'serverVersionNum', current_setting('server_version_num')::int,
  'currentUser', current_user,
  'database', current_database(),
  'transactionReadOnly', current_setting('transaction_read_only'),
  'ruinsPrivateSchemaExists', exists(select 1 from pg_namespace where nspname='ruins_private'),
  'ruinsRoles', (select coalesce(json_agg(rolname order by rolname),'[]'::json) from pg_roles where rolname like 'ruins\_%'),
  'schemas', (select coalesce(json_agg(json_build_object(
      'name',n.nspname,'owner',pg_get_userbyid(n.nspowner),
      'tables',(select count(*) from pg_class c where c.relnamespace=n.oid and c.relkind in ('r','p')),
      'relations',(select count(*) from pg_class c where c.relnamespace=n.oid and c.relkind in ('r','p','v','m','S','f')))
    order by n.nspname),'[]'::json) from pg_namespace n where n.nspname !~ '^pg_' and n.nspname<>'information_schema'),
  'extensions', (select coalesce(json_agg(json_build_object('name',extname,'version',extversion,'schema',extnamespace::regnamespace::text) order by extname),'[]'::json) from pg_extension),
  'roles', (select coalesce(json_agg(json_build_object('name',rolname,'super',rolsuper,'login',rolcanlogin,'inherit',rolinherit,
      'createrole',rolcreaterole,'createdb',rolcreatedb,'bypassrls',rolbypassrls,'replication',rolreplication,'connlimit',rolconnlimit) order by rolname),'[]'::json)
    from pg_roles where rolname !~ '^pg_'),
  'memberships', (select coalesce(json_agg(json_build_object('role',pg_get_userbyid(roleid),'member',pg_get_userbyid(member),
      'admin',admin_option,'inherit',inherit_option,'set',set_option) order by pg_get_userbyid(roleid),pg_get_userbyid(member)),'[]'::json)
    from pg_auth_members where pg_get_userbyid(roleid) !~ '^pg_' and pg_get_userbyid(member) !~ '^pg_'),
  'publications', (select coalesce(json_agg(pubname order by pubname),'[]'::json) from pg_publication),
  'eventTriggers', (select count(*) from pg_event_trigger)
);
rollback;
