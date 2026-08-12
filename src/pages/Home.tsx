import { useState, useMemo } from 'react';
import { Github, Mail, MessageCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProjectCard, WechatQRModal } from '../components';
import type { Config } from '../types';
import './Home.css';

interface HomeProps {
  config: Config;
}

export function Home({ config }: HomeProps) {
  const { profile, projects } = config;
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showWechat, setShowWechat] = useState(false);
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';

  const displayTitle = isEn ? (profile.title_en || profile.title) : profile.title;
  const displayBio = isEn ? (profile.bio_en || profile.bio) : profile.bio;

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((p) => p.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    // 只展示多个项目共用的标签，单项目专属标签起不到筛选作用
    const shared = Array.from(counts.entries()).filter(([, count]) => count > 1);
    const pool = shared.length > 0 ? shared : Array.from(counts.entries());
    return pool
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const name = isEn ? (project.name_en || project.name) : project.name;
      const desc = isEn ? (project.description_en || project.description) : project.description;
      const matchesSearch =
        !search ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        desc.toLowerCase().includes(search.toLowerCase());
      const matchesTag = !selectedTag || project.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [projects, search, selectedTag, isEn]);

  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredProjects]);

  return (
    <div className="page home-page">
      <section className="intro container">
        <div className="intro-main">
          <h1 className="intro-name">{profile.name}</h1>
          <p className="intro-title">{displayTitle}</p>
          <p className="intro-bio">{displayBio}</p>
        </div>
        <div className="intro-links">
          {profile.social.github && (
            <a
              href={profile.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              aria-label="GitHub"
            >
              <Github size={18} />
            </a>
          )}
          {profile.social.email && (
            <a
              href={`mailto:${profile.social.email}`}
              className="social-link"
              aria-label="Email"
            >
              <Mail size={18} />
            </a>
          )}
          {profile.social.wechat && (
            <button
              className="social-link social-link-btn"
              title={`${t('about.wechat')}: ${profile.social.wechat}`}
              aria-label="WeChat"
              onClick={() => setShowWechat(true)}
            >
              <MessageCircle size={18} />
            </button>
          )}
        </div>
      </section>

      <section className="work container">
        <div className="work-header">
          <h2 className="work-title">{t('home.projects')}</h2>
          <span className="work-count">{sortedProjects.length}</span>
        </div>
        <div className="work-toolbar">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder={t('home.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tag-filters">
            <button
              className={`tag-filter ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              {t('home.allFilter')}
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-filter ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="projects-grid">
          {sortedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>

        {sortedProjects.length === 0 && (
          <div className="empty-state">
            <p>{t('home.noResults')}</p>
          </div>
        )}
      </section>

      {showWechat && profile.social.wechat && (
        <WechatQRModal
          wechatId={profile.social.wechat}
          onClose={() => setShowWechat(false)}
        />
      )}
    </div>
  );
}
