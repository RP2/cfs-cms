# Technology Stack for Cloudflare CFS CMS

**Project:** CFS CMS
**Researched:** Jan 23, 2026

## Recommended Stack

### Core Framework

| Technology         | Version    | Purpose             | Why                                         |
| ------------------ | ---------- | ------------------- | ------------------------------------------- |
| SvelteKit          | v2+        | Frontend framework  | Already working well, no change needed      |
| Svelte             | v5 (runes) | Reactive UI         | Latest version optimal                      |
| Cloudflare Workers | Latest     | Runtime environment | Free tier sufficient, excellent performance |

### Database

| Technology    | Version | Purpose          | Why                                                                       |
| ------------- | ------- | ---------------- | ------------------------------------------------------------------------- |
| Cloudflare D1 | Latest  | Primary database | SQLite-compatible, free tier generous (500MB), excellent for multi-tenant |

### Storage

| Technology    | Version | Purpose        | Why                                              |
| ------------- | ------- | -------------- | ------------------------------------------------ |
| Cloudflare R2 | Latest  | File storage   | Free tier (10GB storage, 1GB egress), global CDN |
| Cloudflare KV | Latest  | Cache/metadata | Free tier sufficient for metadata                |

### Authentication

| Technology | Version | Purpose                    | Why                                                                           |
| ---------- | ------- | -------------------------- | ----------------------------------------------------------------------------- |
| Lucia Auth | Latest  | Self-hosted authentication | Excellent SvelteKit integration, Cloudflare Workers compatible, session-based |

## Required Configuration

### wrangler.toml Configuration

```toml
name = "cfs-cms"
main = ".svelte-kit/cloudflare/_worker.js"
compatibility_date = "2026-01-01"  # Updated for 2026
account_id = "YOUR_ACCOUNT_ID"

[assets]
directory = ".svelte-kit/cloudflare/public"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "cfs_cms"
database_id = "YOUR_DATABASE_ID"

[[r2_buckets]]
binding = "R2"
bucket_name = "cfs-cms-files"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_NAMESPACE_ID"
```

### R2 CORS Configuration

```json
[
	{
		"AllowedOrigins": ["https://your-domain.com", "http://localhost:5173"],
		"AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
		"AllowedHeaders": ["Content-Type", "Authorization"],
		"ExposeHeaders": ["ETag"],
		"MaxAgeSeconds": 3600
	}
]
```

Apply with:

```bash
npx wrangler r2 bucket cors set cfs-cms-files --file cors.json
```

## Alternatives Considered

| Category | Recommended | Alternative        | Why Not                                                     |
| -------- | ----------- | ------------------ | ----------------------------------------------------------- |
| Auth     | Lucia Auth  | Supertokens        | Lucia simpler for self-hosted, better SvelteKit integration |
| Auth     | Lucia Auth  | Custom JWT         | Lucia provides battle-tested session management             |
| Database | D1          | Railway PostgreSQL | D1 free tier sufficient, better Cloudflare integration      |
| Storage  | R2          | Backblaze B2       | R2 free tier generous, integrated with Workers              |

## Installation

```bash
# Lucia Auth setup
npm install lucia @lucia-auth/adapter-sqlite

# Wrangler configuration
cp wrangler.toml.example wrangler.toml
# Edit with your Cloudflare account details

# R2 bucket setup
npx wrangler r2 bucket create cfs-cms-files
```

## Sources

- Cloudflare Workers docs: https://developers.cloudflare.com/workers/wrangler/configuration/
- R2 CORS docs: https://developers.cloudflare.com/r2/buckets/cors/
- Lucia Auth: https://lucia-auth.com/
- Supertokens comparison: Verified Cloudflare Workers compatibility
