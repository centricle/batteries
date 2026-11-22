import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Long-form reference articles (Markdown). Every article carries its sources.
const reference = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reference' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
    order: z.number().optional(),
    related: z.array(z.union([z.string(), z.number()]).transform(String)).optional(),
    sources: z
      .array(
        z.object({
          title: z.string(),
          publisher: z.string(),
          url: z.string().url().optional(),
          accessed: z.coerce.date().optional(),
        }),
      )
      .min(1),
  }),
});

export const collections = { reference };
