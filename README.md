# Kanban5000

A fast, minimal, developer-friendly issue tracker with AI assistance, deep Git integrations, and an architecture that scales linearly with usage.

## Tech Stack

- **Backend**: Node.js 20, Express (as HTTP primitive), TypeScript
- **Frontend**: Next.js 14 (App Router), React 19, Tailwind CSS
- **Database**: PostgreSQL 16 with Kysely (type-safe SQL)
- **Auth**: Auth.js v5 (OAuth transport) + custom backend identity
- **Monorepo**: pnpm workspaces

## Architecture

```
kanban5000/
├── packages/
│   ├── backend/          # Node.js API server
│   │   └── src/
│   │       ├── core/     # Custom framework (HTTP, routing, DI, errors)
│   │       ├── modules/  # Feature modules (auth, workspace)
│   │       └── infra/    # Database, logging
│   ├── frontend/         # Next.js app
│   ├── api-client/       # Generated TypeScript SDK
│   └── shared/           # Shared Zod schemas
├── docker-compose.yml    # PostgreSQL + Redis
└── .cursor/              # AI rules and architecture docs
```

### Key Architectural Decisions

1. **Express as HTTP Primitive**: Express only handles parsing and routing. Our `core/` layer provides typed abstractions—controllers never see `req`/`res`.

2. **Auth.js at Arm's Length**: Auth.js handles OAuth flows only. The backend owns all identity (users, roles, permissions).

3. **Generated SDK**: Frontend uses a TypeScript SDK generated from OpenAPI spec—no direct fetch or database access.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

### Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Environment Variables

Create `.env` files in `packages/backend` and `packages/frontend`:

**Backend** (`packages/backend/.env`):
```
DATABASE_URL=postgresql://kanban:kanban@localhost:5432/kanban5000
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
```

**Frontend** (`packages/frontend/.env.local`):
```
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=your-auth-secret
AUTH_GITHUB_ID=your-github-oauth-id
AUTH_GITHUB_SECRET=your-github-oauth-secret
```

### Development URLs

- Frontend: http://localhost:3002
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Scripts

```bash
# Run all dev servers
pnpm dev

# Run database migrations
pnpm db:migrate

# Create new migration
pnpm db:migrate:create -- migration_name

# Generate OpenAPI spec + SDK
pnpm generate:api

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

## Project Structure

### Backend Modules

Each module follows a consistent pattern:

```
modules/workspace/
├── workspace.repository.ts  # Data access (Kysely)
├── workspace.service.ts     # Business logic
├── workspace.controller.ts  # HTTP handlers
├── workspace.routes.ts      # Route definitions + OpenAPI
├── workspace.types.ts       # Types
└── index.ts                 # Exports
```

### Frontend Routes

- `/` - Landing page
- `/login` - Authentication
- `/workspaces` - List workspaces (auth required)
- `/workspaces/new` - Create workspace
- `/workspaces/[id]` - Workspace detail
- `/workspaces/[id]/settings` - Workspace settings

## Documentation

See `.cursor/` directory for detailed architectural documentation:

- [Architecture Overview](.cursor/ARCHITECTURE.md)
- [Code Conventions](.cursor/CONVENTIONS.md)
- [Backend Rules](.cursor/rules/backend.mdc)
- [Frontend Rules](.cursor/rules/frontend.mdc)
- [Database Rules](.cursor/rules/database.mdc)
- [Auth Rules](.cursor/rules/auth.mdc)

## Roadmap

### Phase 1 - Foundations (Current)
- [x] Workspaces, users, authentication
- [ ] Projects, issues, comments
- [ ] Custom statuses + workflow engine
- [ ] GitHub/GitLab integration

### Phase 2 - Scalable Core
- [ ] Full-text search
- [ ] Redis caching
- [ ] Attachments (S3)
- [ ] Real-time updates (WebSocket)

### Phase 3 - Advanced Features
- [ ] Workflow engine
- [ ] Notifications
- [ ] Analytics

### Phase 4 - Operations
- [ ] CI/CD pipeline
- [ ] Observability
- [ ] Multi-tenancy

## License

MIT

