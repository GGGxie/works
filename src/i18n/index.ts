import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

// 预渲染时没有 localStorage，统一按中文出静态 HTML
const savedLang =
  typeof localStorage === 'undefined' ? 'zh' : localStorage.getItem('lang') || 'zh';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: zh },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'zh',
    interpolation: { escapeValue: false },
  });

export default i18n;
