import { marked } from 'marked';

// Every markdown file in /recipes is bundled at build time.
const files = import.meta.glob('/recipes/*.md', { query: '?raw', import: 'default', eager: true });

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parse(path, raw) {
  const slug = path.split('/').pop().replace(/\.md$/, '');
  const meta = {};
  let body = raw;

  const match = raw.match(FRONTMATTER);
  if (match) {
    body = raw.slice(match[0].length);
    for (const line of match[1].split(/\r?\n/)) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }

  return {
    slug,
    title: meta.title || slug.replace(/-/g, ' '),
    time: meta.time || '',
    blurb: meta.blurb || '',
    html: marked.parse(body),
  };
}

export const recipes = Object.entries(files).map(([path, raw]) => parse(path, raw));
