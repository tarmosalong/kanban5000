# Kanban5000

A fast, minimal, developer-friendly issue tracker with AI assistance, deep Git integrations, and an architecture that scales linearly with usage.

## ✨ Features

### Core
- **Workspaces** - Multi-tenant organization structure
- **Projects** - Group issues with custom colors and settings
- **Issues** - Full CRUD with priorities, assignees, due dates
- **Comments** - Discussions on issues
- **Labels** - Customizable tags per project
- **Custom Statuses** - Configurable Kanban columns per project

### Kanban Board
- **Drag & Drop** - Move issues between columns with `@dnd-kit`
- **Filters** - Filter by priority, assignee, or label
- **Status Reordering** - Drag to reorder Kanban columns in settings

### Search & Navigation
- **Full-text Search** - PostgreSQL FTS for instant issue search
- **Global Search** - `⌘K` to search across all issues

### Developer Experience
- **TypeScript End-to-End** - Full type safety from DB to UI
- **Generated SDK** - OpenAPI spec → TypeScript client
- **Monorepo** - pnpm workspaces for clean package boundaries

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js 20, Express (HTTP primitive), TypeScript |
| Frontend | Next.js 14 (App Router), React 19, Tailwind CSS |
| Database | PostgreSQL 16, Kysely (type-safe SQL) |
| Auth | Auth.js v5 (OAuth) + Custom JWT |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Monorepo | pnpm workspaces |

## Architecture

```
kanban5000/
├── packages/
│   ├── backend/          # Node.js API server
│   │   └── src/
│   │       ├── core/     # Custom framework (HTTP, routing, DI, errors)
│   │       ├── modules/  # Feature modules
│   │       │   ├── auth/
│   │       │   ├── workspace/
│   │       │   ├── project/
│   │       │   ├── issue/
│   │       │   ├── comment/
│   │       │   └── label/
│   │       └── infra/    # Database, logging
│   ├── frontend/         # Next.js app
│   │   ├── app/          # Routes
│   │   └── components/
│   │       ├── kanban/   # Board, columns, cards
│   │       ├── search/   # Search box
│   │       ├── nav/      # Navigation
│   │       └── ui/       # Buttons, inputs, cards
│   ├── api-client/       # Generated TypeScript SDK
│   └── shared/           # Shared Zod schemas
├── docker-compose.yml    # PostgreSQL + Redis
└── .cursor/              # AI rules and architecture docs
```

### Key Architectural Decisions

1. **Express as HTTP Primitive** - Express only handles parsing and routing. Our `core/` layer provides typed abstractions—controllers never see `req`/`res`.

2. **Auth.js at Arm's Length** - Auth.js handles OAuth flows only. The backend owns all identity (users, roles, permissions).

3. **Generated SDK** - Frontend uses a TypeScript SDK generated from OpenAPI spec—no direct fetch or database access.

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
cd packages/backend
DATABASE_URL="postgresql://kanban:kanban@localhost:5433/kanban5000" pnpm db:migrate up

# Start development servers (in separate terminals)
# Backend:
cd packages/backend
DATABASE_URL="postgresql://kanban:kanban@localhost:5433/kanban5000" pnpm dev

# Frontend:
cd packages/frontend
pnpm dev
```

### Environment Variables

**Backend** (`packages/backend/.env`):
```env
DATABASE_URL=postgresql://kanban:kanban@localhost:5433/kanban5000
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
```

**Frontend** (`packages/frontend/.env.local`):
```env
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
AUTH_SECRET=your-auth-secret
AUTH_GITHUB_ID=your-github-oauth-id
AUTH_GITHUB_SECRET=your-github-oauth-secret
```

### Development URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3002 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |

### Demo Login

For development, use the credentials login:
- Email: `alice@example.com` (or any email with sample data)
- Password: `password`

## API Endpoints

### Auth
- `POST /auth/sync` - Sync OAuth user to backend
- `POST /auth/dev-login` - Developer login (dev mode only)

### Workspaces
- `GET /workspaces` - List user's workspaces
- `POST /workspaces` - Create workspace
- `GET /workspaces/:id` - Get workspace
- `PATCH /workspaces/:id` - Update workspace
- `DELETE /workspaces/:id` - Delete workspace

### Projects
- `GET /workspaces/:id/projects` - List projects in workspace
- `POST /workspaces/:id/projects` - Create project
- `GET /projects/:id` - Get project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `GET /projects/:id/statuses` - Get project statuses
- `POST /projects/:id/statuses` - Create status
- `PUT /projects/:id/statuses/order` - Reorder statuses
- `GET /projects/:id/labels` - Get project labels
- `POST /projects/:id/labels` - Create label

### Issues
- `GET /projects/:id/issues` - List issues
- `POST /projects/:id/issues` - Create issue
- `GET /projects/:projectId/issues/search` - Search issues
- `GET /issues/:id` - Get issue
- `PATCH /issues/:id` - Update issue
- `DELETE /issues/:id` - Delete issue

### Comments
- `GET /issues/:id/comments` - List comments
- `POST /issues/:id/comments` - Create comment
- `PATCH /comments/:id` - Update comment
- `DELETE /comments/:id` - Delete comment

## Scripts

```bash
# Run all dev servers
pnpm dev

# Run database migrations
pnpm db:migrate

# Generate OpenAPI spec + SDK
pnpm generate:api

# Run linting
pnpm lint

# Run type checking
pnpm typecheck
```

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/workspaces` or `/login` |
| `/login` | Authentication page |
| `/workspaces` | List all workspaces |
| `/workspaces/new` | Create workspace form |
| `/workspaces/[id]` | Workspace with projects list |
| `/workspaces/[id]/settings` | Workspace settings |
| `/workspaces/[id]/projects/new` | Create project form |
| `/workspaces/[id]/projects/[projectId]` | Kanban board |
| `/workspaces/[id]/projects/[projectId]/settings` | Project settings (statuses, labels) |
| `/workspaces/[id]/projects/[projectId]/issues/new` | Create issue form |
| `/workspaces/[id]/projects/[projectId]/issues/[issueId]` | Issue detail |

## Documentation

See `.cursor/` directory for detailed architectural documentation:

- [Architecture Overview](.cursor/ARCHITECTURE.md)
- [Code Conventions](.cursor/CONVENTIONS.md)
- [Backend Rules](.cursor/rules/backend.mdc)
- [Frontend Rules](.cursor/rules/frontend.mdc)
- [Database Rules](.cursor/rules/database.mdc)
- [Auth Rules](.cursor/rules/auth.mdc)

## Roadmap

### Phase 1 - Foundations ✅
- [x] Workspaces, users, authentication
- [x] Projects with custom colors
- [x] Issues with priorities, assignees
- [x] Comments on issues
- [x] Custom statuses (Kanban columns)
- [x] Labels per project
- [x] Drag-and-drop Kanban board
- [x] Full-text search
- [x] Filters (priority, assignee, label)
- [x] Status reordering

### Phase 2 - Enhanced UX
- [ ] Quick issue creation (inline)
- [ ] Keyboard shortcuts
- [ ] Due date warnings
- [ ] Issue history/activity log
- [ ] Markdown support in descriptions

### Phase 3 - Integrations
- [ ] GitHub integration
- [ ] GitLab integration
- [ ] Webhooks

### Phase 4 - Scalability
- [ ] Redis caching
- [ ] File attachments (S3)
- [ ] Real-time updates (WebSocket)
- [ ] CI/CD pipeline

## License

MIT
