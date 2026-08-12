import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, RefreshCw, Terminal } from 'lucide-react';
import type { HealthReport, PrivateConfig, ServiceProbe } from '../types';
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

  return (
    <div className="page lab-page">
      <div className="container lab-container">
        <div className="lab-header">
          <h1 className="lab-title">服务面板</h1>
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
