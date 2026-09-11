#!/usr/bin/env python3
"""Bounded WEB-FLARE S7 HostGator deployer. Writes only flare-s7 and /j."""
from __future__ import annotations
import hashlib,json,os,ssl,subprocess,sys
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urlencode
from urllib.request import Request,urlopen

CPANEL_USER=os.environ.get('CPANEL_USER','bennygoh');CPANEL_HOST=os.environ.get('CPANEL_HOST','gator4116.hostgator.com');TOKEN=os.environ.get('CPANEL_API_TOKEN','');PUBLIC_BASE=os.environ.get('FLARE_PUBLIC_BASE','https://think-2-thrive.com').rstrip('/')
REPO_ROOT=Path(__file__).resolve().parents[2];SOURCE_SHA='4ca60cab1d14b8f7cc98087c49a72ad132310942';S6_SOURCE_SHA='490e21b8cfe358fb96b933705d3b4206840a9305';S5_SOURCE_SHA='ecbbb4f10c2fbfab992c0bf77cdb9ac996333c3e';S4_SOURCE_SHA='a038c163530ae55ab8d6a158591443c84ebe8dde';S3_SOURCE_SHA='3c1e62c82ab4277956c451ad8a396cea11b1f4a9';S2_SOURCE_SHA='8cc57ddacfc2e12ac65b120496f1ee8915e4525b'
S7_ROOT='public_html/quick-dungeon/flare-s7';SHORT_ROOT='public_html/j';ALLOWED=(S7_ROOT,SHORT_ROOT)
FILES=['public/flare-s7/index.html','public/flare-s7/builder.mjs','public/flare-s7/flow.mjs','public/flare-s7/game.mjs','public/flare-s7/calibration.mjs','public/flare-s7/challenge.html','public/flare-s7/challenge.mjs','public/flare-s7/rooms.mjs','public/flare-s7/actors.mjs','public/flare-s7/simulation.mjs','public/flare-s7/renderer.mjs','public/flare-s7/style.css','public/flare-s7/data/game.json','public/flare-s7/data/rooms/room1.txt','public/flare-s7/data/rooms/room3.txt','public/flare-s7/data/rooms/room7.txt','public/flare-s7/data/rooms/room8.txt','public/flare-s7/data/rooms/room15.txt','public/flare-s7/data/rooms/room18.txt']
HTACCESS='''DirectoryIndex index.html\nAddDefaultCharset UTF-8\nAddType text/html .html\nAddType text/css .css\nAddType text/javascript .js .mjs\nAddType application/json .json\nAddType text/plain .txt\n<IfModule mod_headers.c>\nHeader set X-Content-Type-Options "nosniff"\n</IfModule>\n'''
SHORT_HTACCESS='''RewriteEngine On\nRewriteRule ^([A-Za-z0-9_-]{4})/?$ /quick-dungeon/flare-s7/challenge.html [L]\nOptions -Indexes\n'''
FROZEN=[(S2_SOURCE_SHA,'public/flare-s2/index.html','/quick-dungeon/flare-s2/'),(S2_SOURCE_SHA,'public/flare-s2/stock.mjs','/quick-dungeon/flare-s2/stock.mjs'),(S3_SOURCE_SHA,'public/flare-s3/index.html','/quick-dungeon/flare-s3/'),(S3_SOURCE_SHA,'public/flare-s3/actors.mjs','/quick-dungeon/flare-s3/actors.mjs'),(S4_SOURCE_SHA,'public/flare-s4/index.html','/quick-dungeon/flare-s4/'),(S4_SOURCE_SHA,'public/flare-s4/game.mjs','/quick-dungeon/flare-s4/game.mjs'),(S5_SOURCE_SHA,'public/flare-s5/index.html','/quick-dungeon/flare-s5/'),(S5_SOURCE_SHA,'public/flare-s5/challenge.mjs','/quick-dungeon/flare-s5/challenge.mjs'),(S6_SOURCE_SHA,'public/flare-s6/index.html','/quick-dungeon/flare-s6/'),(S6_SOURCE_SHA,'public/flare-s6/challenge.mjs','/quick-dungeon/flare-s6/challenge.mjs')]
def fail(message,code=2):print(f'BLOCKED: {message}',file=sys.stderr);raise SystemExit(code)
def guard(path):
 norm=path.strip('/');parts=Path(norm).parts
 if '..' in parts:fail(f'unsafe remote path: {path}')
 if not any(norm==root or norm.startswith(root+'/') for root in ALLOWED):fail(f'refusing path outside S7 roots: {path}')
def headers():
 if not TOKEN:fail('CPANEL_API_TOKEN is not set')
 return {'Authorization':f'cpanel {CPANEL_USER}:{TOKEN}','User-Agent':'QuickDungeonS7Deploy/1.0','Accept':'application/json'}
def request_json(url,*,data=None,extra=None):
 req=Request(url,data=data,headers={**headers(),**(extra or {})},method='POST' if data is not None else 'GET')
 try:
  with urlopen(req,timeout=35,context=ssl.create_default_context()) as response:raw=response.read()
 except HTTPError as exc:fail(f'cPanel HTTP {exc.code}: {exc.read().decode("utf-8","replace")[:500]}')
 except URLError as exc:fail(f'cPanel connection failed: {exc}')
 try:return json.loads(raw.decode())
 except Exception:fail(f'cPanel returned non-JSON: {raw[:250]!r}')
def uapi(module,function,params=None,*,post=False):
 query=urlencode(params or {});url=f'https://{CPANEL_HOST}:2083/execute/{module}/{function}';out=request_json(url,data=query.encode() if post else None,extra={'Content-Type':'application/x-www-form-urlencoded'} if post else None) if post else request_json(url+('?' + query if query else ''));result=out.get('result',out)
 if not result.get('status'):fail(f'UAPI {module}::{function} failed: {result.get("errors") or result}')
 return out
def api2(module,function,params):
 q={'cpanel_jsonapi_user':CPANEL_USER,'cpanel_jsonapi_apiversion':'2','cpanel_jsonapi_module':module,'cpanel_jsonapi_func':function,**params};out=request_json(f'https://{CPANEL_HOST}:2083/json-api/cpanel?{urlencode(q)}');result=out.get('cpanelresult',{});event=result.get('event',{})
 if not event.get('result'):fail(f'cPanel API2 {module}::{function} failed: {event.get("reason") or result}')
 return out
def names(remote_dir):
 out=uapi('Fileman','list_files',{'dir':remote_dir,'show_hidden':'1'});data=out.get('result',out).get('data') or [];items=[*(data.get('dirs') or []),*(data.get('files') or [])] if isinstance(data,dict) else data if isinstance(data,list) else [];return {str(x.get('file')) for x in items if isinstance(x,dict) and x.get('file')}
def root_for(path):
 norm=path.strip('/')
 for root in ALLOWED:
  if norm==root or norm.startswith(root+'/'):return root
 fail(f'no allowed root for {path}')
def ensure_dir(remote_dir):
 guard(remote_dir);root=root_for(remote_dir);parent='public_html'
 for part in Path(root).parts[1:]:
  if part not in names(parent):api2('Fileman','mkdir',{'path':parent,'name':part,'permissions':'0755'})
  parent+='/'+part
 if remote_dir==root:return
 for part in Path(remote_dir).relative_to(Path(root)).parts:
  if part not in names(parent):api2('Fileman','mkdir',{'path':parent,'name':part,'permissions':'0755'})
  parent+='/'+part
def save(remote_path,content):guard(remote_path);p=Path(remote_path);ensure_dir(p.parent.as_posix());uapi('Fileman','save_file_content',{'dir':p.parent.as_posix(),'file':p.name,'content':content,'from_charset':'UTF-8','to_charset':'UTF-8'},post=True)
def git_bytes(sha,path):
 try:return subprocess.check_output(['git','-C',str(REPO_ROOT),'show',f'{sha}:{path}'])
 except (FileNotFoundError,subprocess.CalledProcessError):fail(f'git source unavailable: {sha}:{path}')
def verify_source():
 try:subprocess.run(['git','-C',str(REPO_ROOT),'cat-file','-e',SOURCE_SHA+'^{commit}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);changed=subprocess.run(['git','-C',str(REPO_ROOT),'diff','--quiet',SOURCE_SHA,'--',*FILES],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode
 except (FileNotFoundError,subprocess.CalledProcessError):fail(f'git/source commit {SOURCE_SHA} unavailable')
 if changed!=0:fail(f'S7 deploy files differ from authorised source {SOURCE_SHA}')
def public_get(url):
 req=Request(url,headers={'User-Agent':'Mozilla/5.0 QuickDungeonS7Probe/1.0','Cache-Control':'no-cache'})
 try:
  with urlopen(req,timeout=35,context=ssl.create_default_context()) as response:return response.status,response.headers.get_content_type(),response.read(),response.geturl()
 except HTTPError as exc:return exc.code,exc.headers.get_content_type(),exc.read(),exc.geturl()
 except URLError as exc:fail(f'public HTTPS check failed for {url}: {exc}')
def expect(url,types,marker=None):
 status,ctype,body,final=public_get(url)
 if status!=200:fail(f'{url} returned HTTP {status}')
 if not final.startswith('https://'):fail(f'{url} did not remain HTTPS')
 if ctype not in types:fail(f'{url} MIME {ctype!r}, expected {sorted(types)}')
 if marker and marker not in body:fail(f'{url} missing expected marker')
 return body
def frozen_gate():
 for sha,path,url in FROZEN:
  live=expect(PUBLIC_BASE+url,{'text/html'} if path.endswith('.html') else {'text/javascript','application/javascript'});expected=git_bytes(sha,path)
  if hashlib.sha256(live).digest()!=hashlib.sha256(expected).digest():fail(f'prior release fingerprint changed: {url}')
 for url,marker in [('/q/hiS4',b'RUN THE GAUNTLET'),('/q/Rind',b'RUN THE GAUNTLET'),('/g/MsJ9',b'HOW TO PLAY'),('/h/UvVY',b'HOW TO PLAY')]:expect(PUBLIC_BASE+url,{'text/html'},marker)
def deploy():
 ensure_dir(S7_ROOT);ensure_dir(SHORT_ROOT);save(f'{S7_ROOT}/.htaccess',HTACCESS);save(f'{SHORT_ROOT}/.htaccess',SHORT_HTACCESS)
 for rel in FILES:
  local=REPO_ROOT/rel
  if not local.is_file():fail(f'missing source file: {rel}')
  save(f'{S7_ROOT}/{rel.removeprefix("public/flare-s7/")}',local.read_text(encoding='utf-8'))
def s7_gate():
 base=PUBLIC_BASE+'/quick-dungeon/flare-s7/';expect(base,{'text/html'},b'S7');expect(base+'builder.mjs',{'text/javascript','application/javascript'},b'makeInviteUrl');expect(base+'challenge.html?demo=1',{'text/html'},b'HOW TO PLAY');expect(base+'challenge.mjs',{'text/javascript','application/javascript'},b'loadS7PlayableRoom');expect(base+'rooms.mjs',{'text/javascript','application/javascript'},b'Crossed Court');expect(base+'actors.mjs',{'text/javascript','application/javascript'},b'goblin_elite.txt');expect(base+'simulation.mjs',{'text/javascript','application/javascript'},b'armorPiercing');expect(base+'style.css',{'text/css'},b'choice-box');expect(base+'data/game.json',{'application/json'},b'dart-trap');expect(base+'data/rooms/room18.txt',{'text/plain'},b'orientation=isometric');expect(PUBLIC_BASE+'/j/UvVY',{'text/html'},b'HOW TO PLAY')
def main():
 mode=sys.argv[1] if len(sys.argv)==2 else ''
 if mode not in {'auth','probe','deploy'}:fail('usage: hostgator-flare-s7-deploy.py auth|probe|deploy')
 verify_source();uapi('Fileman','list_files',{'dir':'public_html'});print('AUTH PASS')
 if mode=='auth':return
 frozen_gate();print('S2-S6 AND /q /g /h FINGERPRINTS PASS')
 if mode=='probe':print('PROBE PASS');return
 deploy();s7_gate();frozen_gate();print('TEST PASS');print(f'S7 SOURCE: {SOURCE_SHA}');print(f'BUILDER URL: {PUBLIC_BASE}/quick-dungeon/flare-s7/');print(f'S7 INVITE: {PUBLIC_BASE}/j/UvVY');print('S2-S6 AND /q /g /h: PRESERVED')
if __name__=='__main__':main()
