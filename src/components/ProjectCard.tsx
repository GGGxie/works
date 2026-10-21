import { Link } from 'react-router-dom';
import { ArrowUpRight, Code2, Github, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Project } from '../types';
import './ProjectCard.css';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const displayName = isEn ? (project.name_en || project.name) : project.name;
  const displayDesc = isEn ? (project.description_en || project.description) : project.description;
  const detailPath = `/projects/${project.id}`;

  const codeSnippet = `// ${project.name.split(' ')[0]}
const stack = [
  "${project.tags[0] || 'Code'}",
  "${project.tags[1] || 'Build'}",
  "${project.tags[2] || 'Ship'}"
];`;

  return (
    <article className="project-card">
      <Link to={detailPath} className="project-image-container" aria-label={displayName}>
        {project.image ? (
          <img src={project.image} alt={displayName} className="project-image" />
        ) : (
          <div className="project-placeholder">
            <div className="placeholder-content">
              <Code2 size={32} strokeWidth={1.5} />
              <pre className="placeholder-code">{codeSnippet}</pre>
            </div>
          </div>
        )}
        <div className="project-overlay">
          <span className="project-overlay-cta">
            {t('projectCard.viewDetail')}
            <ArrowUpRight size={16} />
          </span>
        </div>
      </Link>

      <div className="project-info">
        <div className="project-header">
          <h3 className="project-title">
            <Link to={detailPath}>{displayName}</Link>
          </h3>
          <div className="project-meta">
            {project.status && project.status !== 'active' && (
              <span className="project-status">{t(`projectCard.${project.status}`)}</span>
            )}
            <span className="project-year">{project.date.split('-')[0]}</span>
          </div>
        </div>
        <p className="project-description">{displayDesc}</p>
        <div className="project-tags">
          {project.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        {(project.links.demo || project.links.github) && (
          <div className="project-actions">
            {project.links.demo && (
              <a
                className="project-action"
                href={project.links.demo}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Globe size={14} />
                {t('projectCard.viewDemo')}
                <ArrowUpRight size={12} />
              </a>
            )}
            {project.links.github && (
              <a
                className="project-action"
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github size={14} />
                {t('projectCard.viewCode')}
                <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
