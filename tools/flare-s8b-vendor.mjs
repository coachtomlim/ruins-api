import {copyFile,mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const source=path.join(root,'node_modules','@supabase','supabase-js','dist','umd','supabase.js');
const destinationDir=path.join(root,'public','flare-s8b','vendor');
const destination=path.join(destinationDir,'supabase.js');
const packageJson=JSON.parse(await readFile(path.join(root,'node_modules','@supabase','supabase-js','package.json'),'utf8'));

await mkdir(destinationDir,{recursive:true});
await copyFile(source,destination);
await writeFile(path.join(destinationDir,'SUPABASE_VERSION.txt'),`${packageJson.name} ${packageJson.version}\n`,'utf8');
console.log(`S8B SUPABASE VENDOR: ${packageJson.version}`);
