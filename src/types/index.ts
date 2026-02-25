// 项目链接类型
export interface ProjectLinks {
  github?: string;
  demo?: string;
  docs?: string;
  npm?: string;
}

// 项目类型
export interface Project {
  id: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  longDescription?: string;
  tags: string[];
  image?: string;
  links: ProjectLinks;
  featured: boolean;
  date: string;
  status?: 'active' | 'archived' | 'wip';
}

// 社交链接类型
export interface SocialLinks {
  github?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
  wechat?: string;
  website?: string;
}

// 个人资料类型
export interface Profile {
  name: string;
  title: string;
  title_en?: string;
  bio: string;
  bio_en?: string;
  avatar?: string;
  social: SocialLinks;
}

// 完整配置类型
export interface Config {
  profile: Profile;
  projects: Project[];
}
