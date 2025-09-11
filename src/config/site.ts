import type { SiteConfig } from '../types'

export const siteConfig: SiteConfig = {
  title: 'Bizkit.dev - Omar Bizkitdev',
  description: 'Modern portfolio website showcasing full-stack development projects with a dark neon sci-fi aesthetic.',
  author: 'Omar Bizkitdev',
  email: 'omar@bizkit.dev',
  url: 'https://bizkit.dev',
  socialLinks: [
    {
      platform: 'GitHub',
      url: 'https://github.com/omarbizkitdev',
      icon: 'github',
      username: 'omarbizkitdev'
    },
    {
      platform: 'LinkedIn',
      url: 'https://linkedin.com/in/omar-bizkitdev',
      icon: 'linkedin',
      username: 'omar-bizkitdev'
    },
    {
      platform: 'Twitter',
      url: 'https://twitter.com/bizkitdev',
      icon: 'twitter',
      username: '@bizkitdev'
    },
    {
      platform: 'Discord',
      url: 'https://discord.gg/bizkitdev',
      icon: 'discord',
      username: 'bizkitdev'
    }
  ],
  navigation: [
    {
      name: 'Home',
      href: '/'
    },
    {
      name: 'About',
      href: '/about'
    },
    {
      name: 'Work',
      href: '/work'
    },
    {
      name: 'Blog',
      href: '/blog'
    },
    {
      name: 'Contact',
      href: '/contact'
    }
  ]
}

export const defaultSEO = {
  title: siteConfig.title,
  description: siteConfig.description,
  image: '/og-image.jpg',
  url: siteConfig.url,
  type: 'website' as const
}