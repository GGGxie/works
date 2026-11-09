import { useState } from 'react';
import { Github, Mail, MessageCircle, Briefcase, Code2, Database, Cloud, Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WechatQRModal } from '../components';
import type { Profile } from '../types';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import './About.css';

interface AboutProps {
  profile: Profile;
}

export function About({ profile }: AboutProps) {
  const [showWechat, setShowWechat] = useState(false);
  const { t, i18n } = useTranslation();
  const isEn = i18n.language === 'en';
  const avatarSrc = profile.avatar ? `${profile.avatar}?v=2` : undefined;

  const displayTitle = isEn ? (profile.title_en || profile.title) : profile.title;
  const displayBio = isEn ? (profile.bio_en || profile.bio) : profile.bio;

  useDocumentMeta({ title: t('meta.aboutTitle'), description: displayBio });

  return (
    <div className="page about-page">
      <div className="about-hero container">
        <div className="about-hero-content">
          {avatarSrc && (
            <img src={avatarSrc} alt={profile.name} className="about-avatar" />
          )}
          <div className="about-intro">
            <h1 className="about-name">{profile.name}</h1>
            <p className="about-title">
              <Briefcase size={16} />
              {displayTitle}
            </p>
            <p className="about-bio">{displayBio}</p>
            <div className="about-social">
              {profile.social.github && (
                <a
                  href={profile.social.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-chip"
                >
                  <Github size={16} />
                  <span>GitHub</span>
                </a>
              )}
              {profile.social.email && (
                <a href={`mailto:${profile.social.email}`} className="social-chip">
                  <Mail size={16} />
                  <span>Email</span>
                </a>
              )}
              {profile.social.wechat && (
                <button className="social-chip social-chip-btn" onClick={() => setShowWechat(true)}>
                  <MessageCircle size={16} />
                  <span>{t('about.wechat')}: {profile.social.wechat}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="about-body container">
        <section className="about-section">
          <h2 className="section-title">{t('about.skills')}</h2>
          <div className="skills-grid">
            <div className="skill-card">
              <div className="skill-card-header">
                <Code2 size={18} />
                <h3>{t('about.backend')}</h3>
              </div>
              <div className="skill-tags">
                <span className="skill-tag">Go</span>
                <span className="skill-tag">Python</span>
                <span className="skill-tag">FastAPI</span>
                <span className="skill-tag">Gin</span>
                <span className="skill-tag">LangGraph</span>
                <span className="skill-tag">MCP</span>
              </div>
            </div>
            <div className="skill-card">
              <div className="skill-card-header">
                <Layout size={18} />
                <h3>{t('about.frontend')}</h3>
              </div>
              <div className="skill-tags">
                <span className="skill-tag">React</span>
                <span className="skill-tag">TypeScript</span>
                <span className="skill-tag">Vite</span>
                <span className="skill-tag">TailwindCSS</span>
              </div>
            </div>
            <div className="skill-card">
              <div className="skill-card-header">
                <Database size={18} />
                <h3>{t('about.database')}</h3>
              </div>
              <div className="skill-tags">
                <span className="skill-tag">PostgreSQL</span>
                <span className="skill-tag">MySQL</span>
                <span className="skill-tag">SQLite</span>
                <span className="skill-tag">Redis</span>
              </div>
            </div>
            <div className="skill-card">
              <div className="skill-card-header">
                <Cloud size={18} />
                <h3>{t('about.devops')}</h3>
              </div>
              <div className="skill-tags">
                <span className="skill-tag">Docker</span>
                <span className="skill-tag">Nginx</span>
                <span className="skill-tag">Cloudflare</span>
                <span className="skill-tag">Linux</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {showWechat && profile.social.wechat && (
        <WechatQRModal
          wechatId={profile.social.wechat}
          onClose={() => setShowWechat(false)}
        />
      )}
    </div>
  );
}
