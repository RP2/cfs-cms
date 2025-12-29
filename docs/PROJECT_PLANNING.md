# CFS CMS - Project Planning & AI Handoff Guide

Strategic guide for managing this project across multiple AI models and development sessions.

## The Problem We're Solving

When working on complex projects across multiple AI models (Claude, Copilot, Cursor, etc.), context is fragmented and inconsistent. This document + supporting files create a **"project brain"** that can be transferred between sessions and AI models seamlessly.

## The Solution: Context Documentation System

Instead of relying on AI to remember context, we've documented everything strategically:

### 1. **README.md** - Starting Point

- Project overview
- Tech stack summary
- Quick start
- Where to find everything

**Use when**: First time looking at the project, onboarding new developers

### 2. **PROJECT_CONTEXT.md** - Deep Context

- Business goals and vision
- All technology decisions and WHY
- Architecture overview
- Current development phase
- Known challenges and solutions

**Use when**: Need to understand WHY decisions were made, architecture questions, design decisions

### 3. **ROADMAP.md** - Strategic Planning

- All phases with detailed breakdown
- Feature lists per phase
- Timeline estimates
- Success metrics
- Risk analysis

**Use when**: Planning new work, understanding project scope, prioritization decisions

### 4. **TODO.md** - Daily Work

- Current high/medium/low priority tasks
- Completed tasks
- Blockers and questions
- Learning resources

**Use when**: Starting a work session, tracking progress, finding next tasks

### 5. **.cursorrules** - AI Instructions

- Quick reference for AI models
- File structure overview
- Key decision points
- Common tasks (creating components, services, pages)
- Development commands

**Use when**: AI is working on the project (loaded automatically by Cursor)

### 6. **docs/** - Detailed Guides

#### docs/DEVELOPMENT.md

- Step-by-step dev environment setup
- How to run the project
- Debugging techniques
- Troubleshooting

**Use when**: Setting up local development

#### docs/DATABASE.md

- Complete schema design
- Table definitions with SQL
- Relationships and constraints
- Performance considerations

**Use when**: Working on data models, database changes, queries

#### docs/CLOUDFLARE_SETUP.md

- Complete Cloudflare configuration
- D1, R2, KV setup
- Environment variables
- Testing connections
- Deployment

**Use when**: Setting up infrastructure, deploying, debugging Cloudflare issues

## How to Use These Files

### For Yourself (Self-Continuity)

At the end of each work session:

1. Update **TODO.md** with current status
2. Make a git commit with what you completed
3. Write any new discoveries in **PROJECT_CONTEXT.md** (under "Notes")
4. Note any blockers/decisions needed

At the start of the next session:

1. Review **TODO.md** for where you left off
2. Check git log for what was done
3. Run `npm run dev` and start working

### For AI Model Handoff

When passing to Claude/Copilot/Cursor:

1. Tell the AI to read **PROJECT_CONTEXT.md** first
2. Provide the specific TODO item you want worked on
3. The AI should reference **ROADMAP.md** for context
4. .cursorrules is loaded automatically in Cursor

Example prompt:

```
Working on CFS CMS (SvelteKit + Cloudflare CMS).

Please read PROJECT_CONTEXT.md for full context.

Current task from TODO.md (high priority):
- [ ] **Create core directory structure**
  - [ ] Create `/src/lib/components` directory
  - [ ] Create `/src/lib/services` directory

When done, update TODO.md to mark as complete.
```

### For Collaborative Development

If multiple people work on this:

1. **Main source of truth**: PROJECT_CONTEXT.md + ROADMAP.md
2. **Coordination**: TODO.md (update daily)
3. **Technical reference**: docs/\* files
4. **Code**: Git with meaningful commits
5. **Discussion**: GitHub Issues/Discussions

## Project Growth Strategy

### Phase 0 (Now)

Focus on documentation and planning - **you're doing this now**

### Phase 1-2 (Implementation)

Execute from ROADMAP.md, update PROJECT_CONTEXT.md with learnings

### Phase 3-4 (Refinement)

Formalize patterns, document in docs/, update ROADMAP.md with actual timings

### Phase 5-7 (Scaling)

Add API documentation, architecture diagrams, integration guides

### Phase 8+ (Open Source)

Repository-level docs, CONTRIBUTING.md, community guidelines

## The AI Context Loop

```
┌─────────────────────────────────────────┐
│  Read PROJECT_CONTEXT.md                │
│  (Understand vision, goals, tech stack) │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Check TODO.md                          │
│  (Find current tasks)                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Read ROADMAP.md (current phase)        │
│  (Understand broader context)           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Reference .cursorrules                 │
│  (Follow code patterns)                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Check docs/ for technical details      │
│  (DATABASE.md, CLOUDFLARE_SETUP.md, etc)│
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  BUILD & IMPLEMENT                      │
│  Update TODO.md with progress           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Commit code                            │
│  Update PROJECT_CONTEXT.md with notes   │
└─────────────────────────────────────────┘
```

## File Priority (Read In This Order)

**For Quick Start (5 min)**:

1. README.md
2. .cursorrules
3. TODO.md (high priority section)

**For Understanding (15 min)**:

1. PROJECT_CONTEXT.md (tech stack + architecture)
2. ROADMAP.md (current phase)
3. docs/DEVELOPMENT.md

**For Implementation (varies)**:

1. Relevant .md from docs/
2. Reference .cursorrules for patterns
3. Check git history for examples
4. Read related code sections

**For Decision Making**:

1. PROJECT_CONTEXT.md (design decisions section)
2. ROADMAP.md (risks section)
3. TODO.md (blockers section)

## What NOT to Document

❌ **Don't document:**

- Code-level comments (keep those in code files)
- Individual commit messages (that's what git is for)
- Temporary thoughts (use git branches for experiments)
- Personal notes (use private journals)
- Every small decision (only document strategic ones)

✅ **DO document:**

- Why we chose a tech (not that we chose it)
- Business goals (not implementation details)
- Phase plans (not daily tasks)
- Architecture decisions (not code paths)
- Roadblocks and solutions (for future reference)

## Success Metrics for This System

You'll know the documentation is working when:

1. ✅ Any AI model can read these files and understand the project fully
2. ✅ You can pick up the project after 2 weeks and remember context
3. ✅ New developers can get productive in < 1 hour
4. ✅ Project decisions are clear and traceable
5. ✅ Progress is visible and measurable (TODO.md)

## Maintenance Checklist

**Weekly**:

- [ ] Update TODO.md with current status
- [ ] Note any blockers in TODO.md
- [ ] Commit code regularly

**Monthly**:

- [ ] Review ROADMAP.md timeline realism
- [ ] Update PROJECT_CONTEXT.md with learnings
- [ ] Check if any docs are outdated

**Between Phases**:

- [ ] Update ROADMAP.md with actual timings
- [ ] Add phase retrospective to PROJECT_CONTEXT.md
- [ ] Archive completed TODO items
- [ ] Review and update tech stack decisions

## Tools That Read These Files

- **Cursor IDE**: Automatically reads .cursorrules
- **VS Code**: Can display as breadcrumbs/outline
- **GitHub**: Renders in repository view
- **AI Models**: Can be pasted into context window
- **Documentation Sites**: Can be exported to Markdown

## Example: Handing Off to Claude

```
I'm building a CFS CMS with SvelteKit and Cloudflare.

Read these files for context:
- PROJECT_CONTEXT.md - overall strategy
- ROADMAP.md - current phase (Phase 0)
- TODO.md - specific tasks

Here's what I need:
"Create the core directory structure under /src/lib/ as listed in TODO.md"

When done, I'll update TODO.md to mark items complete.

Files are at: /home/riley/Github/cfs-cms/
```

## When to Create New Documentation

Ask yourself:

- Will multiple people need this info? → Create docs
- Is it a one-time decision? → Add to PROJECT_CONTEXT.md
- Is it a repeatable task? → Add to .cursorrules or docs/
- Is it for AI context? → Belongs in PROJECT_CONTEXT.md
- Is it a guide? → Create in docs/

## Repository Structure Summary

```
/home/riley/Github/cfs-cms/
├── README.md                    ← Start here
├── PROJECT_CONTEXT.md           ← Architecture & decisions
├── ROADMAP.md                   ← Phase planning
├── TODO.md                      ← Daily tasks
├── .cursorrules                 ← AI instructions (auto-loaded by Cursor)
├── docs/
│   ├── DEVELOPMENT.md          ← Setup & running locally
│   ├── DATABASE.md             ← Schema design
│   ├── CLOUDFLARE_SETUP.md     ← Infrastructure config
│   ├── ARCHITECTURE.md         ← TBD
│   └── COMPONENT_GUIDE.md      ← TBD
├── src/                        ← Application code
└── [package.json, etc.]
```

## Key Insights

1. **Documentation is a feature**, not a chore
2. **Context is the hardest part** of working across models
3. **One source of truth** prevents conflicting information
4. **Layers matter**: Quick ref → Context → Details → Implementation
5. **AI loves structure**: Clear, organized docs = better AI assistance

## Next Steps

1. ✅ You've created the documentation system
   2.📝 Start Phase 0 work (create directory structure, etc.)
2. 🔄 Update TODO.md as you progress
3. 📚 Add to docs/ as you learn new things
4. 🤖 Use .cursorrules when working with AI

---

**Created**: December 29, 2025  
**Status**: Foundation phase - Ready for implementation  
**Your Next Task**: Pick a high-priority item from TODO.md and execute it!
