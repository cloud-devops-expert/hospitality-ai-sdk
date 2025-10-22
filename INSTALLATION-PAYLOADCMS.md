# PayloadCMS Installation Instructions

## Prerequisites

Your npm cache has permission issues. Fix them first:

```bash
# Fix npm cache permissions (run in terminal with your password)
sudo chown -R $(whoami) ~/.npm

# Then clean the cache
npm cache clean --force
```

## Install PayloadCMS Dependencies

```bash
# Install PayloadCMS stable v3.60.0 with PostgreSQL
npm install \
  payload@3.60.0 \
  @payloadcms/next@3.60.0 \
  @payloadcms/richtext-lexical@3.60.0 \
  @payloadcms/db-postgres@3.60.0 \
  @payloadcms/plugin-seo@3.60.0 \
  @payloadcms/plugin-cloud-storage@3.60.0 \
  sharp \
  graphql \
  pg \
  --legacy-peer-deps
```

## Set Up PostgreSQL Database

### Option 1: Local PostgreSQL

```bash
# Install PostgreSQL (macOS)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb hospitality_ai_cms

# Create .env.local file
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://localhost:5432/hospitality_ai_cms
PAYLOAD_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
EOF
```

### Option 2: Docker PostgreSQL

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hospitality_ai_cms
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Start database
docker-compose up -d

# Update .env.local
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hospitality_ai_cms" > .env.local
echo "PAYLOAD_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "NEXT_PUBLIC_SERVER_URL=http://localhost:3000" >> .env.local
```

## Run Migrations

```bash
# PayloadCMS will auto-migrate on first run
npm run dev

# Or manually with payload CLI
npx payload migrate
```

## Create Admin User

After running `npm run dev`, navigate to:

```
http://localhost:3000/admin
```

Create your first admin user.

## Verify Installation

1. Access admin panel: `http://localhost:3000/admin`
2. Create a test blog post
3. Visit marketing site: `http://localhost:3000/marketing`
4. Check API: `http://localhost:3000/api/posts`

## Troubleshooting

### Issue: "Cannot find module 'payload'"

**Solution:** Re-run `npm install --legacy-peer-deps`

### Issue: Database connection failed

**Solution:** Check DATABASE_URL in .env.local, verify PostgreSQL is running

### Issue: Sharp installation error

**Solution:**

```bash
npm install sharp --force
# Or use pre-built binaries
npm install --platform=darwin --arch=arm64 sharp
```

### Issue: Permission errors

**Solution:** Fix npm cache ownership (see Prerequisites above)

## Next Steps

Once installed:

1. Configure collections (already created in `src/payload/collections/`)
2. Customize admin UI theme
3. Add media storage (local or cloud)
4. Set up email templates
5. Configure access control rules

## Production Deployment

For production, you'll need:

1. Production PostgreSQL (managed: AWS RDS, Supabase, Railway)
2. Environment variables set on hosting platform
3. Build command: `npm run build`
4. Start command: `npm run start`

Recommended platforms:

- **Vercel** (easiest, auto-deploy from Git)
- **Railway** (includes PostgreSQL)
- **Render** (free tier with PostgreSQL)
- **Self-hosted** (VPS with Docker)
