export const SITE = {
  name: '梯子大全',
  enName: 'Ladder Encyclopedia',
  tagline: '极境梯子知识百科旗舰',
  domain: 'tizidaquan.blog',
  url: 'https://tizidaquan.blog',
  lang: 'zh-CN',
  author: '梯子大全编辑部',
  contactEmail: 'editorial@tizidaquan.blog',
  updatedAt: '2026-11-25',
} as const;

export const TOP_NAV = [
  { label: '首页', href: '/' },
  { label: '梯子知识', href: '/tools/' },
  { label: '设备教程', href: '/devices/' },
  { label: 'AI与流媒体', href: '/ai/' },
  { label: '新手百科', href: '/beginners/' },
  { label: '安全排障', href: '/safety/' },
  { label: '机场品牌', href: '/brands/' },
  { label: '搜索', href: '/search/' },
] as const;

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function absUrl(path: string): string {
  if (!path) return SITE.url + '/';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${normalized.endsWith('/') || normalized.includes('.') ? normalized : `${normalized}/`}`;
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: `${SITE.name} (${SITE.enName})`,
    alternateName: ['梯子大全', 'Ladder Encyclopedia', 'tizidaquan.blog'],
    url: `${SITE.url}/`,
    inLanguage: 'zh-CN',
    description:
      '梯子大全提供2026网络工具知识、Windows、Mac、iPhone、安卓及路由器使用教程，涵盖机场订阅、AI与流媒体网络问题、新手入门、安全隐私及常见连接故障排查。',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE.url}/search/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    alternateName: SITE.enName,
    url: `${SITE.url}/`,
    logo: `${SITE.url}/logo.svg`,
    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE.contactEmail,
      contactType: 'editorial support',
    },
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: absUrl(item.url),
    })),
  };
}

export function buildArticleSchema(opts: {
  title: string;
  description: string;
  url: string;
  publishDate: string;
  updatedDate: string;
  author?: string;
  section?: string;
  isBlogPosting?: boolean;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': opts.isBlogPosting ? 'BlogPosting' : 'Article',
    headline: opts.title,
    description: opts.description,
    url: absUrl(opts.url),
    mainEntityOfPage: absUrl(opts.url),
    datePublished: opts.publishDate,
    dateModified: opts.updatedDate,
    inLanguage: 'zh-CN',
    articleSection: opts.section || '网络知识百科',
    author: {
      '@type': 'Organization',
      name: opts.author || SITE.author,
      url: `${SITE.url}/about/`,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/logo.svg`,
      },
    },
  };
}

export function buildCollectionSchema(opts: {
  title: string;
  description: string;
  url: string;
  items?: Array<{ name: string; url: string }>;
}) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: opts.title,
    description: opts.description,
    url: absUrl(opts.url),
    inLanguage: 'zh-CN',
  };
  if (opts.items && opts.items.length > 0) {
    schema.mainEntity = {
      '@type': 'ItemList',
      itemListElement: opts.items.map((it, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: it.name,
        url: absUrl(it.url),
      })),
    };
  }
  return schema;
}

export function buildFaqSchema(faqs: Array<{ q: string; a: string }>) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };
}

export function buildHowToSchema(opts: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string }>;
}) {
  if (!opts.steps || opts.steps.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    step: opts.steps.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: s.name,
      text: s.text,
    })),
  };
}
