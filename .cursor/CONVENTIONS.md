# Kanban5000 Conventions

## Code Style

### TypeScript

- Strict mode enabled (`strict: true`)
- No `any` types (use `unknown` if truly unknown)
- Explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `readonly` for immutable properties

### Naming

| Element | Convention | Example |
|---------|------------|---------|
| Files | kebab-case | `workspace.service.ts` |
| Classes | PascalCase | `WorkspaceService` |
| Interfaces | PascalCase with I prefix | `IWorkspaceRepository` |
| Functions | camelCase | `findWorkspaceById` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_WORKSPACE_NAME_LENGTH` |
| Database tables | snake_case, plural | `workspaces` |
| Database columns | snake_case | `created_at` |
| Environment variables | SCREAMING_SNAKE_CASE | `DATABASE_URL` |

### File Organization

```typescript
// 1. External imports (node_modules)
import { z } from 'zod';
import { Kysely } from 'kysely';

// 2. Internal imports (absolute paths)
import { AppError } from '@/core/errors';
import { IAuthService } from '@/modules/auth';

// 3. Relative imports (same module)
import { WorkspaceRepository } from './workspace.repository';
import type { Workspace } from './workspace.types';

// 4. Types/Interfaces
export interface CreateWorkspaceInput { ... }

// 5. Constants
const MAX_NAME_LENGTH = 100;

// 6. Main export (class/function)
export class WorkspaceService { ... }
```

## Backend Conventions

### Module Structure

Every module exports from `index.ts`:

```typescript
// modules/workspace/index.ts
export { WorkspaceService } from './workspace.service';
export { WorkspaceController } from './workspace.controller';
export { workspaceRoutes } from './workspace.routes';
export type { Workspace, CreateWorkspaceInput } from './workspace.types';
```

### Service Methods

```typescript
// Standard CRUD method signatures
class WorkspaceService {
  // List with filtering
  async list(userId: string, filters?: WorkspaceFilters): Promise<Workspace[]>
  
  // Get single by ID
  async findById(userId: string, id: string): Promise<Workspace>
  
  // Create new
  async create(userId: string, input: CreateWorkspaceInput): Promise<Workspace>
  
  // Update existing
  async update(userId: string, id: string, input: UpdateWorkspaceInput): Promise<Workspace>
  
  // Delete
  async delete(userId: string, id: string): Promise<void>
}
```

### Repository Methods

```typescript
// Repository returns domain objects or null, never throws for "not found"
class WorkspaceRepository {
  async findById(id: string): Promise<Workspace | null>
  async findBySlug(slug: string): Promise<Workspace | null>
  async findByOwnerId(ownerId: string): Promise<Workspace[]>
  async create(data: CreateWorkspaceData): Promise<Workspace>
  async update(id: string, data: UpdateWorkspaceData): Promise<Workspace>
  async delete(id: string): Promise<void>
}
```

### Error Messages

```typescript
// Be specific and helpful
throw new NotFoundError(`Workspace with ID '${id}' not found`);
throw new ValidationError('Workspace name must be between 1 and 100 characters');
throw new ForbiddenError(`User '${userId}' lacks permission to delete workspace '${workspaceId}'`);
```

## Frontend Conventions

### Component Files

```typescript
// components/features/workspace-card.tsx
'use client'; // Only if needed

import { Card } from '@/components/ui/card';
import type { Workspace } from '@kanban5000/shared';

interface WorkspaceCardProps {
  workspace: Workspace;
  onSelect?: (id: string) => void;
}

export function WorkspaceCard({ workspace, onSelect }: WorkspaceCardProps) {
  return (
    <Card onClick={() => onSelect?.(workspace.id)}>
      <h3>{workspace.name}</h3>
    </Card>
  );
}
```

### Page Files

```typescript
// app/(auth)/workspaces/page.tsx
import { api } from '@/lib/api';
import { WorkspaceList } from '@/components/features/workspace-list';

export default async function WorkspacesPage() {
  const workspaces = await api.workspaces.list();
  
  return (
    <main>
      <h1>Workspaces</h1>
      <WorkspaceList workspaces={workspaces} />
    </main>
  );
}
```

### CSS Classes

Use Tailwind with consistent ordering:

```tsx
// Layout → Spacing → Sizing → Typography → Colors → Effects
<div className="flex items-center gap-4 p-4 w-full text-sm text-slate-400 bg-surface-card rounded-lg shadow-sm">
```

### Design Tokens

Use CSS variables defined in `tokens.css`:

```tsx
// Colors - use semantic names
className="text-primary-500"        // Teal accent
className="bg-surface"              // Dark background
className="bg-surface-card"         // Card background
className="border-white/10"         // Subtle borders

// Never use raw colors in components
// BAD:  className="bg-[#0d1117]"
// GOOD: className="bg-surface"
```

### Color Palette

| Token | Usage |
|-------|-------|
| `primary-*` | Teal accent (buttons, links, highlights) |
| `surface` | Main dark background |
| `surface-card` | Card/panel backgrounds |
| `surface-elevated` | Elevated surfaces (modals) |
| `text-primary` | White text |
| `text-secondary` | Slate-400 text |
| `text-muted` | Slate-500 text |

### Component Patterns

```tsx
// Button variants
<Button>Primary Action</Button>
<Button variant="secondary">Secondary</Button>

// Status badges with dynamic colors
<span 
  className="px-2 py-0.5 text-xs rounded"
  style={{ 
    backgroundColor: `${status.color}20`,
    color: status.color 
  }}
>
  {status.name}
</span>

// Priority badges
const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#6b7280',
};
```

### Drag & Drop (dnd-kit)

```tsx
// DndContext wrapper
<DndContext onDragEnd={handleDragEnd}>
  <SortableContext items={items}>
    {items.map(item => (
      <SortableItem key={item.id} id={item.id} />
    ))}
  </SortableContext>
</DndContext>

// Sortable item
function SortableItem({ id }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      ...
    </div>
  );
}
```

## Git Conventions

### Branch Names

```
feature/workspace-settings
fix/auth-token-refresh
refactor/database-migrations
chore/update-dependencies
```

### Commit Messages

```
feat(workspace): add settings page
fix(auth): handle expired refresh tokens
refactor(db): migrate to Kysely query builder
chore(deps): update Next.js to 14.1
docs(readme): add deployment instructions
```

Format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`

### Pull Requests

- One logical change per PR
- Reference related issues
- Include test coverage for new features
- Update documentation if needed

## Testing Conventions

### Test Files

```
workspace.service.test.ts    # Unit tests
workspace.integration.test.ts # Integration tests with DB
```

### Test Structure

```typescript
describe('WorkspaceService', () => {
  describe('create', () => {
    it('should create workspace with valid input', async () => {
      // Arrange
      const input = { name: 'Test Workspace' };
      
      // Act
      const result = await service.create(userId, input);
      
      // Assert
      expect(result.name).toBe(input.name);
      expect(result.ownerId).toBe(userId);
    });

    it('should throw ValidationError for empty name', async () => {
      const input = { name: '' };
      
      await expect(service.create(userId, input))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/kanban5000

# Backend
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001

# Auth.js
AUTH_SECRET=your-auth-secret
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
```

## Documentation

### Code Comments

```typescript
// BAD: Comments that describe what code does
// Loop through users
for (const user of users) { ... }

// GOOD: Comments that explain why
// Process users in batches to avoid memory issues with large datasets
for (const batch of chunk(users, 100)) { ... }
```

### JSDoc for Public APIs

```typescript
/**
 * Creates a new workspace for the authenticated user.
 * 
 * @param userId - The ID of the user creating the workspace
 * @param input - Workspace creation parameters
 * @returns The created workspace
 * @throws {ValidationError} If the workspace name is invalid
 * @throws {ForbiddenError} If the user has reached their workspace limit
 */
async create(userId: string, input: CreateWorkspaceInput): Promise<Workspace>
```

