import { useState } from 'react';

const KEY_STORAGE = 'labKey';

export function isLocalHost() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

export function readLabKey() {
  const fromUrl = new URLSearchParams(window.location.search).get('k');
  if (fromUrl) {
    localStorage.setItem(KEY_STORAGE, fromUrl);
    return fromUrl;
  }
  return localStorage.getItem(KEY_STORAGE) || '';
}

// 自用入口只对本机访问或握有 key 的浏览器出现；
// 预渲染时没有 window，所以静态 HTML 里不会留下痕迹
export function useLabAccess() {
  const [visible] = useState(
    () => typeof window !== 'undefined' && (isLocalHost() || Boolean(localStorage.getItem(KEY_STORAGE)))
  );

  return visible;
}
