import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ThemeToggle';
import { useLabAccess } from '../hooks/useLabAccess';
import './Header.css';

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t, i18n } = useTranslation();
  const showLab = useLabAccess();

  const navLinks = [
    { path: '/', label: t('nav.work') },
    { path: '/about', label: t('nav.about') },
    ...(showLab ? [{ path: '/lab', label: t('nav.lab') }] : []),
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = () => {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="logo">
          <img src="/images/avatar.png?v=2" alt="Avatar" className="logo-avatar" />
          <span className="logo-name">GGGxie</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="divider"></div>
          <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
            {t('lang.toggle')}
          </button>
          <ThemeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className={`nav-mobile ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-mobile-content">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-mobile-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="nav-mobile-footer">
            <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
              {t('lang.toggle')}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
