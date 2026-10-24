#!/usr/bin/env python3
"""Offline validation bridge for connected Drive list/ACL/download receipts.
Connector calls remain explicit Work actions. No Drive credentials or signed URLs
are embedded. Input receipts MUST come from actual connector observations.
"""
import json,pathlib,sys,os
from protocol import Journal,require,resolve_upload,sha
def verify(stage,root,listing_path,metadata_path,download_path):
 root=pathlib.Path(root);r=json.loads((root/'capture-receipt.json').read_text());j=Journal(root/'state.json',r['identity'])
 listing=json.loads(pathlib.Path(listing_path).read_text());meta=json.loads(pathlib.Path(metadata_path).read_text())
 candidates=[x for x in listing if x['name']==r['name']];require(len(candidates)==1,'ambiguous/missing upload; do not blindly duplicate')
 c=candidates[0];require(meta['id']==c['id'],'metadata identity mismatch')
 require(meta['parent_id']==meta['expected_parent_id'],'wrong Drive folder')
 require(meta['permissions']==[{'type':'user','role':'owner'}],'ACL not verified owner-only')
 b=pathlib.Path(download_path).read_bytes();require(len(b)==r['artifact']['bytes'] and sha(b)==r['artifact']['sha256'],'downloaded ciphertext mismatch')
 observed=[dict(c,bytes=len(b),sha256=sha(b),owner_only=True)]
 e=resolve_upload(observed,r['name'],r['artifact'])
 if stage=='DRIVE_REDOWNLOADED_VERIFIED':
  first=root/'ack-resolved-download.tar.gz';a=os.stat(first);z=os.stat(download_path)
  require((a.st_dev,a.st_ino)!=(z.st_dev,z.st_ino),'source file shortcut; independent download required')
  e['independent_download']=True
 j.advance(stage,e)
 print(json.dumps({'status':'DRIVE_STAGE_VERIFIED','stage':stage,'object_id':e['object_id'],'sha256':e['sha256'],'passed':j.passed()},sort_keys=True))
if __name__=='__main__':verify(*sys.argv[1:])
