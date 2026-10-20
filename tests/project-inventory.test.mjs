import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mergePrivateConfig,
  normalizeProjectId,
  reconcileProjects,
  validateInventory,
} from '../scripts/lib/project-inventory.mjs';

test('normalizes project names into stable ids', () => {
  assert.equal(normalizeProjectId(' Writing Agent '), 'writing-agent');
  assert.equal(normalizeProjectId('mingming_agent'), 'mingming-agent');
  assert.equal(normalizeProjectId('MCPark'), 'mcpark');
});

test('reconciles local, GitHub, and works records deterministically', () => {
  const localProjects = [
    {
      directoryName: 'MCPark',
      path: '/root/Document/MCPark',
      git: { isRepository: true, remoteUrl: 'git@github.com:GGGxie/MCPark.git' },
      stacks: ['Go', 'Node.js'],
    },
    {
      directoryName: 'Voyago',
      path: '/root/Document/Voyago',
      git: { isRepository: false },
      stacks: ['Node.js'],
    },
  ];
  const githubRepositories = [
    { fullName: 'GGGxie/MCPark', name: 'MCPark', url: 'https://github.com/GGGxie/MCPark' },
  ];
  const worksProjects = [
    {
      id: 'mcpark',
      name: 'MCPark - MCP 服务收集管理平台',
      status: 'active',
      tags: ['Go', 'React'],
      links: { github: 'https://github.com/GGGxie/MCPark', demo: 'https://mcpark.example.com' },
    },
  ];

  const result = reconcileProjects({ localProjects, githubRepositories, worksProjects });

  assert.deepEqual(result.map((project) => project.id), ['mcpark', 'voyago']);
  assert.equal(result[0].classification, 'matched');
  assert.equal(result[0].github.fullName, 'GGGxie/MCPark');
  assert.equal(result[0].works.public, true);
  assert.equal(result[0].works.demoUrl, 'https://mcpark.example.com');
  assert.deepEqual(result[0].stacks, ['Go', 'Node.js', 'React']);
  assert.equal(result[1].classification, 'local-only');
});

test('keeps uncertain local folders unclassified', () => {
  const [project] = reconcileProjects({
    localProjects: [
      {
        directoryName: 'scratch space',
        path: '/root/Document/scratch space',
        git: { isRepository: false },
        stacks: [],
      },
    ],
    githubRepositories: [],
    worksProjects: [],
  });

  assert.equal(project.id, 'scratch-space');
  assert.equal(project.classification, 'unclassified');
  assert.equal(project.lifecycle, 'unclassified');
});

test('rejects duplicate normalized project ids', () => {
  assert.throws(
    () => validateInventory([
      { id: 'writing-agent', name: 'Writing Agent', path: '/a' },
      { id: 'writing-agent', name: 'writing_agent', path: '/b' },
    ]),
    /Duplicate project id: writing-agent/,
  );
});

test('replaces generated inventory while preserving manual private keys', () => {
  const existing = {
    notes: { example: { project: 'Example' } },
    offline: [{ project: 'Voyago' }],
    ops: [{ name: 'Tunnel', value: '/etc/example' }],
    portfolio: { feishuUrl: 'https://example.feishu.cn/base/abc' },
    projects: [{ id: 'old' }],
  };
  const projects = [{ id: 'new', name: 'New', path: '/root/Document/New' }];

  const merged = mergePrivateConfig(existing, projects, '2026-10-20T00:00:00.000Z');

  assert.deepEqual(merged.notes, existing.notes);
  assert.deepEqual(merged.offline, existing.offline);
  assert.deepEqual(merged.ops, existing.ops);
  assert.deepEqual(merged.portfolio, existing.portfolio);
  assert.deepEqual(merged.projects, projects);
  assert.equal(merged.inventory.generatedAt, '2026-10-20T00:00:00.000Z');
  assert.equal(merged.inventory.total, 1);
});
