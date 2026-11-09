import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyIssue,
  countAttention,
  planProjectCard,
  statusForProject,
} from '../scripts/board/lib/board-rules.mjs';

const KEYWORDS = ['security', '安全', '密钥', '泄露', '风险'];

test('a project with open attention issues is Todo regardless of lifecycle', () => {
  for (const lifecycle of ['运行中', '开发中', '暂停', '归档']) {
    assert.equal(statusForProject({ lifecycle, openAttentionIssues: 1 }), 'Todo', lifecycle);
  }
});

test('a project being developed with nothing pending is In Progress', () => {
  assert.equal(statusForProject({ lifecycle: '开发中', openAttentionIssues: 0 }), 'In Progress');
});

test('stable, paused or archived projects with nothing pending are Done', () => {
  for (const lifecycle of ['运行中', '暂停', '归档']) {
    assert.equal(statusForProject({ lifecycle, openAttentionIssues: 0 }), 'Done', lifecycle);
  }
});

test('planProjectCard mirrors Feishu fields and derives Status', () => {
  const plan = planProjectCard({ name: 'HAP', lifecycle: '暂停', priority: 'P2' }, { openAttentionIssues: 1 });
  assert.deepEqual(plan, { Project: 'HAP', Kind: '项目', Lifecycle: '暂停', Priority: 'P2', Status: 'Todo' });
});

test('planProjectCard skips fields Feishu has not set', () => {
  const plan = planProjectCard({ name: 'works', lifecycle: '开发中', priority: undefined });
  assert.equal('Priority' in plan, false);
  assert.equal(plan.Status, 'In Progress');
});

test('classifyIssue marks security-flavoured issues as risks, others as tasks', () => {
  assert.equal(classifyIssue({ title: 'security: 疑似密钥泄露需要轮换' }, KEYWORDS), '风险');
  assert.equal(classifyIssue({ title: '安全加固：线上放开所有用户' }, KEYWORDS), '风险');
  assert.equal(classifyIssue({ title: 'release: 发布到生产' }, KEYWORDS), '任务');
  assert.equal(classifyIssue({ title: 'chore: update docs', labels: [{ name: 'Security' }] }, KEYWORDS), '风险');
});

test('classifyIssue is case-insensitive and tolerates missing labels', () => {
  assert.equal(classifyIssue({ title: 'SECURITY audit' }, KEYWORDS), '风险');
  assert.equal(classifyIssue({ title: 'feature', labels: undefined }, KEYWORDS), '任务');
});

test('countAttention counts risks and tasks but not project cards', () => {
  const counts = countAttention({
    HAP: [{ kind: '任务' }, { kind: '项目' }],
    works: [{ kind: '项目' }],
    crazyA: [{ kind: '风险' }, { kind: '任务' }],
  });
  assert.deepEqual(counts, {
    HAP: { openAttentionIssues: 1 },
    works: { openAttentionIssues: 0 },
    crazyA: { openAttentionIssues: 2 },
  });
});
