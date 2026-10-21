// 把飞书「项目总览」的项目级数据同步到 GitHub Project 的项目卡片，并把 open issue 加入看板。
//
// 数据归属（见 works#1）：项目级的生命周期与优先级以飞书为准，看板只做展示；
// 任务与风险以 GitHub issue 为准；项目卡片的 Status 由「是否有未关闭的风险/任务」推导。
// 只读飞书；写 GitHub Project 的自定义字段。不输出任何凭据。
//
// 用法：node scripts/board/sync-board.mjs [--dry-run]
//   需要：gh（已登录且有 project 权限）、feishu-cli（用户已登录）
//   飞书 Base 的 token 与表 ID 取自被 git 忽略的 public/config/private.json（portfolio.baseToken / tableId）
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { classifyIssue, countAttention, planProjectCard } from './lib/board-rules.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, 'board.config.json'), 'utf8'));
const portfolio = JSON.parse(readFileSync(resolve(here, '../../public/config/private.json'), 'utf8')).portfolio;
const dryRun = process.argv.includes('--dry-run');
const FEISHU_CLI = process.env.FEISHU_CLI || '/root/go/bin/feishu-cli';

function run(file, args) {
  return execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90_000 });
}
const gh = (args) => JSON.parse(run('gh', args));
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const { owner } = config;
const number = String(config.projectNumber);
const projectId = gh(['project', 'view', number, '--owner', owner, '--format', 'json']).id;
const fields = Object.fromEntries(
  gh(['project', 'field-list', number, '--owner', owner, '--format', 'json']).fields.map((field) => [field.name, field])
);

function optionId(field, name) {
  const option = fields[field]?.options?.find((candidate) => candidate.name === name);
  if (!option) throw new Error(`字段 ${field} 没有选项 ${name}`);
  return option.id;
}

async function setField(itemId, field, value) {
  if (dryRun) return console.log(`  [dry-run] ${field} = ${value}`);
  run('gh', ['project', 'item-edit', '--id', itemId, '--project-id', projectId, '--field-id', fields[field].id,
    '--single-select-option-id', optionId(field, value)]);
  return sleep(600);
}

// 1) 飞书（只读）
const feishu = JSON.parse(run(FEISHU_CLI, ['bitable', 'record', 'list', '--base-token', portfolio.baseToken,
  '--table-id', portfolio.tableId, '--field-id', '项目ID', '--field-id', '生命周期', '--field-id', '优先级']));
const first = (value) => (Array.isArray(value) ? value[0] : value);
const projects = new Map(feishu.data.map((row) => [row[0], { lifecycle: first(row[1]), priority: first(row[2]) }]));

// 2) 看板现有条目
let items = gh(['project', 'item-list', number, '--owner', owner, '--limit', '200', '--format', 'json']).items;
const known = new Set(items.map((item) => item.content?.url).filter(Boolean));

// 3) open issue：新的加入看板（先于项目卡片更新，这样下面的待办统计包含它们）
const issuesByProject = {};
let added = 0;
for (const repo of config.repos) {
  const project = config.projectNames[repo.toLowerCase()] ?? repo;
  const open = gh(['issue', 'list', '-R', `${owner}/${repo}`, '--state', 'open', '--limit', '50', '--json', 'number,title,labels,url']);
  issuesByProject[project] = [];
  for (const issue of open) {
    if (config.ignoreIssues.includes(`${repo}#${issue.number}`)) continue;
    const kind = classifyIssue(issue, config.riskKeywords);
    issuesByProject[project].push({ kind });
    if (known.has(issue.url)) continue;
    console.log(`+ ${repo}#${issue.number} ${kind}  ${issue.title.slice(0, 50)}`);
    if (!dryRun) {
      const item = gh(['project', 'item-add', number, '--owner', owner, '--url', issue.url, '--format', 'json']);
      await setField(item.id, 'Project', project);
      await setField(item.id, 'Kind', kind);
      await setField(item.id, 'Status', 'Todo');
    }
    added += 1;
  }
}
console.log(`新增 issue：${added}${dryRun ? '（dry-run，未写入）' : ''}`);

// 4) 项目卡片：生命周期与优先级取自飞书，Status 由待办数推导
const attention = countAttention(issuesByProject);
if (!dryRun && added > 0) {
  items = gh(['project', 'item-list', number, '--owner', owner, '--limit', '200', '--format', 'json']).items;
}
let changed = 0;
for (const [feishuId, data] of projects) {
  const name = config.projectNames[feishuId];
  const card = items.find((item) => item.kind === '项目' && item.project === name);
  if (!card) { console.log(`! 没有找到 ${name} 的项目卡片`); continue; }
  const plan = planProjectCard({ name, ...data }, attention[name]);
  for (const [field, value] of Object.entries(plan)) {
    if (card[field.toLowerCase()] === value) continue; // 未变化不写
    console.log(`~ ${name}: ${field} ${card[field.toLowerCase()] ?? '∅'} -> ${value}`);
    await setField(card.id, field, value);
    changed += 1;
  }
}
console.log(`项目卡片：${projects.size} 张，字段变更 ${changed} 处`);
