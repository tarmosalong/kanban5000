# Kanban5000 Architecture

## Overview

Kanban5000 is a fast, minimal, developer-friendly issue tracker with AI assistance and deep Git integrations.

## Project Structure

```
kanban5000/
├── packages/
│   ├── backend/                 # Node.js/TypeScript API server
│   │   └── src/
│   │       ├── core/           # Custom application framework
│   │       │   ├── http/       # Request/response abstractions
│   │       │   ├── routing/    # Declarative route builder
│   │       │   ├── container/  # Simple DI container
│   │       │   └── errors/     # Typed error hierarchy
│   │       ├── modules/        # Feature modules
│   │       │   ├── auth/       # Identity, sessions, permissions
│   │       │   ├── workspace/  # Multi-tenant workspaces
│   │       │   ├── project/    # Projects, statuses, labels
│   │       │   ├── issue/      # Issues, full-text search
│   │       │   ├── comment/    # Issue comments
│   │       │   └── label/      # Label management
│   │       ├── infra/          # Infrastructure (db, logging)
│   │       └── index.ts        # Bootstrap only
│   ├── frontend/               # Next.js 14 App Router
│   │   ├── app/               # Routes (thin, calls SDK)
│   │   │   ├── (auth)/        # Authenticated routes
│   │   │   │   └── workspaces/
│   │   │   │       └── [id]/
│   │   │   │           └── projects/
│   │   │   │               └── [projectId]/
│   │   │   │                   ├── page.tsx      # Kanban board
│   │   │   │                   └── settings/     # Statuses, labels
│   │   │   └── api/           # API route handlers
│   │   ├── components/
│   │   │   ├── kanban/        # Board, column, card components
│   │   │   ├── search/        # Search box with dropdown
│   │   │   ├── nav/           # Navigation bar
│   │   │   └── ui/            # Buttons, inputs, cards
│   │   └── lib/               # SDK instance, auth helpers
│   ├── api-client/            # Generated TypeScript SDK
│   │   └── src/generated/     # Auto-generated from OpenAPI
│   └── shared/                # Shared Zod schemas + types
├── docker-compose.yml
└── package.json               # pnpm workspaces root
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend Runtime | Node.js 20 LTS |
| HTTP Layer | Express (low-level HTTP only) |
| Application Framework | Custom (controllers, routing, DI) |
| Database | PostgreSQL 16 |
| Migrations | node-pg-migrate |
| Query Builder | Kysely (type-safe SQL) |
| Full-text Search | PostgreSQL FTS (tsvector, GIN) |
| Frontend | Next.js 14 (App Router) |
| UI Framework | React 19, Tailwind CSS |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Auth Transport | Auth.js v5 (OAuth/session cookies only) |
| Identity/Permissions | Custom backend models + JWT |
| Frontend-to-Backend | Generated SDK from OpenAPI |
| OpenAPI Generation | @asteasolutions/zod-to-openapi |
| SDK Generation | openapi-typescript-codegen |
| Validation | Zod (shared schemas) |
| Monorepo | pnpm workspaces |

## Implemented Features

### Backend Modules

| Module | Features |
|--------|----------|
| **auth** | OAuth sync, JWT issuance, developer login, permission checks |
| **workspace** | CRUD, membership, settings |
| **project** | CRUD, custom statuses, status reordering, labels |
| **issue** | CRUD, priorities, assignees, full-text search |
| **comment** | CRUD on issues |
| **label** | CRUD per project |

### Frontend Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `KanbanBoard` | `components/kanban/` | Drag-and-drop board with columns |
| `KanbanColumn` | `components/kanban/` | Droppable column container |
| `KanbanCard` | `components/kanban/` | Draggable issue card |
| `IssueCard` | `components/kanban/` | Issue display with labels |
| `SearchBox` | `components/search/` | Global search with dropdown |
| `NavBar` | `components/nav/` | Main navigation with search |
| `Button` | `components/ui/` | Primary/secondary button variants |
| `Input` | `components/ui/` | Form input field |
| `Card` | `components/ui/` | Container card |

### UI Features

- **Kanban Board** with drag-and-drop (`@dnd-kit`)
- **Filters** by priority, assignee, label
- **Full-text Search** with PostgreSQL FTS
- **Status Reordering** via drag-and-drop in settings
- **Color-coded labels** per project
- **Priority badges** (Urgent, High, Medium, Low)

## Architectural Principles

### 1. Express as HTTP Primitive

Express handles only: parsing, routing dispatch, middleware chaining. Our `core/` layer provides:

- **`core/http/`**: `AppRequest<TBody, TParams, TQuery>` and `AppResponse<T>` typed wrappers
- **`core/routing/`**: Declarative route builder that registers handlers, extracts OpenAPI metadata
- **`core/container/`**: Simple DI container (interfaces in, implementations registered at bootstrap)
- **`core/errors/`**: `AppError` hierarchy (NotFoundError, ValidationError, etc.) with HTTP status mapping

Controllers return plain objects or throw `AppError`. They never see Express `req`/`res`.

### 2. Auth.js at Arm's Length

Auth.js is a transport layer only. Backend owns all identity:

```
Auth.js (Next.js)          Backend API              PostgreSQL
─────────────────          ───────────              ──────────
OAuth flow ──────────────▶ POST /auth/sync ───────▶ users table
Session cookie             (creates/updates user)   roles table
                                                   permissions table
                           ◀────────────────────── 
                           Returns backend JWT
```

- Auth.js `signIn` callback calls backend `/auth/sync` with provider profile
- Backend creates/updates `User`, returns a backend-issued JWT
- JWT stored in Auth.js session, forwarded on API calls
- All permission checks in backend service layer via `AuthService.can(userId, action, resource)`

### 3. Generated API Client (No Direct DB from Next.js)

```
Zod Schemas ──▶ OpenAPI Spec ──▶ TypeScript SDK ──▶ Next.js
(shared/)       (backend gen)    (api-client/)      (frontend/)
```

- Backend routes annotated with Zod schemas auto-generate OpenAPI spec
- SDK generated at build time, lives in `packages/api-client`
- Next.js imports SDK, never raw fetch to backend
- SDK handles: auth headers, error typing, request/response transforms

## Module Architecture

Each backend feature module follows this structure:

```
modules/project/
├── project.repository.ts   # Data access (Kysely queries)
├── project.service.ts      # Business logic
├── project.controller.ts   # HTTP handlers (thin, calls service)
├── project.routes.ts       # Route definitions + OpenAPI schemas
├── project.types.ts        # Module-specific types
└── index.ts                # Public exports
```

### Layer Responsibilities

| Layer | Responsibility | Depends On |
|-------|---------------|------------|
| Controller | Extract request data, call service, return data | Service |
| Service | Business logic, validation, orchestration | Repository, AuthService |
| Repository | Data access, mapping to domain objects | Database |

### Dependency Flow

```
Controller → Service → Repository → Database
     ↓           ↓
  AuthMiddleware  AuthService
```

## Database Schema

### Core Tables

```sql
-- Users and permissions
users              -- id, email, name, image, provider, provider_id
roles              -- id, name (admin, member, viewer)
permissions        -- id, name (workspace:*, project:*, issue:*)
role_permissions   -- role_id, permission_id
user_roles         -- user_id, role_id, workspace_id

-- Multi-tenant structure
workspaces         -- id, name, slug, owner_id, settings (JSONB)
workspace_members  -- workspace_id, user_id, role

-- Projects and issues
projects           -- id, workspace_id, name, slug, description, color
issue_statuses     -- id, project_id, name, color, position, is_default
labels             -- id, project_id, name, color
issues             -- id, project_id, status_id, number, title, description, priority, assignee_id
issue_labels       -- issue_id, label_id
issue_history      -- id, issue_id, user_id, field, old_value, new_value
comments           -- id, issue_id, user_id, content
```

### Full-text Search

Issues use PostgreSQL FTS with a computed `search_vector` column:

```sql
ALTER TABLE issues ADD COLUMN search_vector tsvector;
CREATE INDEX issues_search_idx ON issues USING GIN (search_vector);

-- Trigger updates search_vector on title/description change
```

### Conventions

- Tables: `snake_case`, plural (`workspaces`, `user_roles`)
- Columns: `snake_case` (`created_at`, `owner_id`)
- Primary keys: UUID with `DEFAULT gen_random_uuid()`
- Timestamps: `created_at` and `updated_at` on every table
- JSONB: For settings, metadata, custom fields (with GIN indexes)

## API Design

RESTful endpoints with consistent response format:

```
GET    /api/workspaces                    → { data: Workspace[] }
POST   /api/workspaces                    → { data: Workspace }
GET    /api/workspaces/:id                → { data: Workspace }
PATCH  /api/workspaces/:id                → { data: Workspace }
DELETE /api/workspaces/:id                → { success: true }

GET    /api/workspaces/:id/projects       → { data: Project[] }
POST   /api/workspaces/:id/projects       → { data: Project }

GET    /api/projects/:id                  → { data: Project }
GET    /api/projects/:id/statuses         → { data: IssueStatus[] }
POST   /api/projects/:id/statuses         → { data: IssueStatus }
PUT    /api/projects/:id/statuses/order   → { data: IssueStatus[] }
GET    /api/projects/:id/labels           → { data: Label[] }

GET    /api/projects/:id/issues           → { data: Issue[] }
GET    /api/projects/:id/issues/search    → { data: Issue[] }
POST   /api/projects/:id/issues           → { data: Issue }

GET    /api/issues/:id                    → { data: Issue }
PATCH  /api/issues/:id                    → { data: Issue }

GET    /api/issues/:id/comments           → { data: Comment[] }
POST   /api/issues/:id/comments           → { data: Comment }
```

## Error Handling

All errors extend `AppError`:

```typescript
abstract class AppError extends Error {
  abstract statusCode: number;
  abstract code: string;
}

class NotFoundError extends AppError {
  statusCode = 404;
  code = 'NOT_FOUND';
}

class ValidationError extends AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
}

class UnauthorizedError extends AppError {
  statusCode = 401;
  code = 'UNAUTHORIZED';
}

class ForbiddenError extends AppError {
  statusCode = 403;
  code = 'FORBIDDEN';
}
```

Error handler middleware catches all errors and formats response:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Workspace not found",
    "details": {}
  }
}
```

## Frontend Architecture

### Page Structure

```
app/(auth)/workspaces/[id]/projects/[projectId]/page.tsx
├── State: project, statuses, issues, labels, filters
├── Data fetching: useCallback + Promise.all
├── Filter logic: useMemo for filteredIssues
└── Render: Header → Filter bar → KanbanBoard
```

### Kanban Board Flow

```
KanbanBoard (DndContext)
├── onDragStart → highlight dropzones
├── onDragEnd → call onIssueMove(issueId, newStatusId)
└── KanbanColumn (useDroppable)
    └── KanbanCard (useDraggable)
        └── IssueCard (display only)
```

### Filter Implementation

Filters are client-side for fast UX:

```typescript
const filteredIssues = useMemo(() => {
  return issues.filter((issue) => {
    if (filters.priority && issue.priority !== filters.priority) return false;
    if (filters.assigneeId && issue.assignee?.id !== filters.assigneeId) return false;
    if (filters.labelId && !issue.labels.includes(filters.labelId)) return false;
    return true;
  });
}, [issues, filters]);
```

## Future Scalability

The architecture supports future growth:

1. **Database**: pgbouncer, read replicas, table partitioning
2. **Caching**: Redis layer for hot data
3. **Search**: Migrate from Postgres FTS to Elasticsearch/Meilisearch if needed
4. **Events**: Migrate from NOTIFY/LISTEN to Kafka/RabbitMQ
5. **Services**: Extract modules into microservices when bottlenecks appear
6. **Real-time**: WebSocket for live updates

## See Also

- [Backend Rules](./rules/backend.mdc)
- [Frontend Rules](./rules/frontend.mdc)
- [Database Rules](./rules/database.mdc)
- [Auth Rules](./rules/auth.mdc)
- [Conventions](./CONVENTIONS.md)
