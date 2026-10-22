// Disposable local PostgreSQL 17.6 for the RUINS 001C offline proof.
// Uses the pinned binaries shipped in @embedded-postgres/<platform> (initdb/postgres run directly; the
// package's JS wrapper is not used). Binds 127.0.0.1 only, lives in a fresh OS temp dir, deleted on stop.
// This module can never target Supabase: it only ever connects to the server it started itself.
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import pg from 'pg';

const platformPkg={win32:'@embedded-postgres/windows-x64',linux:'@embedded-postgres/linux-x64',darwin:'@embedded-postgres/darwin-arm64'}[process.platform];
export const HERE=path.dirname(fileURLToPath(import.meta.url));
const BIN=path.join(HERE,'node_modules',platformPkg,'native','bin');
const exe=name=>path.join(BIN,process.platform==='win32'?name+'.exe':name);
// Active candidate (008 r2, principal binding) and the retained 006 draft (vulnerable-design fixture only).
export const MIGRATION=path.resolve(HERE,'../../supabase/drafts/ruins_001c/20261022200000_ruins_001c_private_expedition_r2_principal_binding_DRAFT.sql');
export const MIGRATION_006=path.resolve(HERE,'../../supabase/drafts/ruins_001c/20261022120000_ruins_001c_private_expedition_DRAFT.sql');

export async function startLocalPostgres({port=55000+Math.floor(Math.random()*4000)}={}){
  const dir=mkdtempSync(path.join(tmpdir(),'ruins-001c-pg-'));const data=path.join(dir,'data');
  const superPw=randomBytes(18).toString('hex');const pwFile=path.join(dir,'pw');writeFileSync(pwFile,superPw);
  const init=spawnSync(exe('initdb'),['-D',data,'-U','postgres','--pwfile',pwFile,'-A','scram-sha-256','-E','UTF8','--no-locale'],{encoding:'utf8'});
  if(init.status!==0)throw new Error('initdb failed: '+init.stderr);
  rmSync(pwFile);
  const server=spawn(exe('postgres'),['-D',data,'-p',String(port),'-c','listen_addresses=127.0.0.1','-c','max_connections=80','-c','fsync=off'],{stdio:['ignore','pipe','pipe']});
  let log='';server.stdout.on('data',d=>log+=d);server.stderr.on('data',d=>log+=d);
  const base={host:'127.0.0.1',port,database:'postgres'};
  const superConfig={...base,user:'postgres',password:superPw};
  for(let i=0;;i++){try{const c=new pg.Client(superConfig);await c.connect();await c.end();break}catch(e){if(i>100)throw new Error('postgres did not start: '+log.slice(-2000));await new Promise(r=>setTimeout(r,150))}}
  const version=(await query(superConfig,'select version() v, current_setting(\'server_version\') sv')).rows[0];
  return {dir,data,port,base,superConfig,version,log:()=>log,
    async stop(){server.kill();await new Promise(r=>server.once('exit',r));rmSync(dir,{recursive:true,force:true})}};
}
export async function query(config,sql,params){const c=new pg.Client(config);await c.connect();try{return await c.query(sql,params)}finally{await c.end()}}
export const readMigration=()=>readFileSync(MIGRATION,'utf8');
