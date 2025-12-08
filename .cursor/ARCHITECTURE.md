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
│   │       │   └── workspace/  # First domain module
│   │       ├── infra/          # Infrastructure (db, logging)
│   │       └── index.ts        # Bootstrap only
│   ├── frontend/               # Next.js 14 App Router
│   │   ├── app/               # Routes (thin, calls SDK)
│   │   ├── components/        # React components
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
| Frontend | Next.js 14 (App Router) |
| Auth Transport | Auth.js v5 (OAuth/session cookies only) |
| Identity/Permissions | Custom backend models |
| Frontend-to-Backend | Generated SDK from OpenAPI |
| OpenAPI Generation | @asteasolutions/zod-to-openapi |
| SDK Generation | openapi-typescript-codegen |
| Validation | Zod (shared schemas) |
| Monorepo | pnpm workspaces |

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
modules/workspace/
├── workspace.repository.ts   # Data access (Kysely queries)
├── workspace.service.ts      # Business logic
├── workspace.controller.ts   # HTTP handlers (thin, calls service)
├── workspace.routes.ts       # Route definitions + OpenAPI schemas
├── workspace.types.ts        # Module-specific types
└── index.ts                  # Public exports
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

## Data Flow

### Read Operation

```
1. HTTP Request arrives
2. Express parses JSON, routes to handler
3. Auth middleware validates JWT, attaches user to request
4. RouteBuilder wraps Express req into AppRequest
5. Controller extracts params, calls service.findById(id)
6. Service checks permissions via AuthService
7. Service calls repository.findById(id)
8. Repository executes Kysely query
9. Repository maps row to domain object
10. Service returns domain object
11. Controller returns { data: workspace }
12. Framework serializes to JSON response
```

### Write Operation with Validation

```
1. HTTP Request with JSON body arrives
2. Express parses JSON
3. RouteBuilder validates body against Zod schema
4. Validation fails → ValidationError thrown → 400 response
5. Validation passes → Controller receives typed body
6. Controller calls service.create(body)
7. Service checks permissions
8. Service calls repository.create(data)
9. Repository inserts row, returns domain object
10. Service returns created object
11. Controller returns { data: created }
12. Framework serializes to 201 JSON response
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

## Database Schema Conventions

- Tables: `snake_case`, plural (`workspaces`, `user_roles`)
- Columns: `snake_case` (`created_at`, `owner_id`)
- Primary keys: UUID with `DEFAULT gen_random_uuid()`
- Timestamps: `created_at` and `updated_at` on every table
- JSONB: For settings, metadata, custom fields (with GIN indexes)

## API Design

RESTful endpoints with consistent response format:

```
GET    /api/workspaces          → { data: Workspace[] }
POST   /api/workspaces          → { data: Workspace }
GET    /api/workspaces/:id      → { data: Workspace }
PATCH  /api/workspaces/:id      → { data: Workspace }
DELETE /api/workspaces/:id      → { success: true }
```

## Future Scalability

The architecture supports future growth:

1. **Database**: pgbouncer, read replicas, table partitioning
2. **Caching**: Redis layer for hot data
3. **Search**: Migrate from Postgres FTS to Elasticsearch/Meilisearch
4. **Events**: Migrate from NOTIFY/LISTEN to Kafka/RabbitMQ
5. **Services**: Extract modules into microservices when bottlenecks appear

## See Also

- [Backend Rules](./rules/backend.mdc)
- [Frontend Rules](./rules/frontend.mdc)
- [Database Rules](./rules/database.mdc)
- [Auth Rules](./rules/auth.mdc)
- [Conventions](./CONVENTIONS.md)

