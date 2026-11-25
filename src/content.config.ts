import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const knowledgeSchema = z.object({
  title: z.string(),
  description: z.string(),
  slug: z.string().optional(),
  category: z.string(),
  brand: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  device: z.string().optional().nullable(),
  primaryKeyword: z.string(),
  secondaryKeywords: z.array(z.string()).default([]),
  searchIntent: z.string(),
  keywordOwnerDomain: z.string().default('tizidaquan.blog'),
  publishDate: z.string(),
  updatedDate: z.string(),
  documentedVersion: z.string().optional().nullable(),
  author: z.string().default('梯子大全编辑部'),
  tags: z.array(z.string()).default([]),
  relatedBrands: z.array(z.string()).default([]),
  relatedArticles: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  faqs: z
    .array(
      z.object({
        q: z.string(),
        a: z.string(),
      })
    )
    .default([]),
  howToSteps: z
    .array(
      z.object({
        name: z.string(),
        text: z.string(),
      })
    )
    .default([]),
  draft: z.boolean().default(false),
  indexable: z.boolean().default(true),
});

export const collections = {
  brands: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/brands' }),
    schema: knowledgeSchema,
  }),
  devices: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/devices' }),
    schema: knowledgeSchema,
  }),
  ai: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/ai' }),
    schema: knowledgeSchema,
  }),
  streaming: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/streaming' }),
    schema: knowledgeSchema,
  }),
  beginners: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/beginners' }),
    schema: knowledgeSchema,
  }),
  safety: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/safety' }),
    schema: knowledgeSchema,
  }),
  troubleshooting: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/troubleshooting' }),
    schema: knowledgeSchema,
  }),
  articles: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
    schema: knowledgeSchema,
  }),
};
