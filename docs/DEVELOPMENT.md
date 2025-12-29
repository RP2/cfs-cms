# CFS CMS - Development Setup

Complete guide for setting up the development environment for CFS CMS.

## Prerequisites

- **Node.js**: v18+ (check: `node --version`)
- **npm**: v9+ (check: `npm --version`)
- **Git**: v2.30+ (check: `git --version`)
- **Cloudflare Account**: For testing infrastructure (free tier available)

## Initial Setup

### 1. Install Node.js & npm

If not already installed:

- Download from [nodejs.org](https://nodejs.org/)
- Choose LTS version
- Verify installation: `node --version && npm --version`

### 2. Clone & Install Dependencies

```bash
cd /home/riley/Github/cfs-cms
npm install
```

This installs all dependencies specified in `package.json`.

### 3. Environment Variables

Create `.env.local` in the root directory:

```bash
# Database
DATABASE_URL=file:./dev.db

# Cloudflare (get these from Cloudflare dashboard)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_KV_NAMESPACE_ID=your_kv_id
CLOUDFLARE_R2_BUCKET_NAME=cfs-cms-dev
CLOUDFLARE_D1_DATABASE_ID=your_d1_id

# Application
APP_URL=http://localhost:5173
NODE_ENV=development
```

## Development Server

### Start Development Server

```bash
npm run dev
```

This command:

- Starts Vite dev server
- Watches for file changes
- Hot reloads on changes
- Runs on http://localhost:5173

### Access the App

Open http://localhost:5173 in your browser.

## Database Setup

### Cloudflare D1 Local Development

Install Wrangler (if not already):

```bash
npm install -g wrangler@latest
```

Initialize D1 database locally:

```bash
wrangler d1 create cfs-cms-dev --local
```

This creates `.wrangler/state/d1` directory with local SQLite database.

### Create Tables

(Documentation coming in DATABASE.md after schema is finalized)

Run migrations:

```bash
wrangler migrations apply
```

## Code Quality Tools

### Type Checking

```bash
npm run check
```

Runs TypeScript compiler to check for type errors.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

### Formatting (when configured)

```bash
npm run format
```

Formats code using Prettier.

## Building

### Production Build

```bash
npm run build
```

Creates optimized production build in `./build/`.

### Preview Production Build

```bash
npm run preview
```

Previews the production build locally (useful before deployment).

## Debugging

### VS Code Debugging

1. Open `.vscode/launch.json` (create if needed)
2. Add debug configuration for Node
3. Set breakpoints in code
4. Press F5 to start debugger

### Browser DevTools

1. Open http://localhost:5173
2. Press F12 to open DevTools
3. Use Sources tab for breakpoints
4. Use Console for testing

### Server Logs

Check terminal where you ran `npm run dev` for server logs.

## Project Structure

Once you've set up, familiarize yourself with:

- `/src/routes` - Pages (create new `.svelte` files here)
- `/src/lib/components` - Reusable components (TBD)
- `/src/lib/services` - Business logic (TBD)
- `/src/lib/types` - Type definitions (TBD)
- `/docs` - Documentation files

## Git Workflow

### Clone & Setup

```bash
git clone https://github.com/yourusername/cfs-cms.git
cd cfs-cms
npm install
```

### Create Feature Branch

```bash
git checkout -b feature/feature-name
```

### Commit Changes

```bash
git add .
git commit -m "feat: description of changes"
```

### Push & Create PR

```bash
git push origin feature/feature-name
```

Then create Pull Request on GitHub.

## Troubleshooting

### "Module not found" error

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 5173 already in use

```bash
npm run dev -- --port 3000
```

### Cloudflare connection issues

- Verify API token in `.env.local`
- Check Cloudflare dashboard for account details
- Ensure wrangler is up to date: `npm install -g wrangler@latest`

### Type checking errors

```bash
npm run check
```

Fix any TypeScript errors before committing.

## Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Create `.env.local` file
3. ✅ Setup local D1 database
4. Run `npm run dev` to start development
5. Read [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) for architecture
6. Check [TODO.md](../TODO.md) for current tasks

## Resources

- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

**Last Updated**: December 29, 2025  
**Questions?** Check PROJECT_CONTEXT.md or existing docs
