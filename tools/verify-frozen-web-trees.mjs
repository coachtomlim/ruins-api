import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const manifest=JSON.parse(fs.readFileSync(new URL('./frozen-web-trees.json',import.meta.url),'utf8'));

export function currentTreeSha(path,{ref='HEAD'}={}){
  return execFileSync('git',['rev-parse',`${ref}:${path}`],{encoding:'utf8'}).trim();
}

export function verifyFrozenWebTrees({ref='HEAD'}={}){
  const results=[];
  for(const [path,expected] of Object.entries(manifest.trees)){
    const actual=currentTreeSha(path,{ref});
    results.push(Object.freeze({path,expected,actual,match:actual===expected}));
  }
  return Object.freeze(results);
}

export function assertFrozenWebTrees(options={}){
  const results=verifyFrozenWebTrees(options),bad=results.filter(x=>!x.match);
  if(bad.length){const detail=bad.map(x=>`${x.path}: expected ${x.expected}, got ${x.actual}`).join('\n');throw new Error(`Frozen predecessor tree mismatch\n${detail}`)}
  return results;
}

if(import.meta.url===new URL(`file://${process.argv[1]?.replaceAll('\\','/')}`).href){
  const results=assertFrozenWebTrees();
  for(const x of results)console.log(`PASS ${x.path} ${x.actual}`);
}
