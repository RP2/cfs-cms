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

### 3. Setup shadcn-svelte Components

shadcn-svelte provides pre-built UI components matching Google Drive's interface:

```bash
npx shadcn-svelte@latest init
# This will initialize shadcn-svelte in your project

# Add specific components
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add card
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add input
npx shadcn-svelte@latest add separator
npx shadcn-svelte@latest add tabs
npx shadcn-svelte@latest add breadcrumb
npx shadcn-svelte@latest add dropdown-menu
npx shadcn-svelte@latest add context-menu
```

Components are copied to `src/lib/components/ui/` - fully customizable via Tailwind.

### 4. Environment Variables

Create `.env.local` in the root directory (for local dev only):

```bash
# Mock Data (Phase 1: UI development)
# Set to true to use mock data, false to call real API
PUBLIC_USE_MOCK_DATA=true

# Optional: API base URL for local backend testing
# Only needed if running wrangler dev separately
VITE_API_BASE=http://127.0.0.1:8787

# Application
APP_URL=http://localhost:5173
NODE_ENV=development
```

**Note**: `.env.local` is ignored by git (see `.gitignore`). For deployed builds (Cloudflare Pages), environment variables are set in the Pages dashboard, not in this file.

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

## Local Backend Testing (Optional)

### Testing with Cloudflare Bindings Locally

If you want to test the full backend with D1/R2/KV locally (instead of mock data):

1. **Create local `wrangler.toml`** (ignored by git):

   ```bash
   cp wrangler.toml.example wrangler.toml
   # Fill in YOUR_ACCOUNT_ID, YOUR_DATABASE_ID, YOUR_BUCKET_NAME, YOUR_KV_ID
   # Get these from your Cloudflare dashboard
   ```

2. **Provision Cloudflare resources** (one-time setup):

   ```bash
   npx wrangler d1 create cfs_cms
   npx wrangler d1 execute cfs_cms --file docs/database.sql
   npx wrangler r2 bucket create cfs-cms-files
   npx wrangler kv:namespace create cfs_cms
   ```

3. **Run Cloudflare dev server** (in one terminal):

   ```bash
   npm run cf:dev
   ```

   This emulates D1/R2/KV bindings locally at `http://127.0.0.1:8787`.

4. **Run SvelteKit app** (in another terminal):
   ```bash
   npm run dev
   ```
   Set `PUBLIC_USE_MOCK_DATA=false` in `.env.local` to hit the API instead of mock data.

**Note**: Most contributors can skip this and use `PUBLIC_USE_MOCK_DATA=true` (mock data). Local backend testing is optional for Phase 2 development.

## Building & Deployment

### Production Build

```bash
npm run build
```

Creates optimized production build in `.svelte-kit/cloudflare/` (Cloudflare adapter output).

### Preview Production Build Locally

```bash
npm run preview
```

Previews the SvelteKit app locally (useful before deployment).

### Deploy to Cloudflare Pages

This project uses SvelteKit with the Cloudflare adapter, which automatically compiles to Cloudflare Workers.

**Git-based deployment** (recommended for open source):

1. Connect GitHub repo to Cloudflare Pages dashboard
2. Set build settings:
   - Framework: SvelteKit
   - Build command: `npm run build`
   - Build output: `.svelte-kit/cloudflare`
3. Set environment variables in **Pages dashboard** (Production and Preview):
   - `PUBLIC_USE_MOCK_DATA=false` (enables real API, uses D1/R2/KV bindings)
   - `ENVIRONMENT=production` (or `preview`)
4. Set bindings in **Pages dashboard** (under D1/R2/KV sections):
   - D1 binding: `DB`
   - R2 binding: `R2`
   - KV binding: `KV`
5. Push to GitHub; Pages auto-builds and deploys

**Note**: No secrets go in the repo. All credentials/IDs are stored in the Cloudflare Pages dashboard. When `PUBLIC_USE_MOCK_DATA=false`, the app uses the real bindings configured in Pages.

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
2. ✅ Create `.env.local` with `PUBLIC_USE_MOCK_DATA=true` (use mock data locally)
3. Run `npm run dev` to start development
4. Read [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) for architecture
5. Check [TODO.md](../TODO.md) for current tasks
6. **Optional**: Follow "Local Backend Testing" to test API with real Cloudflare bindings

## Resources

- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Node.js Documentation](https://nodejs.org/docs/)

---

**Last Updated**: January 2, 2026  
**Questions?** Check PROJECT_CONTEXT.md or ARCHITECTURE.md for context
