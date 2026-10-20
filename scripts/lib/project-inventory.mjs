const GITHUB_URL_PATTERN = /github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?$/i;

export function normalizeProjectId(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function githubFullNameFromUrl(url) {
  if (!url) return undefined;
  const match = url.match(GITHUB_URL_PATTERN);
  return match ? `${match[1]}/${match[2]}` : undefined;
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function normalizedGithubName(repository) {
  return repository.fullName?.toLowerCase();
}

function publicGithubName(project) {
  return githubFullNameFromUrl(project.links?.github)?.toLowerCase();
}

export function reconcileProjects({ localProjects, githubRepositories, worksProjects }) {
  const githubByName = new Map(
    githubRepositories
      .filter((repository) => repository.fullName)
      .map((repository) => [normalizedGithubName(repository), repository]),
  );
  const worksById = new Map(worksProjects.map((project) => [normalizeProjectId(project.id), project]));
  const worksByGithub = new Map(
    worksProjects
      .filter((project) => publicGithubName(project))
      .map((project) => [publicGithubName(project), project]),
  );

  const projects = localProjects.map((local) => {
    const id = normalizeProjectId(local.directoryName);
    const remoteFullName = githubFullNameFromUrl(local.git.remoteUrl);
    const github = remoteFullName ? githubByName.get(remoteFullName.toLowerCase()) : undefined;
    const works = worksById.get(id) ?? (remoteFullName ? worksByGithub.get(remoteFullName.toLowerCase()) : undefined);
    const hasProjectSignal = local.git.isRepository || local.stacks.length > 0;
    const classification = works || github
      ? 'matched'
      : hasProjectSignal
        ? 'local-only'
        : 'unclassified';

    return {
      id,
      name: works?.name ?? local.directoryName,
      directoryName: local.directoryName,
      path: local.path,
      classification,
      lifecycle: works?.status ?? (classification === 'unclassified' ? 'unclassified' : 'unknown'),
      stacks: uniqueSorted([...(local.stacks ?? []), ...(works?.tags ?? [])]),
      git: {
        isRepository: Boolean(local.git.isRepository),
        branch: local.git.branch,
        clean: local.git.clean,
        lastCommitAt: local.git.lastCommitAt,
      },
      ...(github ? {
        github: {
          fullName: github.fullName,
          url: github.url,
          private: github.private,
        },
      } : {}),
      works: {
        public: Boolean(works),
        demoUrl: works?.links?.demo,
      },
    };
  });

  return projects.sort((left, right) => left.id.localeCompare(right.id));
}

export function validateInventory(projects) {
  const ids = new Set();
  for (const project of projects) {
    if (!project.id || !project.name || !project.path) {
      throw new Error(`Malformed project inventory record: ${JSON.stringify(project)}`);
    }
    if (ids.has(project.id)) {
      throw new Error(`Duplicate project id: ${project.id}`);
    }
    ids.add(project.id);
  }
  return projects;
}

export function mergePrivateConfig(existing, projects, generatedAt, ignored = []) {
  return {
    ...existing,
    inventory: {
      generatedAt,
      total: projects.length,
      githubMatched: projects.filter((project) => project.github).length,
      public: projects.filter((project) => project.works?.public).length,
      unclassified: projects.filter((project) => project.classification === 'unclassified').length,
      ignored,
    },
    projects,
  };
}
