// 探测所有对外服务的公网/本地可达性，产出 config/health.json 供 /lab 页面读取
//
// 服务清单直接来自 cloudflared 的 ingress 配置，所以新增域名后不需要在这里补登记。
// 产物含本地端口信息，属于自用数据，nginx 侧对 config/health.json 有访问闸门。
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  evaluateHealth,
  formatAlertText,
  isDegraded,
  normalizePausedHosts,
  normalizeProbePaths,
  splitPaused,
} from './lib/probe-alerts.mjs';

const TUNNEL_CONFIG = process.env.TUNNEL_CONFIG || '/etc/cloudflared/config.yml';
const TIMEOUT_MS = 8000;
const FEISHU_CLI = process.env.FEISHU_CLI || '/root/go/bin/feishu-cli';
const ALERT_RECEIVE_ID = process.env.PROBE_ALERT_RECEIVE_ID;
const ALERT_RECEIVE_TYPE = process.env.PROBE_ALERT_RECEIVE_TYPE || 'open_id';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statePath = path.join(root, '.probe-state.json');
const alertLogPath = path.join(root, '.probe-alerts.log');
const probePathsFile = process.env.PROBE_PATHS_FILE || path.join(root, 'scripts', 'probe-paths.json');
const pausedFile = process.env.PROBE_PAUSED_FILE || path.join(root, 'scripts', 'probe-paused.json');

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

// 首页由 nginx 的 SPA 兜底恒为 200，后端停了也看不出来；这里按配置再探测每个站点的 API 路径
function readProbePaths() {
  try {
    return normalizeProbePaths(JSON.parse(fs.readFileSync(probePathsFile, 'utf8')));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`probe-paths.json ignored: ${err.message}`);
    return normalizeProbePaths(undefined);
  }
}

// 暂停名单：有意停掉的服务（开发时才启动）。仍探测并展示，但不告警、不计入降级
function readPausedHosts() {
  try {
    return normalizePausedHosts(JSON.parse(fs.readFileSync(pausedFile, 'utf8')));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`probe-paused.json ignored: ${err.message}`);
    return normalizePausedHosts(undefined);
  }
}

const probePaths = readProbePaths();
const ingress = readIngress(TUNNEL_CONFIG);
const probed = await Promise.all(
  ingress.map(async (entry) => {
    const service = {
      hostname: entry.hostname,
      target: entry.target,
      public: await probe(`https://${entry.hostname}`),
      local: await probe(entry.target),
    };
    const paths = probePaths.get(entry.hostname);
    if (paths) {
      service.extra = await Promise.all(
        paths.map(async (extraPath) => ({
          path: extraPath,
          public: await probe(`https://${entry.hostname}${extraPath}`),
          local: await probe(`${entry.target.replace(/\/$/, '')}${extraPath}`),
        }))
      );
    }
    return service;
  })
);
const { active: activeServices, paused: pausedServices } = splitPaused(probed, readPausedHosts());
// 保持 ingress 的原有顺序，/lab 展示时暂停的服务带 paused 标记
const services = probed.map(
  (service) => pausedServices.find((item) => item.hostname === service.hostname) ?? service
);

const health = { checkedAt: new Date().toISOString(), services };
const payload = `${JSON.stringify(health, null, 2)}\n`;

// public/ 给 dev server 用，dist/ 是 nginx 实际的站点根目录
for (const dir of [path.join(root, 'public', 'config'), path.join(root, 'dist', 'config')]) {
  if (!fs.existsSync(path.dirname(dir))) continue;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'health.json'), payload);
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return {};
  }
}

// 通知失败只记日志，不能影响上面已经写好的 health.json，也不能让 cron 非零退出
function notify(events, checkedAt) {
  const text = formatAlertText(events, checkedAt);
  if (!text) return;
  fs.appendFileSync(alertLogPath, `${text}\n\n`);
  if (!ALERT_RECEIVE_ID) return;
  try {
    execFileSync(
      FEISHU_CLI,
      ['msg', 'send', '--receive-id-type', ALERT_RECEIVE_TYPE, '--receive-id', ALERT_RECEIVE_ID, '--text', text],
      { stdio: 'ignore', timeout: 15000 }
    );
  } catch (err) {
    fs.appendFileSync(alertLogPath, `[notify failed] ${err.code || err.message}\n\n`);
  }
}

try {
  const { state, events } = evaluateHealth(readState(), activeServices);
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
  notify(events, health.checkedAt);
} catch (err) {
  console.error(`alert evaluation failed: ${err.message}`);
}

const down = activeServices.filter(isDegraded);
console.log(
  `probed ${services.length} services, ${down.length} degraded${
    down.length ? ': ' + down.map((service) => service.hostname).join(', ') : ''
  }`
);
