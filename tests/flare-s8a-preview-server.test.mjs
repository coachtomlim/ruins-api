import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {localPath} from '../tools/flare-s8a-preview-server.mjs';

test('local preview maps four-character m invite to S8A challenge shell',()=>{
  const file=localPath('/m/UvVY');
  assert.match(file,new RegExp(`flare-s8a${path.sep.replace('\\','\\\\')}challenge\\.html$`));
});

test('local preview maps quick-dungeon S8A root to index',()=>{
  const file=localPath('/quick-dungeon/flare-s8a/');
  assert.match(file,new RegExp(`flare-s8a${path.sep.replace('\\','\\\\')}index\\.html$`));
});

test('local preview rejects path traversal',()=>{
  assert.throws(()=>localPath('/quick-dungeon/../../../../etc/passwd'));
});
