import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, Github, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Config } from '../types';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import './ProjectDetail.css';

interface ProjectDetailProps {
  config: Config;
}

export function ProjectDetail({ config }: ProjectDetailProps) {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const ordered = useMemo(
    () => [...config.projects].sort((a, b) => b.date.localeCompare(a.date)),
    [config.projects]
  );

  const index = ordered.findIndex((p) => p.id === id);
  const project = index >= 0 ? ordered[index] : undefined;
  const prev = index > 0 ? ordered[index - 1] : undefined;
  const next = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : undefined;

  const displayName = project
    ? (isEn ? project.name_en || project.name : project.name)
    : t('detail.notFound');
  const displayDesc = project
    ? (isEn ? project.description_en || project.description : project.description)
    : '';

  useDocumentMeta({
    title: `${displayName} - ${config.profile.name}`,
    description: displayDesc,
  });

  if (!project) {
    return (
      <div className="page detail-page">
        <div className="container detail-container">
          <p className="detail-missing">{t('detail.notFound')}</p>
          <Link to="/" className="detail-back">
            <ArrowLeft size={16} />
            {t('detail.back')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page detail-page">
      <article className="container detail-container">
        <Link to="/" className="detail-back">
          <ArrowLeft size={16} />
          {t('detail.back')}
        </Link>

        <header className="detail-header">
          <div className="detail-title-row">
            <h1 className="detail-title">{displayName}</h1>
            {project.status === 'wip' && (
              <span className="detail-status">{t('projectCard.wip')}</span>
            )}
          </div>
          <p className="detail-date">{project.date}</p>
          <p className="detail-summary">{displayDesc}</p>
          {(project.links.demo || project.links.github) && (
            <div className="detail-actions">
              {project.links.demo && (
                <a
                  className="btn btn-primary"
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe size={16} />
                  {t('detail.demo')}
                  <ArrowUpRight size={14} />
                </a>
              )}
              {project.links.github && (
                <a
                  className="btn btn-outline"
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github size={16} />
                  {t('detail.source')}
                  <ArrowUpRight size={14} />
                </a>
              )}
            </div>
          )}
        </header>

        {project.image && (
          <img src={project.image} alt={displayName} className="detail-image" />
        )}

        {project.longDescription && (
          <section className="detail-section">
            <h2 className="detail-section-title">{t('detail.about')}</h2>
            <p className="detail-body">{project.longDescription}</p>
          </section>
        )}

        <section className="detail-section">
          <h2 className="detail-section-title">{t('detail.stack')}</h2>
          <div className="detail-tags">
            {project.tags.map((tag) => (
              <span key={tag} className="detail-tag">
                {tag}
              </span>
            ))}
          </div>
        </section>

        {(prev || next) && (
          <nav className="detail-nav">
            {prev ? (
              <Link to={`/projects/${prev.id}`} className="detail-nav-link">
                <ArrowLeft size={14} />
                <span>
                  <span className="detail-nav-label">{t('detail.prev')}</span>
                  {isEn ? prev.name_en || prev.name : prev.name}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`/projects/${next.id}`} className="detail-nav-link detail-nav-next">
                <span>
                  <span className="detail-nav-label">{t('detail.next')}</span>
                  {isEn ? next.name_en || next.name : next.name}
                </span>
                <ArrowRight size={14} />
              </Link>
            )}
          </nav>
        )}
      </article>
    </div>
  );
}
