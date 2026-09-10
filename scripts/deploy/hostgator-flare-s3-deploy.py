#!/usr/bin/env python3
"""Deploy WEB-FLARE S3 beside the frozen S2 HostGator build.

Required environment:
  CPANEL_API_TOKEN
Optional environment:
  CPANEL_USER       default bennygoh
  CPANEL_HOST       default gator4116.hostgator.com
  FLARE_PUBLIC_BASE default https://think-2-thrive.com

Writes only to public_html/quick-dungeon/flare-s3.
It does not modify flare-s2 or flare-p0.
"""
from __future__ import annotations

import json
import os
import ssl
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

CPANEL_USER=os.environ.get('CPANEL_USER','bennygoh')
CPANEL_HOST=os.environ.get('CPANEL_HOST','gator4116.hostgator.com')
TOKEN=os.environ.get('CPANEL_API_TOKEN','')
PUBLIC_BASE=os.environ.get('FLARE_PUBLIC_BASE','https://think-2-thrive.com').rstrip('/')
REPO_ROOT=Path(__file__).resolve().parents[2]
SOURCE_SHA='0bf18137de56ef7aacfc2f462b4537ded9c8fafc'
REMOTE_ROOT='public_html/quick-dungeon/flare-s3'
S2_SOURCE_SHA='8cc57ddacfc2e12ac65b120496f1ee8915e4525b'

FILES=[
 'public/flare-s3/index.html',
 'public/flare-s3/builder.mjs',
 'public/flare-s3/flow.mjs',
 'public/flare-s3/play.html',
 'public/flare-s3/play.mjs',
 'public/flare-s3/style.css',
 'public/flare-s3/data/runner.json',
]
HTACCESS='''DirectoryIndex index.html\nAddDefaultCharset UTF-8\nAddType text/html .html\nAddType text/css .css\nAddType text/javascript .js .mjs\nAddType application/json .json\n<IfModule mod_headers.c>\nHeader set X-Content-Type-Options "nosniff"\n</IfModule>\n'''

def fail(message:str,code:int=2)->None:
 print(f'BLOCKED: {message}',file=sys.stderr);raise SystemExit(code)

def guard(path:str)->None:
 norm=path.strip('/')
 if '..' in Path(norm).parts: fail(f'unsafe remote path: {path}')
 if norm!=REMOTE_ROOT and not norm.startswith(REMOTE_ROOT+'/'): fail(f'refusing path outside {REMOTE_ROOT}: {path}')

def headers()->dict[str,str]:
 if not TOKEN: fail('CPANEL_API_TOKEN is not set')
 return {'Authorization':f'cpanel {CPANEL_USER}:{TOKEN}','User-Agent':'QuickDungeonS3Deploy/1.0','Accept':'application/json'}

def request_json(url:str,*,data:bytes|None=None,extra:dict[str,str]|None=None)->dict:
 req=Request(url,data=data,headers={**headers(),**(extra or {})},method='POST' if data is not None else 'GET')
 try:
  with urlopen(req,timeout=35,context=ssl.create_default_context()) as response: raw=response.read()
 except HTTPError as exc: fail(f'cPanel HTTP {exc.code}: {exc.read().decode("utf-8","replace")[:500]}')
 except URLError as exc: fail(f'cPanel connection failed: {exc}')
 try:return json.loads(raw.decode('utf-8'))
 except Exception:fail(f'cPanel returned non-JSON: {raw[:250]!r}')

def uapi(module:str,function:str,params:dict[str,str]|None=None,*,post:bool=False)->dict:
 query=urlencode(params or {});url=f'https://{CPANEL_HOST}:2083/execute/{module}/{function}'
 if post:return request_json(url,data=query.encode(),extra={'Content-Type':'application/x-www-form-urlencoded'})
 if query:url+='?'+query
 out=request_json(url);result=out.get('result',{})
 if not result.get('status'):fail(f'UAPI {module}::{function} failed: {result.get("errors") or result}')
 return out

def api2(module:str,function:str,params:dict[str,str])->dict:
 query={'cpanel_jsonapi_user':CPANEL_USER,'cpanel_jsonapi_apiversion':'2','cpanel_jsonapi_module':module,'cpanel_jsonapi_func':function,**params}
 out=request_json(f'https://{CPANEL_HOST}:2083/json-api/cpanel?{urlencode(query)}');result=out.get('cpanelresult',{});event=result.get('event',{})
 if not event.get('result'):fail(f'cPanel API2 {module}::{function} failed: {event.get("reason") or result}')
 return out

def names(remote_dir:str)->set[str]:
 out=uapi('Fileman','list_files',{'dir':remote_dir,'show_hidden':'1'});data=out.get('result',{}).get('data') or []
 if isinstance(data,dict):items=[*(data.get('dirs') or []),*(data.get('files') or [])]
 else:items=data if isinstance(data,list) else []
 return {str(x.get('file')) for x in items if isinstance(x,dict) and x.get('file')}

def ensure_dir(remote_dir:str)->None:
 guard(remote_dir);parent='public_html'
 for part in Path(REMOTE_ROOT).parts[1:]:
  current=names(parent)
  if part not in current:api2('Fileman','mkdir',{'path':parent,'name':part,'permissions':'0755'})
  parent+='/'+part
 if remote_dir==REMOTE_ROOT:return
 for part in Path(remote_dir).relative_to(Path(REMOTE_ROOT)).parts:
  current=names(parent)
  if part not in current:api2('Fileman','mkdir',{'path':parent,'name':part,'permissions':'0755'})
  parent+='/'+part

def save(remote_path:str,content:str)->None:
 guard(remote_path);p=Path(remote_path);ensure_dir(p.parent.as_posix())
 uapi('Fileman','save_file_content',{'dir':p.parent.as_posix(),'file':p.name,'content':content,'from_charset':'UTF-8','to_charset':'UTF-8'},post=True)

def verify_source()->None:
 try:
  subprocess.run(['git','-C',str(REPO_ROOT),'cat-file','-e',SOURCE_SHA+'^{commit}'],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
  changed=subprocess.run(['git','-C',str(REPO_ROOT),'diff','--quiet',SOURCE_SHA,'--',*FILES],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode
 except (FileNotFoundError,subprocess.CalledProcessError):fail(f'git/source commit {SOURCE_SHA} unavailable')
 if changed!=0:fail(f'S3 deploy files differ from authorised source {SOURCE_SHA}')

def public_get(url:str)->tuple[int,str,bytes,str]:
 req=Request(url,headers={'User-Agent':'Mozilla/5.0 QuickDungeonS3Probe/1.0','Cache-Control':'no-cache'})
 try:
  with urlopen(req,timeout=35,context=ssl.create_default_context()) as response:return response.status,response.headers.get_content_type(),response.read(),response.geturl()
 except HTTPError as exc:return exc.code,exc.headers.get_content_type(),exc.read(),exc.geturl()
 except URLError as exc:fail(f'public HTTPS check failed for {url}: {exc}')

def expect(url:str,types:set[str],marker:bytes|None=None)->None:
 status,ctype,body,final=public_get(url)
 if status!=200:fail(f'{url} returned HTTP {status}')
 if not final.startswith('https://'):fail(f'{url} did not remain HTTPS')
 if ctype not in types:fail(f'{url} MIME {ctype!r}, expected {sorted(types)}')
 if marker and marker not in body:fail(f'{url} missing expected marker')

def main()->None:
 verify_source();uapi('Fileman','list_files',{'dir':'public_html'})
 ensure_dir(REMOTE_ROOT);save(f'{REMOTE_ROOT}/.htaccess',HTACCESS)
 for rel in FILES:
  local=REPO_ROOT/rel
  if not local.is_file():fail(f'missing source file: {rel}')
  out=rel.removeprefix('public/flare-s3/')
  save(f'{REMOTE_ROOT}/{out}',local.read_text(encoding='utf-8'))
 base=PUBLIC_BASE+'/quick-dungeon/flare-s3/'
 expect(base,{'text/html'},b'Dungeon Master access')
 expect(base+'style.css',{'text/css'})
 expect(base+'builder.mjs',{'text/javascript','application/javascript'})
 expect(base+'play.html?demo=1&from=Buddy',{'text/html'},b'RUN THE GAUNTLET')
 expect(base+'play.mjs',{'text/javascript','application/javascript'})
 expect(base+'data/runner.json',{'application/json'},b'warrior-l1')
 # Verify frozen dependencies are still reachable without writing them.
 expect(PUBLIC_BASE+'/quick-dungeon/flare-s2/stock.mjs',{'text/javascript','application/javascript'})
 expect(PUBLIC_BASE+'/quick-dungeon/flare-p0/data/catalog.json',{'application/json'})
 print('TEST PASS')
 print(f'S3 SOURCE: {SOURCE_SHA}')
 print(f'S2 FROZEN SOURCE: {S2_SOURCE_SHA}')
 print(f'BUILDER URL: {base}')
 print(f'PLAYER DEMO URL: {base}play.html?demo=1&from=Buddy')
 print(f'PLAYER GENERATED URL: {base}play.html?from=Buddy#c=...')

if __name__=='__main__':main()
