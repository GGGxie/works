import { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  FolderGit2,
  Github,
  LayoutDashboard,
  RefreshCw,
  Server,
  Terminal,
  TriangleAlert,
} from 'lucide-react';
import type { HealthReport, PrivateConfig, ProjectInventoryItem, ServiceProbe } from '../types';
import { readLabKey } from '../hooks/useLabAccess';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import './Lab.css';

function withKey(url: string, key: string) {
  return key ? `${url}?k=${encodeURIComponent(key)}` : url;
}

function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

function Probe({ label, probe }: { label: string; probe: ServiceProbe }) {
  return (
    <span className={`probe ${probe.ok ? 'probe-up' : 'probe-down'}`}>
      <span className="probe-dot" />
      {label}
      <span className="probe-detail">
        {probe.ok ? `${probe.status} · ${probe.ms}ms` : probe.error || probe.status || 'fail'}
      </span>
    </span>
  );
}

const classificationLabels: Record<ProjectInventoryItem['classification'], string> = {
  matched: '已匹配',
  'local-only': '仅本地',
  'github-only': '仅 GitHub',
  unclassified: '待分类',
};

function lifecycleLabel(lifecycle: string) {
  if (lifecycle === 'active') return '运行中';
  if (lifecycle === 'wip') return '开发中';
  if (lifecycle === 'archived') return '已归档';
  if (lifecycle === 'unclassified') return '待分类';
  return '待确认';
}

function demoHostname(project: ProjectInventoryItem) {
  if (!project.works.demoUrl) return undefined;
  try {
    return new URL(project.works.demoUrl).hostname;
  } catch {
    return undefined;
  }
}

export function Lab() {
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [priv, setPriv] = useState<PrivateConfig | null>(null);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useDocumentMeta({ title: '服务面板 - GGGxie' });

  const load = useCallback(async () => {
    setLoading(true);
    const key = readLabKey();
    try {
      const res = await fetch(withKey('/config/health.json', key), { cache: 'no-store' });
      if (!res.ok) throw new Error(String(res.status));
      setHealth(await res.json());
      setDenied(false);
    } catch {
      setDenied(true);
    } finally {
      setLoading(false);
    }

    try {
      const res = await fetch(withKey('/config/private.json', key), { cache: 'no-store' });
      if (res.ok) setPriv(await res.json());
    } catch {
      setPriv(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (denied) {
    return (
      <div className="page lab-page">
        <div className="container lab-container">
          <p className="lab-denied">
            服务面板仅本机可见。从外网访问需要在地址后带上 <code>?k=&lt;key&gt;</code>。
          </p>
        </div>
      </div>
    );
  }

  const notes = priv?.notes ?? {};
  const projects = priv?.projects ?? [];
  const healthyHostnames = new Set(
    health?.services
      .filter((service) => service.local.ok && service.public.ok)
      .map((service) => service.hostname) ?? [],
  );
  const runningProjects = projects.filter((project) => {
    const hostname = demoHostname(project);
    if (hostname && healthyHostnames.has(hostname)) return true;
    return health?.services.some((service) => {
      const notePath = notes[service.hostname]?.path;
      return service.local.ok && service.public.ok && notePath?.startsWith(project.path);
    });
  }).length;
  const summary = priv?.inventory ?? {
    generatedAt: '',
    total: projects.length,
    githubMatched: projects.filter((project) => project.github).length,
    public: projects.filter((project) => project.works.public).length,
    unclassified: projects.filter((project) => project.classification === 'unclassified').length,
  };

  return (
    <div className="page lab-page">
      <div className="container lab-container">
        <div className="lab-header">
          <div>
            <p className="lab-eyebrow">Private workspace</p>
            <h1 className="lab-title">项目控制台</h1>
          </div>
          <div className="lab-header-meta">
            {health && (
              <span className="lab-checked">
                {health.services.length} 个服务 · {relativeTime(health.checkedAt)}探测
              </span>
            )}
            <button className="lab-refresh" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              刷新
            </button>
          </div>
        </div>

        {(priv?.portfolio?.feishuUrl || priv?.portfolio?.githubProjectUrl || priv?.portfolio?.githubIssueUrl) && (
          <div className="lab-hubs" aria-label="项目管理入口">
            <div className="lab-hubs-copy">
              <LayoutDashboard size={18} />
              <div>
                <strong>组合管理入口</strong>
                <span>飞书管项目状态，GitHub 管研发工作，works 负责只读汇总。</span>
              </div>
            </div>
            <div className="lab-hub-links">
              {priv.portfolio.feishuUrl && (
                <a href={priv.portfolio.feishuUrl} target="_blank" rel="noopener noreferrer">
                  飞书总览 <ArrowUpRight size={14} />
                </a>
              )}
              {priv.portfolio.githubProjectUrl && (
                <a href={priv.portfolio.githubProjectUrl} target="_blank" rel="noopener noreferrer">
                  GitHub Project <ArrowUpRight size={14} />
                </a>
              )}
              {priv.portfolio.githubIssueUrl && (
                <a href={priv.portfolio.githubIssueUrl} target="_blank" rel="noopener noreferrer">
                  GitHub 协调 <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <>
            <div className="lab-summary" aria-label="项目汇总">
              {[
                ['发现项目', summary.total],
                ['GitHub 匹配', summary.githubMatched],
                ['works 展示', summary.public],
                ['运行正常', runningProjects],
                ['待分类', summary.unclassified],
              ].map(([label, value]) => (
                <div key={label} className="lab-summary-item">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <section className="lab-section lab-project-section">
              <div className="lab-section-heading">
                <h2 className="lab-section-title">
                  <FolderGit2 size={13} /> 项目对账
                </h2>
                {summary.generatedAt && <span>{relativeTime(summary.generatedAt)}同步</span>}
              </div>
              <div className="lab-projects">
                {projects.map((project) => (
                  <article key={project.id} className="lab-project">
                    <div className="lab-project-main">
                      <div className="lab-project-title-row">
                        <h3>{project.name}</h3>
                        <span className={`lab-badge lab-badge-${project.classification}`}>
                          {classificationLabels[project.classification]}
                        </span>
                        <span className="lab-badge">{lifecycleLabel(project.lifecycle)}</span>
                      </div>
                      <p className="lab-project-path">{project.path}</p>
                      {project.stacks.length > 0 && (
                        <p className="lab-project-stack">{project.stacks.join(' · ')}</p>
                      )}
                    </div>
                    <div className="lab-project-side">
                      <div className="lab-project-git">
                        {project.git.isRepository ? (
                          <>
                            <span>{project.git.branch ?? 'detached'}</span>
                            <span className={project.git.clean ? 'git-clean' : 'git-dirty'}>
                              {project.git.clean ? '干净' : '有修改'}
                            </span>
                          </>
                        ) : (
                          <span>未初始化 Git</span>
                        )}
                      </div>
                      <div className="lab-project-links">
                        {project.github && (
                          <a href={project.github.url} target="_blank" rel="noopener noreferrer">
                            <Github size={13} /> 仓库
                          </a>
                        )}
                        {project.works.demoUrl && (
                          <a href={project.works.demoUrl} target="_blank" rel="noopener noreferrer">
                            <ArrowUpRight size={13} /> 线上
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        <section className="lab-section">
          <div className="lab-section-heading">
            <h2 className="lab-section-title">
              <Server size={13} /> 服务探测
            </h2>
            {health && <span>{health.services.length} 个入口</span>}
          </div>

          <div className="lab-services">
          {health?.services.map((service) => {
            const note = notes[service.hostname];
            return (
              <div key={service.hostname} className="lab-service">
                <div className="lab-service-main">
                  <a
                    className="lab-service-host"
                    href={`https://${service.hostname}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {service.hostname}
                    <ArrowUpRight size={14} />
                  </a>
                  <p className="lab-service-meta">
                    {[note?.project, note?.runtime || service.target, note?.path]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {note?.repo && <p className="lab-service-sub">{note.repo}</p>}
                  {note?.note && <p className="lab-service-sub">{note.note}</p>}
                </div>
                <div className="lab-service-status">
                  <Probe label="公网" probe={service.public} />
                  <Probe label="本地" probe={service.local} />
                  <a
                    className="lab-service-local"
                    href={service.target}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {service.target.replace('http://', '')}
                  </a>
                </div>
              </div>
            );
          })}
          </div>
        </section>

        {summary.ignored && summary.ignored.length > 0 && (
          <section className="lab-section lab-ignored">
            <h2 className="lab-section-title">
              <TriangleAlert size={13} /> 已忽略项目根目录项
            </h2>
            <p>{summary.ignored.map((item) => `${item.name}（${item.reason}）`).join('、')}</p>
          </section>
        )}

        {priv?.offline && priv.offline.length > 0 && (
          <section className="lab-section">
            <h2 className="lab-section-title">未对外服务的项目</h2>
            <div className="lab-offline">
              {priv.offline.map((item) => (
                <div key={item.project} className="lab-offline-item">
                  <span className="lab-offline-name">{item.project}</span>
                  <span className="lab-offline-note">
                    {[item.path, item.note].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {priv?.ops && priv.ops.length > 0 && (
          <section className="lab-section">
            <h2 className="lab-section-title">
              <Terminal size={13} /> 运维备忘
            </h2>
            <div className="lab-ops">
              {priv.ops.map((item) => (
                <div key={item.name} className="lab-ops-item">
                  <span className="lab-ops-name">{item.name}</span>
                  <code className="lab-ops-value">{item.value}</code>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
