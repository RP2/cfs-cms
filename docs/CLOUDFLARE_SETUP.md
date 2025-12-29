# CFS CMS - Cloudflare Setup Guide

Complete setup instructions for using Cloudflare infrastructure with CFS CMS.

## Overview

CFS CMS leverages multiple Cloudflare services:

- **Workers** - Serverless compute platform
- **D1** - SQLite database on the edge
- **R2** - S3-compatible object storage
- **KV** - Key-value store for caching

## Prerequisites

1. Cloudflare account (free tier available)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Cloudflare API token with appropriate permissions

## Step 1: Setup Wrangler

### Install Wrangler

```bash
npm install -g wrangler@latest
wrangler --version
```

### Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser to authenticate and generates credentials.

### Verify Authentication

```bash
wrangler whoami
```

Should display your Cloudflare account email.

## Step 2: Create Wrangler Configuration

Create `wrangler.toml` in the project root:

```toml
name = "cfs-cms"
type = "javascript"
main = "src/index.ts"
compatibility_date = "2024-12-19"

# Environment: local development
[env.development]
name = "cfs-cms-dev"
routes = []

# Cloudflare Pages deployment
[env.production]
name = "cfs-cms-prod"
routes = []

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "cfs-cms-dev"
database_id = "your-database-id"

# R2 bucket binding
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "cfs-cms-dev"

# KV namespace binding
[[kv_namespaces]]
binding = "KV"
id = "your-kv-namespace-id"
```

## Step 3: Setup D1 Database

### Create D1 Database

```bash
wrangler d1 create cfs-cms-dev
```

This returns database ID. Update `wrangler.toml` with the ID.

### Create Local D1 (for development)

```bash
wrangler d1 create cfs-cms-dev --local
```

Creates `.wrangler/state/d1/` with local database.

### Verify D1 Connection

```bash
wrangler d1 info cfs-cms-dev
```

### Run Initial Schema

Once schema is finalized in `docs/DATABASE.md`, run:

```bash
wrangler d1 execute cfs-cms-dev --remote < db/schema.sql
```

Local version:

```bash
wrangler d1 execute cfs-cms-dev --local < db/schema.sql
```

## Step 4: Setup R2 Bucket

### Create R2 Bucket

```bash
wrangler r2 bucket create cfs-cms-dev
```

This creates an S3-compatible bucket for file storage.

### Configure CORS (if needed for public access)

```bash
wrangler r2 bucket update cfs-cms-dev --cors file-cors.json
```

Example `file-cors.json`:

```json
{
	"CORSRules": [
		{
			"AllowedOrigins": ["https://yourdomain.com"],
			"AllowedMethods": ["GET", "PUT", "POST"],
			"AllowedHeaders": ["*"],
			"MaxAgeSeconds": 3000
		}
	]
}
```

### Generate R2 API Token

1. Go to Cloudflare Dashboard
2. Account Home → R2
3. Settings → API tokens
4. Create API token
5. Save access key ID and secret

Store in `.env.local`:

```
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
```

## Step 5: Setup KV Namespace

### Create KV Namespace

```bash
wrangler kv:namespace create cfs-cms-dev
wrangler kv:namespace create cfs-cms-dev --preview
```

This creates a KV namespace for caching and sessions.

Update `wrangler.toml` with namespace ID.

## Step 6: Environment Variables

Create `.env.local` for local development:

```bash
# Database
DATABASE_ID=your-d1-database-id
DATABASE_BINDING=DB

# R2 Storage
R2_BUCKET_NAME=cfs-cms-dev
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BINDING=BUCKET

# KV Cache
KV_NAMESPACE_ID=your-kv-id
KV_BINDING=KV

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# Application
APP_URL=http://localhost:5173
NODE_ENV=development
```

## Step 7: SvelteKit Cloudflare Adapter

### Install Adapter

```bash
npm install -D @sveltejs/adapter-cloudflare
```

### Configure in svelte.config.js

```javascript
import adapter from '@sveltejs/adapter-cloudflare';

export default {
	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		})
	}
};
```

## Step 8: Test Local Development

### Start Dev Server

```bash
npm run dev
```

This uses local D1 and KV for testing.

### Test D1 Connection

In a route handler (`src/routes/api/test.json.js`):

```javascript
export async function GET({ platform }) {
	const { results } = await platform.env.DB.prepare('SELECT * FROM users LIMIT 1').all();

	return new Response(JSON.stringify(results));
}
```

### Test R2 Connection

```javascript
export async function POST({ platform }) {
	await platform.env.BUCKET.put('test.txt', 'Hello World');
	return new Response('File uploaded');
}
```

## Step 9: Deploy to Cloudflare

### Deploy to Workers

```bash
wrangler deploy
```

### Deploy to Pages (recommended)

1. Connect GitHub repo to Cloudflare Pages
2. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `.svelte-kit/cloudflare`

3. Deploy from dashboard

## Monitoring & Debugging

### View D1 Logs

```bash
wrangler d1 list
```

### Check R2 Buckets

```bash
wrangler r2 bucket list
wrangler r2 object list cfs-cms-dev
```

### Monitor KV

```bash
wrangler kv:key list --namespace-id=your-id
```

### Real-time Logs

```bash
wrangler tail
```

## Cost Considerations

### Free Tier Includes

- 100,000 Workers requests/day
- 1,000 D1 reads/writes per day
- 10 GB R2 storage
- 100,000 KV operations/month

### Scaling Beyond Free Tier

- Workers: $0.50 per 1M requests
- D1: $0.75 per 1M reads + writes
- R2: $0.015 per GB/month
- KV: $0.50 per 1M operations

## Troubleshooting

### "Unauthorized" Error

```bash
wrangler logout
wrangler login
```

### D1 Database Not Found

```bash
wrangler d1 list
# Copy the ID and update wrangler.toml
```

### R2 Permission Denied

- Check API token has R2 permissions
- Verify bucket name spelling
- Check CORS configuration

### KV Operations Slow

- Use preview KV for testing
- Implement caching strategy
- Monitor operation count

## Next Steps

1. ✅ Install Wrangler
2. ✅ Create wrangler.toml
3. ✅ Setup D1 database
4. ✅ Setup R2 bucket
5. ✅ Setup KV namespace
6. Run `npm run dev` and test connections
7. Deploy when ready

## Resources

- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)
- [KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
- [SvelteKit Cloudflare Adapter](https://github.com/sveltejs/kit/tree/main/packages/adapter-cloudflare)

---

**Last Updated**: December 29, 2025  
**Status**: Setup guide (ready to implement)
