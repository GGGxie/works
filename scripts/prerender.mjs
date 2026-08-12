// 构建后把每个路由渲染成带内容的静态 HTML：IM 抓预览和搜索引擎都不执行 JS
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SITE_URL = 'https://works.gggxie.com';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const config = JSON.parse(
  fs.readFileSync(path.join(root, 'public', 'config', 'projects.json'), 'utf8')
);
const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const { render } = await import(pathToFileURL(ssrEntry).href);

const siteName = config.profile.name;
const defaultImage = '/og-image.png';

const routes = [
  {
    url: '/',
    title: `${siteName} - 全栈工程师作品集`,
    description: config.profile.bio,
    image: defaultImage,
  },
  {
    url: '/about',
    title: `关于 - ${siteName}`,
    description: config.profile.bio,
    image: defaultImage,
  },
  ...config.projects.map((project) => ({
    url: `/projects/${project.id}`,
    title: `${project.name} - ${siteName}`,
    description: project.description,
    image: project.image || defaultImage,
  })),
];

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHead({ url, title, description, image }) {
  const canonical = `${SITE_URL}${url}`;
  const absoluteImage = `${SITE_URL}${image}`;
  return [
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${url === '/' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="${escapeAttr(siteName)}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${absoluteImage}" />`,
    `<meta property="og:locale" content="zh_CN" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${absoluteImage}" />`,
  ].join('\n    ');
}

// JSON 内联进 script 标签时必须切断 </script> 和 HTML 注释起始符
const inlineConfig = `<script>window.__CONFIG__=${JSON.stringify(config)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029')}</script>`;

for (const route of routes) {
  const appHtml = render(route.url, config);
  const html = template
    .replace('<!--app-head-->', buildHead(route))
    .replace('<!--app-html-->', appHtml)
    .replace('<!--app-config-->', inlineConfig);

  const outFile =
    route.url === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, route.url.slice(1), 'index.html');

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html);
  console.log(`prerendered ${route.url} -> ${path.relative(root, outFile)}`);
}

const lastmod = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) =>
      `  <url><loc>${SITE_URL}${route.url}</loc><lastmod>${lastmod}</lastmod></url>`
  )
  .join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemap);
console.log(`sitemap.xml with ${routes.length} urls`);
