import type { SEOMeta } from '../types'
import { defaultSEO } from '../config/site'

export function generateSEOMeta(overrides: Partial<SEOMeta> = {}): SEOMeta {
  return {
    ...defaultSEO,
    ...overrides
  }
}

export function generatePageTitle(title?: string): string {
  if (!title) return defaultSEO.title
  return `${title} | ${defaultSEO.title.split(' - ')[0]}`
}

export function generateCanonicalURL(path: string): string {
  const baseURL = defaultSEO.url
  return `${baseURL}${path === '/' ? '' : path}`
}

export function generateOpenGraphTags(meta: SEOMeta) {
  return {
    'og:title': meta.title,
    'og:description': meta.description,
    'og:image': meta.image || defaultSEO.image,
    'og:url': meta.url || defaultSEO.url,
    'og:type': meta.type || 'website',
    'og:site_name': defaultSEO.title.split(' - ')[0]
  }
}

export function generateTwitterTags(meta: SEOMeta) {
  return {
    'twitter:card': 'summary_large_image',
    'twitter:title': meta.title,
    'twitter:description': meta.description,
    'twitter:image': meta.image || defaultSEO.image,
    'twitter:creator': '@bizkitdev'
  }
}

export function generateStructuredData(meta: SEOMeta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: meta.title,
    description: meta.description,
    url: meta.url || defaultSEO.url,
    author: {
      '@type': 'Person',
      name: 'Omar Bizkitdev',
      url: defaultSEO.url
    }
  }
}