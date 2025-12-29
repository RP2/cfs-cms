# Contributing to CFS CMS

Thank you for your interest in contributing to CFS CMS! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Read the documentation**: Start with [README.md](README.md) and [docs/START_HERE.md](docs/START_HERE.md)
4. **Set up locally**: Follow [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
5. **Create a feature branch**: `git checkout -b feature/your-feature-name`

## Development Workflow

### Before You Start

1. **Check [docs/TODO.md](docs/TODO.md)** - See what's planned for the current phase
2. **Check [docs/ROADMAP.md](docs/ROADMAP.md)** - Understand the phase context
3. **Discuss major changes** - Open an issue first for significant features

### Code Standards

- **TypeScript**: Use strict mode, no `any` type
- **Components**: One component per file in `src/lib/components/`
- **Services**: Business logic in `src/lib/services/`
- **Types**: All types defined in `src/lib/types/`
- **Naming**: Follow conventions in [.cursorrules](.cursorrules) or [.github/copilot-instructions.md](.github/copilot-instructions.md)

### Code Quality

```bash
# Type checking
npm run check

# Linting
npm run lint

# Format code
npm run format
```

All code must pass type checking and linting before submitting a PR.

## Commit Messages

Use conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: code style changes
refactor: refactor code
test: add tests
chore: maintenance tasks
```

Example:

```
feat: create user authentication flow
docs: update DEVELOPMENT.md with setup steps
```

## Pull Request Process

1. **Update your branch**: `git pull origin main`
2. **Test locally**: Run `npm run dev` and test your changes
3. **Create a PR** with:
   - Clear title (following commit message style)
   - Description of changes
   - Link to any related issues
   - Screenshots if UI changes
4. **Address feedback**: Respond to review comments
5. **Merge**: Maintainers will merge when ready

## PR Title Format

```
[phase] feature: description
feat: description
fix: description
docs: description
```

Example: `[Phase 1] feat: implement user login form`

## Questions?

- **Architecture questions**: Check [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)
- **Tech stack questions**: See [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md#technology-decisions)
- **Development help**: Read [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
- **Database questions**: Check [docs/DATABASE.md](docs/DATABASE.md)

## Code of Conduct

- Be respectful and inclusive
- Welcome new contributors
- Focus on what's best for the project
- Give credit where due

## License

By contributing to CFS CMS, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
