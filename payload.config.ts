import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import path from 'path'
import { fileURLToPath } from 'url'

// Import collections
import { Posts } from './src/payload/collections/Posts'
import { Pages } from './src/payload/collections/Pages'
import { Authors } from './src/payload/collections/Authors'
import { Categories } from './src/payload/collections/Categories'
import { Tags } from './src/payload/collections/Tags'
import { CaseStudies } from './src/payload/collections/CaseStudies'
import { Media } from './src/payload/collections/Media'
import { Users } from './src/payload/collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001',

  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' | Hospitality AI SDK',
      favicon: '/favicon.ico',
      ogImage: '/og-image.jpg',
    },
    importMap: {
      baseDir: path.resolve(dirname),
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
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'generated-schema.graphql'),
  },

  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001',
  ],

  csrf: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001',
  ],
})
