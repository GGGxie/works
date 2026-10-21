import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const projects = JSON.parse(read('public/config/projects.json')).projects;
const zh = JSON.parse(read('src/i18n/locales/zh.json'));
const en = JSON.parse(read('src/i18n/locales/en.json'));

// 从 src/types/index.ts 里读出 status 的联合类型，避免在测试里再维护一份清单
const declared = [...read('src/types/index.ts').match(/status\?: ([^;]+);/)[1].matchAll(/'([a-z]+)'/g)].map(
  (match) => match[1]
);

test('every status used in projects.json is declared in the Project type', () => {
  const used = new Set(projects.map((project) => project.status).filter(Boolean));
  const undeclared = [...used].filter((status) => !declared.includes(status));
  assert.deepEqual(undeclared, []);
});

test('every non-active status has a badge label in both languages', () => {
  const missing = [];
  for (const status of declared.filter((value) => value !== 'active')) {
    if (!zh.projectCard?.[status]) missing.push(`zh:${status}`);
    if (!en.projectCard?.[status]) missing.push(`en:${status}`);
  }
  assert.deepEqual(missing, []);
});

test('badge labels differ between statuses so they stay distinguishable', () => {
  const labels = declared.filter((value) => value !== 'active').map((status) => zh.projectCard[status]);
  assert.equal(new Set(labels).size, labels.length);
});

test('every project has an id, a name and a valid date', () => {
  for (const project of projects) {
    assert.ok(project.id && project.name, `project missing id/name: ${JSON.stringify(project.id)}`);
    assert.match(project.date, /^\d{4}-\d{2}$/, `bad date on ${project.id}`);
  }
});
