import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  githubFullNameFromUrl,
  isEmptyDirectory,
  mergePrivateConfig,
  reconcileProjects,
  validateInventory,
} from './lib/project-inventory.mjs';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const defaultProjectsRoot = resolve(repositoryRoot, '..');
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const rootIndex = args.indexOf('--root');
const projectsRoot = rootIndex >= 0 ? resolve(args[rootIndex + 1]) : defaultProjectsRoot;
const publicConfigPath = join(repositoryRoot, 'public/config/projects.json');
const privateConfigPath = join(repositoryRoot, 'public/config/private.json');

if (rootIndex >= 0 && !args[rootIndex + 1]) {
  throw new Error('--root requires a directory path');
}

function readJson(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

function runGit(path, parameters) {
  try {
    return execFileSync('git', ['-C', path, ...parameters], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return undefined;
  }
}

function inspectGit(path) {
  const isRepository = runGit(path, ['rev-parse', '--is-inside-work-tree']) === 'true';
  if (!isRepository) return { isRepository: false };

  const status = runGit(path, ['status', '--porcelain']);
  return {
    isRepository: true,
    branch: runGit(path, ['branch', '--show-current']) || 'detached',
    clean: status === '',
    remoteUrl: runGit(path, ['remote', 'get-url', 'origin']),
    lastCommitAt: runGit(path, ['log', '-1', '--format=%cI']),
  };
}

const manifestStacks = new Map([
  ['package.json', 'Node.js'],
  ['go.mod', 'Go'],
  ['pyproject.toml', 'Python'],
  ['requirements.txt', 'Python'],
  ['Cargo.toml', 'Rust'],
  ['docker-compose.yml', 'Docker'],
  ['docker-compose.yaml', 'Docker'],
  ['compose.yml', 'Docker'],
  ['compose.yaml', 'Docker'],
]);
const skippedDirectories = new Set(['.git', 'node_modules', 'dist', 'build', '.venv', 'venv', 'vendor']);

function detectStacks(path, depth = 0) {
  const stacks = new Set();
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const stack = manifestStacks.get(entry.name);
    if (entry.isFile() && stack) stacks.add(stack);
    if (entry.isDirectory() && depth < 1 && !skippedDirectories.has(entry.name) && !entry.name.startsWith('.')) {
      for (const nestedStack of detectStacks(join(path, entry.name), depth + 1)) stacks.add(nestedStack);
    }
  }
  return [...stacks].sort((left, right) => left.localeCompare(right));
}

function discoverLocalProjects(root) {
  const projects = [];
  const ignored = [];
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) {
      ignored.push({ name: entry.name, reason: 'not-a-directory' });
      continue;
    }
    if (entry.name.startsWith('.')) {
      ignored.push({ name: entry.name, reason: 'hidden-directory' });
      continue;
    }
    const path = join(root, entry.name);
    if (isEmptyDirectory(readdirSync(path))) {
      ignored.push({ name: entry.name, reason: 'empty-directory' });
      continue;
    }
    projects.push({
      directoryName: entry.name,
      path,
      git: inspectGit(path),
      stacks: detectStacks(path),
    });
  }
  return { projects, ignored };
}

function inferredGithubRepositories(localProjects, worksProjects) {
  const repositories = new Map();
  for (const local of localProjects) {
    const fullName = githubFullNameFromUrl(local.git.remoteUrl);
    if (fullName) repositories.set(fullName.toLowerCase(), {
      fullName,
      name: fullName.split('/')[1],
      url: `https://github.com/${fullName}`,
    });
  }
  for (const project of worksProjects) {
    const fullName = githubFullNameFromUrl(project.links?.github);
    if (fullName && !repositories.has(fullName.toLowerCase())) repositories.set(fullName.toLowerCase(), {
      fullName,
      name: fullName.split('/')[1],
      url: project.links.github,
    });
  }
  return [...repositories.values()];
}

const publicConfig = readJson(publicConfigPath, { projects: [] });
const existingPrivateConfig = readJson(privateConfigPath, {});
const discovered = discoverLocalProjects(projectsRoot);
const githubRepositories = inferredGithubRepositories(discovered.projects, publicConfig.projects);
const projects = validateInventory(reconcileProjects({
  localProjects: discovered.projects,
  githubRepositories,
  worksProjects: publicConfig.projects,
}));
const unchanged = JSON.stringify(existingPrivateConfig.projects) === JSON.stringify(projects)
  && JSON.stringify(existingPrivateConfig.inventory?.ignored ?? []) === JSON.stringify(discovered.ignored);
const generatedAt = unchanged && existingPrivateConfig.inventory?.generatedAt
  ? existingPrivateConfig.inventory.generatedAt
  : new Date().toISOString();
const nextPrivateConfig = mergePrivateConfig(existingPrivateConfig, projects, generatedAt, discovered.ignored);
const output = `${JSON.stringify(nextPrivateConfig, null, 2)}\n`;

if (!checkOnly) writeFileSync(privateConfigPath, output);

const summary = nextPrivateConfig.inventory;
console.log([
  `Scanned ${relative(repositoryRoot, projectsRoot) || '.'}: ${summary.total} projects`,
  `${summary.githubMatched} GitHub-matched`,
  `${summary.public} public in works`,
  `${summary.unclassified} unclassified`,
  `${summary.ignored.length} ignored`,
  checkOnly ? 'check only; no file written' : `updated ${relative(repositoryRoot, privateConfigPath)}`,
].join(' · '));
