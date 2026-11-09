import { useEffect } from 'react';

interface DocumentMeta {
  title: string;
  description?: string;
}

// 预渲染负责首屏的 title/description，这里只处理客户端路由切换后的更新
export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    document.title = title;

    if (!description) return;
    let tag = document.querySelector('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('name', 'description');
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', description);
  }, [title, description]);
}
