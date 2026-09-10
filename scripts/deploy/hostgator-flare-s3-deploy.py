#!/usr/bin/env python3
"""Deploy WEB-FLARE S3 beside the frozen S2 HostGator build.

Required environment: CPANEL_API_TOKEN
Optional: CPANEL_USER, CPANEL_HOST, FLARE_PUBLIC_BASE

Writes only to:
  public_html/quick-dungeon/flare-s3
  public_html/q
It never writes flare-s2 or flare-p0.
"""
from __future__ import annotations
import json,os,ssl,subprocess,sys
from pathlib import Path
from urllib.error import HTTPError,URLError
from urllib.parse import urlencode
from urllib.request import Request,urlopen

CPANEL_USER=os.environ.get('CPANEL_USER','bennygoh')
CPANEL_HOST=os.environ.get('CPANEL_HOST','gator4116.hostgator.com')
TOKEN=os.environ.get('CPANEL_API_TOKEN','')
PUBLIC_BASE=os.environ.get('FLARE_PUBLIC_BASE','https://think-2-thrive.com').rstrip('/')
REPO_ROOT=Path(__file__).resolve().parents[2]
SOURCE_SHA='3c1e62c82ab4277956c451ad8a396cea11b1f4a9'
S2_SOURCE_SHA='8cc57ddacfc2e12ac65b120496f1ee8915e4525b'
S3_ROOT='public_html/quick-dungeon/flare-s3'
SHORT_ROOT='public_html/q'
ALLOWED=(S3_ROOT,SHORT_ROOT)
FILES=['public/flare-s3/index.html','public/flare-s3/builder.mjs','public/flare-s3/flow.mjs','public/flare-s3/actors.mjs','public/flare-s3/play.html','public/flare-s3/play.mjs','public/flare-s3/style.css','public/flare-s3/data/runner.json']
HTACCESS='''DirectoryIndex index.html\nAddDefaultCharset UTF-8\nAddType text/html .html\nAddType text/css .css\nAddType text/javascript .js .mjs\nAddType application/json .json\n<IfModule mod_headers.c>\nHeader set X-Content-Type-Options "nosniff"\n</IfModule>\n'''
SHORT_HTACCESS='''RewriteEngine On\nRewriteRule ^([A-Za-z0-9_-]{4})/?$ /quick-dungeon/flare-s3/play.html [L]\nOptions -Indexes\n'''

def fail(message,code=2):print(f'BLOCKED: {message}',file=sys.stderr);raise SystemExit(code)
def guard(path):
 norm=path.strip('/')
 if '..' in Path(norm).parts:fail(f'unsafe remote path: {path}')
 if not any(norm==root or norm.startswith(root+'/') for root in ALLOWED):fail(f'refusing path outside S3 roots: {path}')
def headers():
 if not TOKEN:fail('CPANEL_API_TOKEN is not set')
 return {'Authorization':f'cpanel {CPANEL_USER}:{TOKEN}','User-Agent':'QuickDungeonS3Deploy/1.1','Accept':'application/json'}
def request_json(url,*,data=None,extra=None):
 req=Request(url,data=data,headers={**headers(),**(extra or {})},method='POST' if data is not None else 'GET')
 try:
  with urlopen(req,timeout=35,context=ssl.create_default_context()) as response:raw=response.read()
 except HTTPError as exc:fail(f'cPanel HTTP {exc.code}: {exc.read().decode("utf-8","replace")[:500]}')
 except URLError as exc:fail(f'cPanel connection failed: {exc}')
 try:return json.loads(raw.decode())
 except Exception:fail(f'cPanel returned non-JSON: {raw[:250]!r}')
def uapi(module,function,params=None,*,post=False):
 query=urlencode(params or {});url=f'https://{CPANEL_HOST}:2083/execute/{module}/{function}'
 out=request_json(url,data=query.encode() if post else None,extra={'Content-Type':'application/x-www-form-urlencoded'} if post else None) if post else request_json(url+('?' + query if query else ''))
 result=out.get('result',{})
 if not result.get('status'):fail(f'UAPI {module}::{function} failed: {result.get("errors") or result}')
 return out
def api2(module,function,params):
 q={'cpanel_jsonapi_user':CPANEL_USER,'cpanel_jsonapi_apiversion':'2','cpanel_jsonapi_module':module,'cpanel_jsonapi_func':function,**params};out=request_json(f'https://{CPANEL_HOST}:2083/json-api/cpanel?{urlencode(q)}');result=out.get('cpanelresult',{});event=result.get('event',{})
 if not event.get('result'):fail(f'cPanel API2 {module}::{function} failed: {event.get("reason") or result}')
 return out
def names(remote_dir):
 out=uapi('Fileman','list_files',{'dir':remote_dir,'show_hidden':'1'});data=out.get('result',{}).get('data') or []
 if isinstance(data,dict):items=[*(data.get('dirs') or []),*(data.get('files') or [])]
 else:items=data if isinstance(data,list) else []
 return {str(x.get('file')) for x in items if isinstance(x,dict) and x.get('file')}
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
def save(remote_path,content):
 guard(remote_path);p=Path(remote_path);ensure_dir(p.parent.as_posix());uapi('Fileman','save_file_content',{'dir':p.parent.as_posix(),'file':p.name,'content':content,'from_charset':'UTF-8','to_charset':'UTF-8'},post=True)
def verify_source():
 try:
  subprocess.run(['git','-C',str(REPO_ROOT),'cat-file','-e',SOURCE_SHA+'^{commit}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  changed=subprocess.run(['git','-C',str(REPO_ROOT),'diff','--quiet',SOURCE_SHA,'--',*FILES],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode
 except (FileNotFoundError,subprocess.CalledProcessError):fail(f'git/source commit {SOURCE_SHA} unavailable')
 if changed!=0:fail(f'S3 deploy files differ from authorised source {SOURCE_SHA}')
def public_get(url):
 req=Request(url,headers={'User-Agent':'Mozilla/5.0 QuickDungeonS3Probe/1.1','Cache-Control':'no-cache'})
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

def main():
 verify_source();uapi('Fileman','list_files',{'dir':'public_html'});ensure_dir(S3_ROOT);ensure_dir(SHORT_ROOT);save(f'{S3_ROOT}/.htaccess',HTACCESS);save(f'{SHORT_ROOT}/.htaccess',SHORT_HTACCESS)
 for rel in FILES:
  local=REPO_ROOT/rel
  if not local.is_file():fail(f'missing source file: {rel}')
  save(f'{S3_ROOT}/{rel.removeprefix("public/flare-s3/")}',local.read_text(encoding='utf-8'))
 base=PUBLIC_BASE+'/quick-dungeon/flare-s3/'
 expect(base,{'text/html'},b'Dungeon Master access');expect(base+'style.css',{'text/css'});expect(base+'builder.mjs',{'text/javascript','application/javascript'});expect(base+'actors.mjs',{'text/javascript','application/javascript'});expect(base+'play.html?demo=1&from=Buddy',{'text/html'},b'RUN THE GAUNTLET');expect(base+'play.mjs',{'text/javascript','application/javascript'});expect(base+'data/runner.json',{'application/json'},b'warrior-l1')
 expect(PUBLIC_BASE+'/q/AAAA',{'text/html'},b'RUN THE GAUNTLET')
 expect(PUBLIC_BASE+'/quick-dungeon/flare-s2/stock.mjs',{'text/javascript','application/javascript'});expect(PUBLIC_BASE+'/quick-dungeon/flare-p0/data/catalog.json',{'application/json'})
 print('TEST PASS');print(f'S3 SOURCE: {SOURCE_SHA}');print(f'S2 FROZEN SOURCE: {S2_SOURCE_SHA}');print(f'BUILDER URL: {base}');print(f'PLAYER DEMO URL: {base}play.html?demo=1&from=Buddy');print(f'GENERATED LINKS: {PUBLIC_BASE}/q/XXXX')
if __name__=='__main__':main()
