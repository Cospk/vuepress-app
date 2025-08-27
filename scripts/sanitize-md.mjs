#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';

const roots = [
  'src/golang/基础',
  'src/golang/原理/theory',
];

function splitByFences(text) {
  const parts = [];
  let i = 0;
  let inFence = false;
  const lines = text.split('\n');
  let buf = [];
  let fenceLang = '';
  for (const line of lines) {
    const fenceOpen = line.startsWith('```');
    if (fenceOpen) {
      if (!inFence) {
        // flush non-fence chunk
        if (buf.length) parts.push({ inFence, text: buf.join('\n') + '\n' });
        buf = [line];
        inFence = true;
        fenceLang = line.slice(3).trim();
      } else {
        // closing fence
        buf.push(line);
        parts.push({ inFence, text: buf.join('\n') + '\n' });
        buf = [];
        inFence = false;
        fenceLang = '';
      }
    } else {
      buf.push(line);
    }
  }
  if (buf.length) parts.push({ inFence, text: buf.join('\n') });
  return parts;
}

function escapeMustacheOutsideCode(text) {
  const parts = splitByFences(text);
  const out = parts.map(p => {
    if (p.inFence) return p.text; // keep code fences untouched
    // 先保护已有反引号包裹的内容，避免破坏 inline code
    const tokens = p.text.split(/(`[^`]*`)/g);
    return tokens.map(tok => {
      if (tok.startsWith('`') && tok.endsWith('`')) return tok; // keep inline code
      // 将 {{ 与 }} 用反引号包裹，避免 Vue 插值
      return tok.replace(/\{\{/g, '`{{`').replace(/\}\}/g, '`}}`');
    }).join('');
  }).join('');
  return out;
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

function isValidUrl(u) {
  try { const x = new URL(u); return x.protocol === 'http:' || x.protocol === 'https:'; } catch { return false; }
}

async function fixImages(markdown, fileDir) {
  // Markdown images
  let changed = false;
  markdown = await markdown.replace(/!\[[^\]]*\]\(([^)]+)\)/g, (m, url) => {
    const link = url.trim();
    if (isValidUrl(link)) return m; // keep http(s)
    const local = path.resolve(fileDir, link);
    if (!link || link.startsWith('data:')) return '[图片待补充]';
    if (!link || link.startsWith('#')) return '[图片待补充]';
    // 同步检查在 replace 中不便，先标记，稍后二次处理
    return `__CHECK_IMG__${link}__`;
  });
  // HTML <img>
  markdown = await markdown.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, (m, url) => {
    const link = url.trim();
    if (isValidUrl(link)) return m; // keep http(s)
    if (!link || link.startsWith('data:') || link.startsWith('#')) return '[图片待补充]';
    return `__CHECK_IMG__${link}__`;
  });
  // 二次处理 __CHECK_IMG__ 占位：如果本地文件不存在则替换
  const re = /__CHECK_IMG__([^_]+)__/g;
  let match;
  let result = markdown;
  while ((match = re.exec(markdown)) !== null) {
    const rel = match[1];
    const abs = path.resolve(fileDir, rel);
    // eslint-disable-next-line no-await-in-loop
    const ok = await fileExists(abs);
    const replacement = ok ? `![image](${rel})` : '[图片待补充]';
    result = result.replace(match[0], replacement);
  }
  return result;
}

async function processFile(file) {
  const raw = await fs.readFile(file, 'utf8');
  let next = raw;
  // 1) 转义非代码块中的 {{ }}
  next = escapeMustacheOutsideCode(next);
  // 2) 校验图片链接并替换为占位
  const dir = path.dirname(file);
  next = await fixImages(next, dir);
  // 3) 规范代码围栏：还原转义的反引号并确保独占一行
  next = next.replace(/\\`\\`\\`/g, '```');
  next = next.replace(/([^\n])```/g, '$1\n```');
  next = next.replace(/```([^\n])/g, '```\n$1');
  // 4) 移除带属性的 p 标签，避免 Vue 解析 attribute 冲突
  next = next.replace(/<p\s+[^>]*>/gi, '<p>');
  if (next !== raw) await fs.writeFile(file, next, 'utf8');
}

async function main() {
  const patterns = roots.map(r => path.posix.join(r, '**/*.md'));
  const files = await globby(patterns, { gitignore: true });
  let ok = 0, fail = 0;
  for (const f of files) {
    try { await processFile(f); ok++; }
    catch (e) { fail++; console.error('Sanitize failed:', f, e.message); }
  }
  console.log(`Sanitized ${ok} files, ${fail} failed.`);
}

main().catch(e => { console.error(e); process.exit(1); });
