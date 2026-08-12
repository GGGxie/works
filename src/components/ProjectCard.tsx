import { Globe, Github, Code2 } from 'lucide-react';
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

  const codeSnippet = `// ${project.name.split(' ')[0]}
const stack = [
  "${project.tags[0] || 'Code'}",
  "${project.tags[1] || 'Build'}",
  "${project.tags[2] || 'Ship'}"
];`;

  const hasLinks = Boolean(project.links.demo || project.links.github);

  return (
    <article className="project-card">
      <div className="project-image-container">
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
        {hasLinks && (
          <div className="project-overlay">
            <div className="project-links">
              {project.links.demo && (
                <a
                  href={project.links.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-link"
                  title={t('projectCard.viewDemo')}
                >
                  <Globe size={20} />
                </a>
              )}
              {project.links.github && (
                <a
                  href={project.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-link"
                  title={t('projectCard.viewCode')}
                >
                  <Github size={20} />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="project-info">
        <div className="project-header">
          <h3 className="project-title">{displayName}</h3>
          <div className="project-meta">
            {project.status === 'wip' && (
              <span className="project-status">{t('projectCard.wip')}</span>
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
      </div>
    </article>
  );
}
