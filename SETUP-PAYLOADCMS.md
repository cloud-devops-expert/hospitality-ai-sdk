# PayloadCMS Integration Setup Guide

This guide walks you through completing the PayloadCMS integration with the existing demo application.

## Current Status ✅

**Already Configured:**

- ✅ PayloadCMS collections (8 total: Posts, Pages, Authors, Categories, Tags, CaseStudies, Media, Users)
- ✅ App routes structure: `app/(payload)/admin`, `app/(payload)/api`
- ✅ Root-level `payload.config.ts` with PostgreSQL adapter
- ✅ Environment configuration files (`.env.local`, `.env.example`)
- ✅ Next.js config updated with `withPayload` wrapper
- ✅ GitIgnore updated for PayloadCMS files

**Pending:**

- ⏳ npm package installation (blocked by npm cache permissions)
- ⏳ PostgreSQL database setup
- ⏳ First admin user creation

---

## Step 1: Fix npm Cache Permissions

**Problem:** Your npm cache contains root-owned files that prevent package installation.

**Solution:**

```bash
# Fix npm cache ownership (requires password)
sudo chown -R 501:20 "/Users/miguelgoncalves/.npm"

# Clean the cache
npm cache clean --force

# Verify fix
npm cache verify
```

---

## Step 2: Install PayloadCMS Packages

Once npm cache is fixed, install all required packages:

```bash
npm install \
  payload@3.60.0 \
  @payloadcms/next@3.60.0 \
  @payloadcms/richtext-lexical@3.60.0 \
  @payloadcms/db-postgres@3.60.0 \
  @payloadcms/plugin-seo@3.60.0 \
  sharp \
  graphql \
  pg \
  --legacy-peer-deps
```

**Package Versions:**

- `payload@3.60.0` - Stable release (not beta)
- Requires Next.js 15+ ✅ (you have 15.0.0)
- PostgreSQL database adapter
- Lexical rich text editor
- SEO plugin for meta tags

---

## Step 3: Set Up PostgreSQL Database

### Option A: Local PostgreSQL (Recommended for Development)

```bash
# Install PostgreSQL (if not already installed)
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database
createdb hospitality_ai_cms

# Verify connection
psql -d hospitality_ai_cms -c "SELECT version();"
```

### Option B: Docker (Alternative)

```bash
# Create docker-compose.yml (already in project)
docker-compose up -d

# Verify container is running
docker ps | grep postgres
```

### Option C: Managed PostgreSQL

Use a managed service like:

- **Supabase** (free tier: 500MB)
- **Railway** (free tier: 1GB)
- **Neon** (free tier: 3GB)

---

## Step 4: Configure Environment Variables

**Check your `.env.local` file:**

```bash
cat .env.local
```

**Required variables:**

```env
# Database (update if using managed service)
DATABASE_URL=postgresql://localhost:5432/hospitality_ai_cms

# PayloadCMS Secret (CHANGE THIS!)
PAYLOAD_SECRET=your-secret-key-here-change-this

# Server URL
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Optional: OpenAI (for demo AI features)
OPENAI_API_KEY=your-openai-api-key-here
```

**Generate a secure PAYLOAD_SECRET:**

```bash
# Generate random secret and update .env.local
openssl rand -base64 32
```

Then manually update `.env.local` with the generated secret.

---

## Step 5: Start Development Server

```bash
# Kill any running dev servers first
pkill -f "next dev"

# Start fresh server
npm run dev
```

**Expected output:**

```
   ▲ Next.js 15.0.0
   - Local:        http://localhost:3000
   - Network:      http://192.168.1.85:3000

 ✓ Starting...
 ✓ Ready in 2.1s
 ✓ PayloadCMS connected to PostgreSQL
 ✓ Running migrations...
```

**PayloadCMS will automatically:**

- Connect to PostgreSQL
- Run database migrations
- Create all tables (posts, pages, authors, etc.)
- Generate TypeScript types

---

## Step 6: Create First Admin User

1. Open admin panel: http://localhost:3000/admin

2. You'll see the "Create First User" page

3. Fill in:
   - **Email:** your-email@example.com
   - **Password:** (secure password)
   - **Name:** Your Name

4. Click "Create Account"

5. You'll be logged in and see the PayloadCMS dashboard

---

## Step 7: Verify Integration

### Test Admin Panel

- ✅ Navigate to: http://localhost:3000/admin
- ✅ Should see Collections: Posts, Pages, Authors, Categories, Tags, Case Studies, Media, Users
- ✅ Create a test post or page

### Test REST API

```bash
# Get all posts (should return empty array initially)
curl http://localhost:3000/api/posts

# Get API documentation
curl http://localhost:3000/api
```

### Test GraphQL API

- Navigate to: http://localhost:3000/api/graphql
- Should see GraphQL Playground
- Try query:

```graphql
query {
  Posts {
    docs {
      id
      title
      slug
    }
  }
}
```

### Test Demo Pages

- ✅ Homepage: http://localhost:3000
- ✅ All 10 demo features still work:
  - Sentiment Analysis
  - Room Allocation
  - Dynamic Pricing
  - Demand Forecast
  - No-Show Prediction
  - Review Response
  - Housekeeping Routes
  - Upsell Recommendations
  - Energy Management
  - Staff Scheduling
  - Inventory Forecast
  - Complaint Classification
  - Maintenance Prediction
  - Check-in Time Prediction
  - ML Benchmarks

---

## File Structure After Setup

```
hospitality-ai-sdk/
├── app/
│   ├── (payload)/                    # PayloadCMS routes (NEW)
│   │   ├── admin/
│   │   │   ├── [[...segments]]/
│   │   │   │   └── page.tsx         # Admin UI
│   │   │   └── importMap.ts         # Component imports
│   │   └── api/
│   │       ├── [...slug]/
│   │       │   └── route.ts         # REST API
│   │       └── graphql/
│   │           └── route.ts         # GraphQL API
│   ├── sentiment/                    # Demo pages (EXISTING)
│   ├── allocation/
│   ├── pricing/
│   ├── forecast/
│   ├── no-show/
│   ├── review-response/
│   ├── housekeeping/
│   ├── upsell/
│   ├── energy/
│   ├── scheduling/
│   ├── inventory/
│   ├── complaints/
│   ├── maintenance/
│   ├── checkin/
│   ├── benchmark/
│   └── page.tsx                      # Homepage
├── src/
│   └── payload/
│       └── collections/              # PayloadCMS collections (NEW)
│           ├── Posts.ts
│           ├── Pages.ts
│           ├── Authors.ts
│           ├── Categories.ts
│           ├── Tags.ts
│           ├── CaseStudies.ts
│           ├── Media.ts
│           └── Users.ts
├── public/
│   └── media/                        # Uploaded images (NEW)
│       └── .gitkeep
├── payload.config.ts                 # PayloadCMS config (NEW)
├── payload-types.ts                  # Auto-generated types (NEW)
├── generated-schema.graphql          # Auto-generated GraphQL (NEW)
├── .env.local                        # Environment config (NEW)
└── next.config.ts                    # Updated with withPayload
```

---

## Troubleshooting

### Issue: "Cannot find module '@payloadcms/next'"

**Cause:** Packages not installed yet
**Solution:** Complete Step 1 and Step 2 above

### Issue: "Database connection error"

**Cause:** PostgreSQL not running or wrong credentials
**Solution:**

```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start if not running
brew services start postgresql@15

# Test connection
psql -d hospitality_ai_cms
```

### Issue: "PAYLOAD_SECRET not set"

**Cause:** Missing environment variable
**Solution:**

```bash
# Generate secret
openssl rand -base64 32

# Add to .env.local
echo "PAYLOAD_SECRET=<generated-secret>" >> .env.local
```

### Issue: "Port 3000 already in use"

**Cause:** Old dev server still running
**Solution:**

```bash
# Kill all Next.js processes
pkill -f "next dev"

# Restart
npm run dev
```

### Issue: "Migration failed"

**Cause:** Database schema conflict
**Solution:**

```bash
# Drop and recreate database
dropdb hospitality_ai_cms
createdb hospitality_ai_cms

# Restart server (migrations run automatically)
npm run dev
```

---

## Next Steps After Setup

### 1. Create Initial Content

**In the admin panel:**

- Create 2-3 author profiles
- Add 3-5 categories (Technical, Philosophy, Tutorial, Case Study, News)
- Add 10-15 tags
- Publish your first blog post (use content from `content/blog/`)

### 2. Build Marketing Pages

Create Next.js pages that fetch from PayloadCMS:

```typescript
// Example: app/(marketing)/blog/page.tsx
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@/payload.config'

export default async function BlogPage() {
  const payload = await getPayloadHMR({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' }
    },
    sort: '-publishedAt',
    limit: 10
  })

  return (
    <div>
      {posts.docs.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  )
}
```

### 3. Set Up SEO

The SEO plugin is already configured. Each post/page will auto-generate:

- Meta title
- Meta description
- Open Graph tags
- Twitter Card tags

### 4. Deploy to Production

**Recommended platforms:**

- **Vercel** (frontend + Next.js)
- **Railway** (PostgreSQL database)
- **Supabase** (PostgreSQL alternative)

**Environment variables to set in production:**

```env
DATABASE_URL=<production-database-url>
PAYLOAD_SECRET=<production-secret>
NEXT_PUBLIC_SERVER_URL=https://your-domain.com
```

---

## Architecture Overview

### How It Works

```
┌─────────────────────────────────────────────────┐
│         Next.js 15 App Router                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐   ┌──────────────────┐  │
│  │  Demo Pages      │   │  PayloadCMS      │  │
│  │  (existing)      │   │  (new)           │  │
│  ├──────────────────┤   ├──────────────────┤  │
│  │ • Sentiment      │   │ • Admin Panel    │  │
│  │ • Allocation     │   │ • REST API       │  │
│  │ • Pricing        │   │ • GraphQL API    │  │
│  │ • Forecast       │   │ • Content Mgmt   │  │
│  │ • No-Show        │   │ • Media Upload   │  │
│  │ • Review Resp    │   │ • SEO Plugin     │  │
│  │ • Housekeeping   │   │                  │  │
│  │ • Upsell         │   │                  │  │
│  │ • Energy         │   │                  │  │
│  │ • Scheduling     │   │                  │  │
│  │ • Inventory      │   │                  │  │
│  │ • Complaints     │   │                  │  │
│  │ • Maintenance    │   │                  │  │
│  │ • Check-in       │   │                  │  │
│  │ • Benchmarks     │   │                  │  │
│  └──────────────────┘   └──────────────────┘  │
│         │                       │              │
│         └───────────┬───────────┘              │
│                     │                          │
└─────────────────────┼──────────────────────────┘
                      │
              ┌───────▼────────┐
              │   PostgreSQL   │
              │   Database     │
              └────────────────┘
```

### Data Flow

1. **Admin creates content** → PayloadCMS Admin Panel → PostgreSQL
2. **API queries** → REST/GraphQL API → PostgreSQL → JSON response
3. **Next.js pages** → Server-side fetch → PostgreSQL → Rendered HTML
4. **Demo features** → Traditional algorithms (no database needed)

---

## Success Checklist

After completing setup, verify:

- [ ] npm cache permissions fixed
- [ ] PayloadCMS packages installed (no errors)
- [ ] PostgreSQL database created and running
- [ ] `.env.local` configured with secure PAYLOAD_SECRET
- [ ] Dev server starts without errors
- [ ] Admin panel accessible at /admin
- [ ] First admin user created successfully
- [ ] Can create test post in admin
- [ ] REST API returns data at /api/posts
- [ ] GraphQL playground works at /api/graphql
- [ ] All demo pages still functional at /sentiment, /allocation, etc.
- [ ] No TypeScript errors in terminal
- [ ] Media uploads work in admin

---

## Support

- **PayloadCMS Docs:** https://payloadcms.com/docs
- **Next.js 15 Docs:** https://nextjs.org/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/

**Project Documentation:**

- `IMPLEMENTATION-SUMMARY.md` - What was built
- `INSTALLATION-PAYLOADCMS.md` - Original installation guide
- `.agent/docs/prd-marketing-platform.md` - Product requirements
- `.agent/docs/competitor-analysis.md` - Market analysis

---

## Estimated Time

- **Step 1-2:** 5 minutes (npm fix + install)
- **Step 3:** 5 minutes (PostgreSQL setup)
- **Step 4:** 2 minutes (environment config)
- **Step 5:** 2 minutes (start server)
- **Step 6:** 1 minute (create user)
- **Step 7:** 5 minutes (verification)

**Total: ~20 minutes** ⏱️

---

**Ready to start? Begin with Step 1! 🚀**
