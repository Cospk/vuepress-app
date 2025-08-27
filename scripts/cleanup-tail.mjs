#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const roots = [
  'src/golang/基础',
  'src/golang/原理/theory',
];

async function cleanupFile(file){
  let s = await fs.readFile(file,'utf8');
  const before = s;
  const rules = [
    /\n+>\s*上一篇[\s\S]*$/i,
    /\n+>\s*下一篇[\s\S]*$/i,
    /\n+\[\s*上一篇[\s\S]*$/i,
    /\n+\[\s*下一篇[\s\S]*$/i,
    /\n+\*\*?上\s*一\s*篇\**[\s\S]*$/,
    /\n+\*\*?下\s*一\s*篇\**[\s\S]*$/,
    /\n+\*\*?版权\**[\s\S]*$/,
    /\n+\*\*?参考链接\**[\s\S]*$/,
    /\n+\*\s*目录\s*\*[\s\S]*$/,
  ];
  for(const r of rules){ s = s.replace(r,'\n'); }
  if(s!==before){ await fs.writeFile(file,s,'utf8'); console.log('Cleaned tail in',file); }
}

async function walk(dir){
  for (const e of await fs.readdir(dir,{withFileTypes:true})){
    const p = path.join(dir,e.name);
    if (e.isDirectory()) await walk(p);
    else if (p.endsWith('.md')) await cleanupFile(p);
  }
}

for (const root of roots){
  await walk(root);
}
