// 探测所有对外服务的公网/本地可达性，产出 config/health.json 供 /lab 页面读取
//
// 服务清单直接来自 cloudflared 的 ingress 配置，所以新增域名后不需要在这里补登记。
// 产物含本地端口信息，属于自用数据，nginx 侧对 config/health.json 有访问闸门。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TUNNEL_CONFIG = process.env.TUNNEL_CONFIG || '/etc/cloudflared/config.yml';
const TIMEOUT_MS = 8000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readIngress(file) {
  if (!fs.existsSync(file)) return [];
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const entries = [];
  let current = null;

  for (const line of lines) {
    const hostname = line.match(/^\s*-\s*hostname:\s*(\S+)/);
    if (hostname) {
      current = { hostname: hostname[1], target: null };
      entries.push(current);
      continue;
    }
    const service = line.match(/^\s*(?:-\s*)?service:\s*(\S+)/);
    if (service && current && !current.target) {
      current.target = service[1];
      current = null;
    }
  }

  return entries.filter((entry) => entry.target && entry.target.startsWith('http'));
}

async function probe(url) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { redirect: 'manual', signal: controller.signal });
    return { ok: res.status < 400, status: res.status, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - started, error: err.cause?.code || err.name };
  } finally {
    clearTimeout(timer);
  }
}

const ingress = readIngress(TUNNEL_CONFIG);
const services = await Promise.all(
  ingress.map(async (entry) => ({
    hostname: entry.hostname,
    target: entry.target,
    public: await probe(`https://${entry.hostname}`),
    local: await probe(entry.target),
  }))
);

const health = { checkedAt: new Date().toISOString(), services };
const payload = `${JSON.stringify(health, null, 2)}\n`;

// public/ 给 dev server 用，dist/ 是 nginx 实际的站点根目录
for (const dir of [path.join(root, 'public', 'config'), path.join(root, 'dist', 'config')]) {
  if (!fs.existsSync(path.dirname(dir))) continue;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'health.json'), payload);
}

const down = services.filter((service) => !service.public.ok || !service.local.ok);
console.log(
  `probed ${services.length} services, ${down.length} degraded${
    down.length ? ': ' + down.map((service) => service.hostname).join(', ') : ''
  }`
);
