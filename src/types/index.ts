// 项目链接类型
export interface ProjectLinks {
  github?: string;
  demo?: string;
  docs?: string;
  npm?: string;
}

// 项目类型
export interface Project {
  id: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  longDescription?: string;
  tags: string[];
  image?: string;
  links: ProjectLinks;
  featured: boolean;
  date: string;
  status?: 'active' | 'archived' | 'paused' | 'wip';
}

// 社交链接类型
export interface SocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
  wechat?: string;
  website?: string;
}

// 个人资料类型
export interface Profile {
  name: string;
  title: string;
  title_en?: string;
  bio: string;
  bio_en?: string;
  avatar?: string;
  social: SocialLinks;
}

// 完整配置类型
export interface Config {
  profile: Profile;
  projects: Project[];
}

// 以下为自用视图（/lab）的数据，来自 scripts/probe-services.mjs 与手写的 private.json
export interface ServiceProbe {
  ok: boolean;
  status: number;
  ms: number;
  error?: string;
}

export interface ServiceHealth {
  hostname: string;
  target: string;
  public: ServiceProbe;
  local: ServiceProbe;
}

export interface HealthReport {
  checkedAt: string;
  services: ServiceHealth[];
}

export interface ServiceNote {
  project: string;
  path?: string;
  runtime?: string;
  repo?: string;
  note?: string;
}

export type ProjectClassification = 'matched' | 'local-only' | 'github-only' | 'unclassified';

export interface ProjectInventoryItem {
  id: string;
  name: string;
  directoryName: string;
  path: string;
  classification: ProjectClassification;
  lifecycle: string;
  stacks: string[];
  git: {
    isRepository: boolean;
    branch?: string;
    clean?: boolean;
    lastCommitAt?: string;
  };
  github?: {
    fullName: string;
    url: string;
    private?: boolean;
  };
  works: {
    public: boolean;
    demoUrl?: string;
  };
}

export interface InventorySummary {
  generatedAt: string;
  total: number;
  githubMatched: number;
  public: number;
  unclassified: number;
  ignored?: { name: string; reason: string }[];
}

export interface PortfolioConfig {
  feishuUrl?: string;
  githubProjectUrl?: string;
  githubIssueUrl?: string;
  syncedAt?: string;
}

export interface PrivateConfig {
  notes?: Record<string, ServiceNote>;
  offline?: { project: string; path?: string; note?: string }[];
  ops?: { name: string; value: string }[];
  inventory?: InventorySummary;
  projects?: ProjectInventoryItem[];
  portfolio?: PortfolioConfig;
}

declare global {
  interface Window {
    __CONFIG__?: Config;
  }
}
