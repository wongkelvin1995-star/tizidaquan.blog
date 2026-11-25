import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../utils/site';

export async function GET() {
  const articles = await getCollection('articles', ({ data }) => !data.draft && data.indexable !== false);
  const devices = await getCollection('devices', ({ data }) => !data.draft && data.indexable !== false);

  const items = [
    ...devices.map((d) => ({
      title: d.data.title,
      description: d.data.description,
      pubDate: new Date(d.data.publishDate),
      link: `/devices/${(d.data.slug || d.id.replace(/\.md$/, '')).replace(/^\/+|\/+$/g, '')}/`,
    })),
    ...articles.slice(0, 30).map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: new Date(a.data.publishDate),
      link: `/articles/${a.id.replace(/\.md$/, '')}/`,
    })),
  ];

  return rss({
    title: `${SITE.name} (${SITE.enName})`,
    description: '2026梯子大全：设备使用教程、机场新手指南、AI与流媒体网络知识及故障排查百科。',
    site: SITE.url,
    items,
    customData: '<language>zh-CN</language>',
  });
}
