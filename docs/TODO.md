# CFS CMS - Active TODO List

## Current Phase: Phase 0 - Foundation & Planning

### High Priority (This Week)

- [ ] **Create core directory structure**
  - [ ] Create `/src/lib/components` directory
  - [ ] Create `/src/lib/services` directory
  - [ ] Create `/src/lib/types` directory
  - [ ] Create `/src/lib/stores` directory
  - [ ] Create `/docs` directory for documentation

- [ ] **Design database schema**
  - [ ] Sketch out all tables (users, files, folders, tags, etc.)
  - [ ] Define relationships and constraints
  - [ ] Document schema in `/docs/DATABASE.md`

- [ ] **Setup Cloudflare integration**
  - [ ] Research Cloudflare Workers adapter for SvelteKit
  - [ ] Configure wrangler.toml
  - [ ] Setup local D1 database
  - [ ] Document Cloudflare setup in `/docs/CLOUDFLARE_SETUP.md`

- [ ] **Initialize TypeScript configuration**
  - [ ] Review tsconfig.json
  - [ ] Setup strict mode
  - [ ] Configure path aliases (@/lib, etc.)

### Medium Priority (Next 1-2 Weeks)

- [ ] **Development environment setup**
  - [ ] Create development guide in `/docs/DEVELOPMENT.md`
  - [ ] Setup linting/formatting rules
  - [ ] Configure pre-commit hooks
  - [ ] Document env variables in `.env.example`

- [ ] **Create initial type definitions**
  - [ ] User types
  - [ ] File types
  - [ ] Folder types
  - [ ] Tag types
  - [ ] Permission types

- [ ] **Setup testing framework**
  - [ ] Choose testing library (Vitest, Jest)
  - [ ] Configure test setup
  - [ ] Create test template

- [ ] **Documentation structure**
  - [ ] Create `/docs/ARCHITECTURE.md`
  - [ ] Create `/docs/DEVELOPMENT.md`
  - [ ] Create `/docs/DATABASE.md`
  - [ ] Create `/docs/CLOUDFLARE_SETUP.md`
  - [ ] Create `/docs/COMPONENT_GUIDE.md`

### Low Priority (Phase 1 Prep)

- [ ] **Spike: SvelteKit learning**
  - [ ] Review official SvelteKit docs
  - [ ] Complete basic tutorial
  - [ ] Document key learnings

- [ ] **Spike: Cloudflare infrastructure**
  - [ ] Research D1 limitations
  - [ ] Research R2 best practices
  - [ ] Research KV use cases

- [ ] **Design decisions document**
  - [ ] Create `/docs/DESIGN_DECISIONS.md`
  - [ ] Document all tech choices with reasoning

---

## Phase 1 Preparation (Backlog)

### Ready for Phase 1 Checklist

- [ ] Directory structure complete
- [ ] Database schema finalized
- [ ] Type definitions ready
- [ ] Development environment documented
- [ ] SvelteKit configured for Cloudflare
- [ ] All tools configured (linting, formatting, testing)

### Phase 1 Tasks (Authentication & Users)

- [ ] Setup authentication middleware
- [ ] Create Users table/schema
- [ ] Implement registration endpoint
- [ ] Implement login endpoint
- [ ] Implement logout endpoint
- [ ] Create login UI
- [ ] Create signup UI
- [ ] Implement session management
- [ ] Create protected route middleware

---

## Completed Tasks ✅

- [x] Project vision documented (README.md)
- [x] Tech stack decisions made (PROJECT_CONTEXT.md)
- [x] Architecture overview created (PROJECT_CONTEXT.md)
- [x] Project roadmap created (ROADMAP.md)
- [x] Context files created for AI handoff
- [x] Create TODO list

---

## Notes

### Blockers/Questions

- [ ] Decision: Tailwind CSS vs custom Svelte styles?
- [ ] Decision: Password hashing library? (bcrypt, argon2)
- [ ] Decision: Session storage strategy? (Cookies, D1)
- [ ] Decision: Email service for notifications? (Needed for Phase 1)

### Learning Resources

- [SvelteKit Docs](https://svelte.dev/docs/kit)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [D1 Documentation](https://developers.cloudflare.com/d1/)
- [R2 Documentation](https://developers.cloudflare.com/r2/)

### Links & References

- GitHub Repo: [cfs-cms](https://github.com/yourusername/cfs-cms) (TBD)
- Project Board: TBD
- Figma Designs: TBD

---

**Last Updated**: December 29, 2025  
**Next Review**: January 5, 2026  
**Owner**: Riley
