import { buildConfig } from 'payload/config';
import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { seoPlugin } from '@payloadcms/plugin-seo';
import path from 'path';

// Import collections
import { Posts } from './collections/Posts';
import { Pages } from './collections/Pages';
import { Authors } from './collections/Authors';
import { Categories } from './collections/Categories';
import { Tags } from './collections/Tags';
import { CaseStudies } from './collections/CaseStudies';
import { Media } from './collections/Media';
import { Users } from './collections/Users';

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' | Hospitality AI SDK',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
  },

  collections: [
    Posts,
    Pages,
    Authors,
    Categories,
    Tags,
    CaseStudies,
    Media,
    Users,
  ],

  editor: lexicalEditor({}),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
  }),

  plugins: [
    seoPlugin({
      collections: ['posts', 'pages', 'case-studies'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc.title} | Hospitality AI SDK`,
      generateDescription: ({ doc }) => doc.excerpt || doc.seo?.description || '',
      generateImage: ({ doc }) => doc.featuredImage?.url || '/og-image.jpg',
    }),
  ],

  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },

  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],

  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],
});
