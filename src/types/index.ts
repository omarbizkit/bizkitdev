export interface Project {
  id: string;
  name: string;
  description_short: string;
  description_long: string;
  status: 'idea' | 'development' | 'live' | 'archived';
  tech_stack: string[];
  subdomain_url: string;
  github_url: string;
  screenshot_url: string;
  created_date: string;
  featured: boolean;
}

export interface Skill {
  id: string
  name: string
  category: 'frontend' | 'backend' | 'tools' | 'languages'
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  icon?: string
}

export interface Experience {
  id: string
  company: string
  position: string
  description: string
  startDate: Date
  endDate?: Date
  technologies: string[]
  current: boolean
}

export interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

export interface NewsletterSubscription {
  email: string
  subscribed: boolean
  confirmedAt?: Date
}

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  slug: string
  tags: string[]
  publishedAt: Date
  updatedAt: Date
  featured: boolean
  readingTime: number
}

export interface SocialLink {
  platform: string
  url: string
  icon: string
  username?: string
}

export interface SiteConfig {
  title: string
  description: string
  author: string
  email: string
  url: string
  socialLinks: SocialLink[]
  navigation: NavigationItem[]
}

export interface NavigationItem {
  name: string
  href: string
  external?: boolean
}

export interface SEOMeta {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
}

export interface PageProps {
  title?: string
  description?: string
  image?: string
}