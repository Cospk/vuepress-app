#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import matter from 'gray-matter';
import TurndownService from 'turndown';
import { JSDOM } from 'jsdom';

const roots = [
  'src/golang/基础',
  'src/golang/原理/theory',
];

function quoteIfNeeded(title) {
  if (!title) return title;
  if (["[", "]", ":"].some(c => title.includes(c))) return `"${title}"`;
  return title;
}

function htmlToMarkdown(html) {
  // 粗暴但稳健：把 HTML 包进一个容器后用 Turndown 转 Markdown
  const dom = new JSDOM(`<div id="root">${html}</div>`);
  const service = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  });
  // 支持表格/删除线等 GFM 语法
  service.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: (content) => `~~${content}~~`,
  });
  service.keep(['svg']);
  const root = dom.window.document.getElementById('root');
  return service.turndown(root.innerHTML);
}

async function normalizeFile(file) {
  const raw = await fs.readFile(file, 'utf8');
  const fm = matter(raw, { excerpt: false });
  const data = { ...fm.data };
  if (typeof data.title === 'string') data.title = data.title.trim();

  // 将明显的 HTML 片段转换为 Markdown
  const md = htmlToMarkdown(fm.content);
  const body = md.trim() + '\n';

  // 过滤 undefined 字段，确保安全输出
  const safeData = Object.fromEntries(
    Object.entries({ ...data, title: quoteIfNeeded(data.title) })
      .filter(([, v]) => v !== undefined)
  );

  const final = matter.stringify(body, safeData);
  await fs.writeFile(file, final, 'utf8');
}

async function main() {
  const patterns = roots.map(r => path.posix.join(r, '**/*.md'));
  const files = await globby(patterns, { gitignore: true });
  let ok = 0, fail = 0;
  for (const f of files) {
    try {
      await normalizeFile(f);
      ok++;
    } catch (e) {
      fail++;
      console.error('Normalize failed:', f, e.message);
    }
  }
  console.log(`Normalized ${ok} files, ${fail} failed.`);
}

main().catch(e => { console.error(e); process.exit(1); });
